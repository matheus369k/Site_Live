const uploadService = require('../services/uploadService');
const Model = require('../models/Model');
const User = require('../models/User');

// @desc    Upload de foto de perfil
// @route   POST /api/upload/profile
// @access  Private
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma imagem fornecida'
            });
        }

        // Upload da imagem
        const urls = await uploadService.uploadImage(
            req.file.buffer,
            req.file.mimetype,
            'profiles'
        );

        // Se for uma modelo, atualiza o perfil
        if (req.user.role === 'model') {
            const model = await Model.findOne({ user: req.user.id });
            
            // Se já existe uma foto principal, move para a galeria
            const currentPhotos = model.photos || [];
            if (currentPhotos.length > 0) {
                currentPhotos.forEach(photo => photo.isPrimary = false);
            }

            // Adiciona a nova foto como principal
            currentPhotos.push({
                url: urls.original,
                thumbnailUrl: urls.thumbnail,
                mediumUrl: urls.medium,
                largeUrl: urls.large,
                isPrimary: true,
                isVerified: false
            });

            await Model.findOneAndUpdate(
                { user: req.user.id },
                { $set: { photos: currentPhotos } },
                { new: true }
            );
        }

        // Atualiza a foto de perfil do usuário
        await User.findByIdAndUpdate(
            req.user.id,
            { $set: { profilePhoto: urls.medium } }
        );

        res.status(200).json({
            success: true,
            data: urls
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer upload da foto',
            error: error.message
        });
    }
};

// @desc    Upload de fotos para galeria (apenas modelos)
// @route   POST /api/upload/gallery
// @access  Private/Model
exports.uploadGalleryPhotos = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma imagem fornecida'
            });
        }

        const model = await Model.findOne({ user: req.user.id });
        const currentPhotos = model.photos || [];
        const uploadedPhotos = [];

        // Limite de 20 fotos na galeria
        if (currentPhotos.length + req.files.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Limite máximo de 20 fotos atingido'
            });
        }

        // Upload de cada foto
        for (const file of req.files) {
            const urls = await uploadService.uploadImage(
                file.buffer,
                file.mimetype,
                'gallery'
            );

            uploadedPhotos.push({
                url: urls.original,
                thumbnailUrl: urls.thumbnail,
                mediumUrl: urls.medium,
                largeUrl: urls.large,
                isPrimary: false,
                isVerified: false
            });
        }

        // Atualiza o modelo com as novas fotos
        const updatedModel = await Model.findOneAndUpdate(
            { user: req.user.id },
            { $push: { photos: { $each: uploadedPhotos } } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedModel.photos
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer upload das fotos',
            error: error.message
        });
    }
};

// @desc    Deletar foto
// @route   DELETE /api/upload/photo/:photoId
// @access  Private
exports.deletePhoto = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user.id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Modelo não encontrada'
            });
        }

        const photo = model.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Foto não encontrada'
            });
        }

        // Não permite deletar a única foto principal
        if (photo.isPrimary && model.photos.length === 1) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar a única foto do perfil'
            });
        }

        // Remove a foto do S3
        await uploadService.deleteImage(photo.url);

        // Remove a foto do modelo
        await Model.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { photos: { _id: req.params.photoId } } }
        );

        res.status(200).json({
            success: true,
            message: 'Foto deletada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar foto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar foto',
            error: error.message
        });
    }
};

// @desc    Definir foto como principal
// @route   PUT /api/upload/photo/:photoId/primary
// @access  Private
exports.setPrimaryPhoto = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user.id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Modelo não encontrada'
            });
        }

        const photo = model.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Foto não encontrada'
            });
        }

        // Remove o status de principal de todas as fotos
        model.photos.forEach(p => p.isPrimary = false);

        // Define a foto selecionada como principal
        photo.isPrimary = true;

        // Atualiza o modelo
        await model.save();

        // Atualiza a foto de perfil do usuário
        await User.findByIdAndUpdate(
            req.user.id,
            { $set: { profilePhoto: photo.mediumUrl } }
        );

        res.status(200).json({
            success: true,
            data: model.photos
        });
    } catch (error) {
        console.error('Erro ao definir foto principal:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao definir foto principal',
            error: error.message
        });
    }
};
