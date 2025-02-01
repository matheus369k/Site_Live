const Model = require('../models/Model');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');

// Submeter documentos para verificação
exports.submitDocuments = async (req, res) => {
    try {
        const modelId = req.user._id;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum documento foi enviado'
            });
        }

        // Encontrar o perfil da modelo
        const model = await Model.findOne({ user: modelId });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        // Upload dos documentos para o S3
        const documents = [];
        for (const file of files) {
            const documentPath = `documents/${modelId}/${Date.now()}-${file.originalname}`;
            const documentUrl = await uploadToS3(file.buffer, documentPath);
            
            documents.push({
                type: file.fieldname, // 'identidade' ou 'comprovante_residencia'
                url: documentUrl,
                status: 'pending',
                submittedAt: new Date()
            });
        }

        // Atualizar o status de verificação
        model.verification = {
            status: 'pending',
            documents: documents,
            submittedAt: new Date()
        };

        await model.save();

        return res.status(200).json({
            success: true,
            message: 'Documentos enviados com sucesso',
            data: model.verification
        });
    } catch (error) {
        console.error('Erro ao enviar documentos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao enviar documentos'
        });
    }
};

// Obter status da verificação
exports.getVerificationStatus = async (req, res) => {
    try {
        const modelId = req.user._id;

        const model = await Model.findOne({ user: modelId });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: model.verification
        });
    } catch (error) {
        console.error('Erro ao obter status da verificação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao obter status da verificação'
        });
    }
};

// [ADMIN] Aprovar ou rejeitar verificação
exports.reviewVerification = async (req, res) => {
    try {
        const { modelId } = req.params;
        const { status, reason } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido'
            });
        }

        const model = await Model.findOne({ user: modelId });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        model.verification.status = status;
        model.verification.reviewedAt = new Date();
        
        if (status === 'rejected' && reason) {
            model.verification.rejectionReason = reason;
        }

        await model.save();

        return res.status(200).json({
            success: true,
            message: `Verificação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`,
            data: model.verification
        });
    } catch (error) {
        console.error('Erro ao revisar verificação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao revisar verificação'
        });
    }
};

// [ADMIN] Listar modelos pendentes de verificação
exports.listPendingVerifications = async (req, res) => {
    try {
        const pendingModels = await Model.find({
            'verification.status': 'pending'
        }).populate('user', 'name email');

        return res.status(200).json({
            success: true,
            data: pendingModels
        });
    } catch (error) {
        console.error('Erro ao listar verificações pendentes:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar verificações pendentes'
        });
    }
};
