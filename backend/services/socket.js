const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');

let io;
const connectedUsers = new Map();

/**
 * Inicializa o Socket.io com o servidor HTTP
 * @param {Object} server - Servidor HTTP
 */
function init(server) {
    io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Middleware de autenticação
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // Gerenciamento de conexões
    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.userId}`);
        
        // Registrar usuário como online
        connectedUsers.set(socket.userId, socket.id);
        
        // Adiciona usuário à sua sala privada
        socket.join(`user:${socket.userId}`);
        
        // Notificar outros usuários que este usuário está online
        io.emit('user_status', { userId: socket.userId, online: true });

        // Entrar em todas as salas de chat do usuário
        const userChats = await Chat.find({
            $or: [
                { model: socket.userId },
                { client: socket.userId }
            ]
        });

        userChats.forEach(chat => {
            socket.join(`chat:${chat._id}`);
        });

        // Eventos de chat
        socket.on('join_chat', async (chatId) => {
            socket.join(`chat:${chatId}`);
        });

        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
        });

        // Desconexão
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
            connectedUsers.delete(socket.userId);
            io.emit('user_status', { userId: socket.userId, online: false });
        });
    });
}

/**
 * Envia uma mensagem para um usuário específico
 * @param {string} userId - ID do usuário
 * @param {string} event - Nome do evento
 * @param {Object} data - Dados a serem enviados
 */
function sendToUser(userId, event, data) {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
        io.to(`user:${userId}`).emit(event, data);
    }
}

/**
 * Envia uma mensagem para todos os participantes de um chat
 * @param {string} chatId - ID do chat
 * @param {string} event - Nome do evento
 * @param {Object} data - Dados a serem enviados
 */
function sendToChat(chatId, event, data) {
    io.to(`chat:${chatId}`).emit(event, data);
}

/**
 * Retorna o objeto io do Socket.io
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

/**
 * Verifica se um usuário está online
 * @param {string} userId - ID do usuário
 * @returns {boolean} True se o usuário está online, false caso contrário
 */
function isUserOnline(userId) {
    return connectedUsers.has(userId);
}

module.exports = {
    init,
    sendToUser,
    sendToChat,
    getIO,
    isUserOnline
};
