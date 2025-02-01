const User = require('../models/User');
const Model = require('../models/Model');

// @desc    Obter perfil público de uma modelo
// @route   GET /api/profile/model/:id
// @access  Public
exports.getModelProfile = async (req, res) => {
    try {
        const model = await Model.findById(req.params.id)
            .populate('user', 'name email');

        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: model
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar perfil',
            error: error.message
        });
    }
};

// @desc    Atualizar perfil de modelo
// @route   PUT /api/profile/model
// @access  Private (apenas modelos)
exports.updateModelProfile = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        const allowedUpdates = [
            'description',
            'location.state',
            'pricing.hourlyRate',
            'services',
            'availability.schedule'
        ];

        // Atualiza apenas os campos permitidos
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    if (!model[parent]) model[parent] = {};
                    model[parent][child] = req.body[field];
                } else {
                    model[field] = req.body[field];
                }
            }
        }

        await model.save();

        res.status(200).json({
            success: true,
            data: model
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
};

// @desc    Atualizar disponibilidade
// @route   PUT /api/profile/model/availability
// @access  Private (apenas modelos)
exports.updateAvailability = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        const { isOnline, schedule } = req.body;

        if (isOnline !== undefined) {
            model.availability.isOnline = isOnline;
        }

        if (schedule) {
            model.availability.schedule = schedule;
        }

        await model.save();

        res.status(200).json({
            success: true,
            data: model.availability
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar disponibilidade',
            error: error.message
        });
    }
};

// @desc    Atualizar preços
// @route   PUT /api/profile/model/pricing
// @access  Private (apenas modelos)
exports.updatePricing = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        const { hourlyRate, currency } = req.body;

        if (hourlyRate) {
            model.pricing.hourlyRate = hourlyRate;
        }

        if (currency) {
            model.pricing.currency = currency;
        }

        await model.save();

        res.status(200).json({
            success: true,
            data: model.pricing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar preços',
            error: error.message
        });
    }
};

// @desc    Atualizar serviços oferecidos
// @route   PUT /api/profile/model/services
// @access  Private (apenas modelos)
exports.updateServices = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user._id });
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        const { services } = req.body;

        if (!services || !Array.isArray(services)) {
            return res.status(400).json({
                success: false,
                message: 'Serviços inválidos'
            });
        }

        model.services = services;
        await model.save();

        res.status(200).json({
            success: true,
            data: model.services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar serviços',
            error: error.message
        });
    }
};

// @desc    Atualizar informações básicas do usuário
// @route   PUT /api/profile/user
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        const allowedUpdates = ['name'];
        
        // Atualiza apenas os campos permitidos
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
};
