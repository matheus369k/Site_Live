const Chat = require('../models/Chat');
const User = require('../models/User');
const Model = require('../models/Model');
const socket = require('../services/socket');

/**
 * @desc    Inicia um novo chat
 * @route   POST /api/chats
 * @access  Private
 */
exports.startChat = async (req, res) => {
    try {
        const { modelId } = req.body;
        const clientId = req.user.id;

        // Verifica se o modelo existe e está ativo
        const model = await Model.findOne({ user: modelId });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Modelo não encontrada'
            });
        }

        // Verifica se já existe um chat ativo
        let chat = await Chat.findOne({
            model: modelId,
            client: clientId,
            status: 'active'
        });

        if (chat) {
            return res.status(200).json({
                success: true,
                data: chat
            });
        }

        // Cria novo chat
        chat = await Chat.create({
            model: modelId,
            client: clientId,
            messages: [{
                sender: clientId,
                content: 'Chat iniciado',
                type: 'system'
            }]
        });

        // Carrega os dados do chat com as referências
        chat = await chat.populate([
            { path: 'model', select: 'name profilePhoto' },
            { path: 'client', select: 'name profilePhoto' }
        ]);

        // Notifica o modelo sobre o novo chat
        socket.sendToUser(modelId, 'new_chat', {
            chatId: chat._id,
            client: {
                id: req.user.id,
                name: req.user.name,
                profilePhoto: req.user.profilePhoto
            }
        });

        res.status(201).json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error('Erro ao iniciar chat:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao iniciar chat',
            error: error.message
        });
    }
};

/**
 * @desc    Envia uma mensagem
 * @route   POST /api/chats/:chatId/messages
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Busca o chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat não encontrado'
            });
        }

        // Verifica se o usuário tem acesso ao chat
        if (!chat.canAccessChat(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado a este chat'
            });
        }

        // Verifica se pode enviar mensagem
        const canSend = chat.canSendMessage(userId);
        if (!canSend.canSend) {
            return res.status(403).json({
                success: false,
                message: canSend.reason
            });
        }

        // Adiciona a mensagem
        chat.messages.push({
            sender: userId,
            content,
            type: 'text'
        });

        // Atualiza contadores e timestamps
        if (userId.toString() === chat.client.toString()) {
            chat.clientMessageCount++;
            chat.lastClientMessage = Date.now();
        } else {
            chat.modelMessageCount++;
            chat.lastModelMessage = Date.now();
        }

        chat.messageCount++;
        chat.lastMessage = Date.now();

        await chat.save();

        // Notifica os participantes
        const messageData = {
            chatId,
            message: {
                sender: userId,
                content,
                createdAt: new Date(),
                type: 'text'
            }
        };

        if (userId.toString() === chat.client.toString()) {
            socket.sendToUser(chat.model.toString(), 'new_message', messageData);
        } else {
            socket.sendToUser(chat.client.toString(), 'new_message', messageData);
        }

        res.status(200).json({
            success: true,
            data: chat.messages[chat.messages.length - 1]
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem',
            error: error.message
        });
    }
};

/**
 * @desc    Lista chats do usuário
 * @route   GET /api/chats
 * @access  Private
 */
exports.getChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status = 'active' } = req.query;

        // Define o filtro base
        const filter = {
            status,
            $or: [{ model: userId }, { client: userId }]
        };

        // Busca os chats
        const chats = await Chat.find(filter)
            .populate([
                { path: 'model', select: 'name profilePhoto' },
                { path: 'client', select: 'name profilePhoto' }
            ])
            .select('-messages') // Não carrega as mensagens na listagem
            .sort('-lastMessage');

        res.status(200).json({
            success: true,
            count: chats.length,
            data: chats
        });
    } catch (error) {
        console.error('Erro ao listar chats:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar chats',
            error: error.message
        });
    }
};

/**
 * @desc    Obtém detalhes de um chat
 * @route   GET /api/chats/:chatId
 * @access  Private
 */
exports.getChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Busca o chat com as mensagens
        const chat = await Chat.findById(chatId)
            .populate([
                { path: 'model', select: 'name profilePhoto' },
                { path: 'client', select: 'name profilePhoto' }
            ]);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat não encontrado'
            });
        }

        // Verifica se o usuário tem acesso ao chat
        if (!chat.canAccessChat(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado a este chat'
            });
        }

        // Marca mensagens como lidas
        if (chat.messages.length > 0) {
            chat.messages.forEach(msg => {
                if (msg.sender.toString() !== userId && !msg.readAt) {
                    msg.readAt = new Date();
                }
            });
            await chat.save();
        }

        res.status(200).json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error('Erro ao obter chat:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter chat',
            error: error.message
        });
    }
};

/**
 * @desc    Bloqueia/Desbloqueia um chat
 * @route   PUT /api/chats/:chatId/block
 * @access  Private
 */
exports.toggleBlockChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        // Busca o chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat não encontrado'
            });
        }

        // Verifica se o usuário tem acesso ao chat
        if (!chat.canAccessChat(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado a este chat'
            });
        }

        // Apenas a modelo pode bloquear/desbloquear
        if (chat.model.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Apenas a modelo pode bloquear/desbloquear o chat'
            });
        }

        // Toggle do status
        if (chat.status === 'blocked') {
            await chat.unblock();
            socket.sendToChat(chatId, 'chat_unblocked', {
                chatId,
                unblockerId: userId
            });
        } else {
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Motivo do bloqueio é obrigatório'
                });
            }
            await chat.block(userId, reason);
            socket.sendToChat(chatId, 'chat_blocked', {
                chatId,
                blockerId: userId,
                reason
            });
        }

        res.status(200).json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error('Erro ao alterar status do chat:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao alterar status do chat',
            error: error.message
        });
    }
};
