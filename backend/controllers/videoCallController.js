const VideoCall = require('../models/VideoCall');
const Model = require('../models/Model');
const User = require('../models/User');
const Payment = require('../models/Payment');
const dailyService = require('../services/dailyService');
const socketService = require('../services/socket');

// @desc    Agendar videochamada
// @route   POST /api/video-calls/schedule
// @access  Private (clientes)
exports.scheduleCall = async (req, res) => {
    try {
        const { modelId, scheduledFor, duration, paymentId } = req.body;

        // Verifica pagamento
        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Pagamento não encontrado ou não confirmado'
            });
        }

        // Verifica modelo
        const model = await Model.findById(modelId);
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Modelo não encontrada'
            });
        }

        // Verifica disponibilidade
        const scheduledDate = new Date(scheduledFor);
        const isAvailable = await model.checkAvailability(scheduledDate, duration);
        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Horário não disponível'
            });
        }

        // Cria sala no Daily
        const room = await dailyService.createRoom(modelId, req.user.id, duration);

        // Cria registro da chamada
        const videoCall = await VideoCall.create({
            model: modelId,
            client: req.user.id,
            roomName: room.name,
            scheduledFor: scheduledDate,
            duration,
            payment: paymentId
        });

        // Notifica a modelo
        socketService.notifyUser(model.user, 'new_video_call', {
            videoCallId: videoCall._id,
            scheduledFor,
            duration
        });

        res.status(201).json({
            success: true,
            data: videoCall
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao agendar chamada',
            error: error.message
        });
    }
};

// @desc    Obter token para entrar na sala
// @route   GET /api/video-calls/:id/join
// @access  Private
exports.joinCall = async (req, res) => {
    try {
        const videoCall = await VideoCall.findById(req.params.id)
            .populate('model client');

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Chamada não encontrada'
            });
        }

        // Verifica se o usuário é participante da chamada
        const isModel = videoCall.model.user.toString() === req.user.id;
        const isClient = videoCall.client._id.toString() === req.user.id;
        
        if (!isModel && !isClient) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para entrar nesta chamada'
            });
        }

        // Verifica se está no horário
        const now = new Date();
        const scheduledTime = new Date(videoCall.scheduledFor);
        const timeWindow = 5 * 60 * 1000; // 5 minutos

        if (now < new Date(scheduledTime.getTime() - timeWindow)) {
            return res.status(400).json({
                success: false,
                message: 'Muito cedo para entrar na chamada'
            });
        }

        // Cria token de acesso
        const token = await dailyService.createMeetingToken(
            videoCall.roomName,
            isModel
        );

        // Atualiza horário de entrada
        if (isModel) {
            videoCall.modelJoinedAt = now;
        } else {
            videoCall.clientJoinedAt = now;
        }

        if (videoCall.status === 'scheduled') {
            videoCall.status = 'in_progress';
        }

        await videoCall.save();

        res.status(200).json({
            success: true,
            data: {
                token,
                roomName: videoCall.roomName,
                duration: videoCall.duration
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao entrar na chamada',
            error: error.message
        });
    }
};

// @desc    Encerrar chamada
// @route   POST /api/video-calls/:id/end
// @access  Private
exports.endCall = async (req, res) => {
    try {
        const videoCall = await VideoCall.findById(req.params.id)
            .populate('model client');

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Chamada não encontrada'
            });
        }

        // Verifica permissão
        const isModel = videoCall.model.user.toString() === req.user.id;
        const isClient = videoCall.client._id.toString() === req.user.id;
        
        if (!isModel && !isClient) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para encerrar esta chamada'
            });
        }

        // Encerra a sala no Daily
        await dailyService.endRoom(videoCall.roomName);

        // Atualiza registro da chamada
        await videoCall.end(
            isModel ? 'cancelled_by_model' : 'cancelled_by_client'
        );

        // Notifica os participantes
        socketService.notifyUser(videoCall.model.user, 'video_call_ended', {
            videoCallId: videoCall._id
        });
        socketService.notifyUser(videoCall.client._id, 'video_call_ended', {
            videoCallId: videoCall._id
        });

        res.status(200).json({
            success: true,
            message: 'Chamada encerrada com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao encerrar chamada',
            error: error.message
        });
    }
};

// @desc    Avaliar chamada
// @route   POST /api/video-calls/:id/rate
// @access  Private (clientes)
exports.rateCall = async (req, res) => {
    try {
        const { score, comment } = req.body;

        const videoCall = await VideoCall.findById(req.params.id);
        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Chamada não encontrada'
            });
        }

        if (videoCall.client.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Apenas o cliente pode avaliar a chamada'
            });
        }

        await videoCall.addRating(score, comment);

        // Atualiza rating médio da modelo
        const model = await Model.findById(videoCall.model);
        const calls = await VideoCall.find({
            model: videoCall.model,
            'rating.score': { $exists: true }
        });

        const totalScore = calls.reduce((sum, call) => sum + call.rating.score, 0);
        model.stats.rating = totalScore / calls.length;
        await model.save();

        res.status(200).json({
            success: true,
            data: videoCall
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao avaliar chamada',
            error: error.message
        });
    }
};

// @desc    Listar chamadas agendadas
// @route   GET /api/video-calls/upcoming
// @access  Private
exports.getUpcomingCalls = async (req, res) => {
    try {
        const isModel = req.user.role === 'model';
        const calls = await VideoCall.getUpcoming(req.user.id, isModel);

        res.status(200).json({
            success: true,
            data: calls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar chamadas',
            error: error.message
        });
    }
};

// @desc    Listar histórico de chamadas
// @route   GET /api/video-calls/history
// @access  Private
exports.getCallHistory = async (req, res) => {
    try {
        const isModel = req.user.role === 'model';
        const calls = await VideoCall.getHistory(req.user.id, isModel);

        res.status(200).json({
            success: true,
            data: calls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar histórico',
            error: error.message
        });
    }
};
