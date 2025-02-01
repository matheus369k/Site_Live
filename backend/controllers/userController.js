const User = require('../models/User');
const Model = require('../models/Model');
const Client = require('../models/Client');

// @desc    Obter todos os usuários
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter usuários',
            error: error.message
        });
    }
};

// @desc    Obter usuário específico
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Se for uma modelo, inclui os dados do perfil
        if (user.role === 'model') {
            const modelProfile = await Model.findOne({ user: user._id });
            return res.status(200).json({
                success: true,
                data: {
                    user,
                    profile: modelProfile
                }
            });
        }

        // Se for um cliente, inclui os dados do perfil
        if (user.role === 'client') {
            const clientProfile = await Client.findOne({ user: user._id });
            return res.status(200).json({
                success: true,
                data: {
                    user,
                    profile: clientProfile
                }
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter usuário',
            error: error.message
        });
    }
};

// @desc    Atualizar usuário
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            isActive: req.body.isActive
        };

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar usuário',
            error: error.message
        });
    }
};

// @desc    Deletar usuário
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Remove perfil associado
        if (user.role === 'model') {
            await Model.findOneAndDelete({ user: user._id });
        } else if (user.role === 'client') {
            await Client.findOneAndDelete({ user: user._id });
        }

        // Remove o usuário
        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Usuário removido com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar usuário',
            error: error.message
        });
    }
};

// @desc    Atualizar próprio perfil
// @route   PUT /api/users/profile/me
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email
        };

        // Atualiza o usuário
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        ).select('-password');

        // Se for uma modelo, atualiza o perfil
        if (user.role === 'model' && req.body.profile) {
            const modelProfile = await Model.findOneAndUpdate(
                { user: user._id },
                { $set: req.body.profile },
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                data: {
                    user,
                    profile: modelProfile
                }
            });
        }

        // Se for um cliente, atualiza o perfil
        if (user.role === 'client' && req.body.profile) {
            const clientProfile = await Client.findOneAndUpdate(
                { user: user._id },
                { $set: req.body.profile },
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                data: {
                    user,
                    profile: clientProfile
                }
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
};
