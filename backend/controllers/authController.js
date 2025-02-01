const User = require('../models/User');
const Model = require('../models/Model');

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Verifica se o usuário já existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                status: 'error',
                message: 'Email já cadastrado'
            });
        }

        // Cria o usuário
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'client'
        });

        // Se for uma modelo, cria o perfil de modelo
        if (role === 'model') {
            await Model.create({
                user: user._id,
                description: req.body.description || '',
                location: {
                    state: req.body.state || ''
                },
                pricing: {
                    hourlyRate: req.body.hourlyRate || 0
                }
            });
        }

        sendTokenResponse(user, 201, req, res);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao registrar usuário',
            error: error.message
        });
    }
};

// @desc    Login do usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Valida email e senha
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Por favor, forneça email e senha'
            });
        }

        // Verifica se o usuário existe
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciais inválidas'
            });
        }

        // Verifica se a senha está correta
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciais inválidas'
            });
        }

        sendTokenResponse(user, 200, req, res);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao fazer login',
            error: error.message
        });
    }
};

// @desc    Logout do usuário
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            status: 'success',
            message: 'Usuário deslogado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao fazer logout',
            error: error.message
        });
    }
};

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao obter usuário',
            error: error.message
        });
    }
};

// @desc    Atualizar senha
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        // Verifica senha atual
        if (!(await user.matchPassword(req.body.currentPassword))) {
            return res.status(401).json({
                status: 'error',
                message: 'Senha atual incorreta'
            });
        }

        user.password = req.body.newPassword;
        await user.save();

        sendTokenResponse(user, 200, req, res);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar senha',
            error: error.message
        });
    }
};

// Função auxiliar para enviar resposta com token
const sendTokenResponse = (user, statusCode, req, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            status: 'success',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};
