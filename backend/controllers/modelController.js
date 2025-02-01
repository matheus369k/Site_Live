const Model = require('../models/Model');
const s3Service = require('../services/s3Service');

// @desc    Criar ou atualizar perfil de modelo
// @route   POST /api/models/profile
// @access  Private (apenas modelos)
exports.updateProfile = async (req, res) => {
    try {
        const modelData = {
            user: req.user.id,
            description: req.body.description,
            location: {
                state: req.body.state,
                city: req.body.city
            },
            pricing: {
                hourlyRate: req.body.hourlyRate,
                minimumTime: req.body.minimumTime || 60
            },
            services: req.body.services,
            availability: req.body.availability
        };

        let model = await Model.findOne({ user: req.user.id });

        if (model) {
            model = await Model.findOneAndUpdate(
                { user: req.user.id },
                modelData,
                { new: true, runValidators: true }
            );
        } else {
            model = await Model.create(modelData);
        }

        res.status(200).json({
            success: true,
            data: model
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
};

// @desc    Upload de fotos
// @route   POST /api/models/photos
// @access  Private (apenas modelos)
exports.uploadPhotos = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma foto enviada'
            });
        }

        const model = await Model.findOne({ user: req.user.id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        const uploadPromises = req.files.map(async (file) => {
            const result = await s3Service.uploadImage(file, 'models');
            return {
                url: result.url,
                thumbnail: result.thumbnail,
                isVerified: false,
                isPrimary: model.photos.length === 0 // primeira foto será primária
            };
        });

        const uploadedPhotos = await Promise.all(uploadPromises);
        model.photos.push(...uploadedPhotos);
        await model.save();

        res.status(200).json({
            success: true,
            data: model.photos
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro no upload das fotos',
            error: error.message
        });
    }
};

// @desc    Remover foto
// @route   DELETE /api/models/photos/:photoId
// @access  Private (apenas modelos)
exports.deletePhoto = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user.id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        const photo = model.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Foto não encontrada'
            });
        }

        await s3Service.deleteImage(photo.url);
        photo.remove();
        await model.save();

        res.status(200).json({
            success: true,
            message: 'Foto removida com sucesso'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao remover foto',
            error: error.message
        });
    }
};

// @desc    Definir foto primária
// @route   PUT /api/models/photos/:photoId/primary
// @access  Private (apenas modelos)
exports.setPrimaryPhoto = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user.id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        // Remove primary flag from all photos
        model.photos.forEach(photo => {
            photo.isPrimary = false;
        });

        // Set new primary photo
        const photo = model.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Foto não encontrada'
            });
        }

        photo.isPrimary = true;
        await model.save();

        res.status(200).json({
            success: true,
            data: model.photos
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao definir foto primária',
            error: error.message
        });
    }
};

// @desc    Buscar modelos
// @route   GET /api/models
// @access  Public
exports.getModels = async (req, res) => {
    try {
        const { state, city, page = 1, limit = 10 } = req.query;
        const query = {};

        if (state) {
            query['location.state'] = state.toUpperCase();
        }
        if (city) {
            query['location.city'] = new RegExp(city, 'i');
        }

        const models = await Model.find(query)
            .populate('user', 'name')
            .select('-services -availability')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort('-stats.rating');

        const total = await Model.countDocuments(query);

        res.status(200).json({
            success: true,
            data: models,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao buscar modelos',
            error: error.message
        });
    }
};

// @desc    Buscar modelo por ID
// @route   GET /api/models/:id
// @access  Public
exports.getModel = async (req, res) => {
    try {
        const model = await Model.findById(req.params.id)
            .populate('user', 'name');

        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Modelo não encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: model
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao buscar modelo',
            error: error.message
        });
    }
};
