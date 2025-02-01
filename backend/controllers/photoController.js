const Model = require('../models/Model');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

// @desc    Upload de foto única
// @route   POST /api/photos/upload
// @access  Private (apenas modelos)
exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma foto foi enviada'
            });
        }

        // Busca o perfil da modelo
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        // Adiciona a foto ao array de fotos
        model.photos.push({
            url: req.file.location,
            isMain: model.photos.length === 0 // primeira foto será a principal
        });

        await model.save();

        res.status(200).json({
            success: true,
            data: model.photos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer upload da foto',
            error: error.message
        });
    }
};

// @desc    Upload de múltiplas fotos
// @route   POST /api/photos/upload-multiple
// @access  Private (apenas modelos)
exports.uploadMultiplePhotos = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma foto foi enviada'
            });
        }

        // Busca o perfil da modelo
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        // Adiciona as fotos ao array de fotos
        const newPhotos = req.files.map(file => ({
            url: file.location,
            isMain: model.photos.length === 0 && model.photos.length === 0 // primeira foto será a principal
        }));

        model.photos.push(...newPhotos);
        await model.save();

        res.status(200).json({
            success: true,
            data: model.photos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer upload das fotos',
            error: error.message
        });
    }
};

// @desc    Deletar foto
// @route   DELETE /api/photos/:photoId
// @access  Private (apenas modelos)
exports.deletePhoto = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        // Encontra a foto
        const photo = model.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Foto não encontrada'
            });
        }

        // Extrai o key do URL da foto
        const key = photo.url.split('.com/')[1];

        // Deleta do S3
        try {
            await s3.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key
            }));
        } catch (error) {
            console.error('Erro ao deletar foto do S3:', error);
        }

        // Remove a foto do modelo
        photo.remove();
        await model.save();

        res.status(200).json({
            success: true,
            data: model.photos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar foto',
            error: error.message
        });
    }
};

// @desc    Definir foto principal
// @route   PUT /api/photos/:photoId/main
// @access  Private (apenas modelos)
exports.setMainPhoto = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        // Reseta todas as fotos para não serem principais
        model.photos.forEach(photo => {
            photo.isMain = false;
        });

        // Define a foto selecionada como principal
        const photo = model.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Foto não encontrada'
            });
        }

        photo.isMain = true;
        await model.save();

        res.status(200).json({
            success: true,
            data: model.photos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao definir foto principal',
            error: error.message
        });
    }
};
