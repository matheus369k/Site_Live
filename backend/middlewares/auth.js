const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Model = require('../models/Model');
const tokenService = require('../services/tokenService');

// Middleware de autenticação
exports.auth = async (req, res, next) => {
    try {
        let token;

        // Verifica se existe token no header Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Verifica se existe token nos cookies
        else if (req.cookies.token) {
            token = req.cookies.token;
        }

        // Verifica se o token existe
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Não autorizado para acessar esta rota'
            });
        }

        try {
            // Verifica o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Adiciona o usuário à requisição
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'O usuário não existe mais'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Sua conta está desativada'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido'
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Erro ao autenticar usuário'
        });
    }
};

// Middleware para verificar se é modelo
exports.isModel = async (req, res, next) => {
    try {
        if (req.user.role !== 'model') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas modelos podem acessar esta rota.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar permissão',
            error: error.message
        });
    }
};

// Middleware para verificar se é cliente
exports.isClient = async (req, res, next) => {
    try {
        if (req.user.role !== 'client') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas clientes podem acessar esta rota.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar permissão',
            error: error.message
        });
    }
};

// Middleware para verificar se é admin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores podem acessar esta rota.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar permissão',
            error: error.message
        });
    }
};

// Middleware para verificar se modelo está verificada
exports.isVerifiedModel = async (req, res, next) => {
    try {
        const model = await Model.findOne({ user: req.user._id });
        
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        if (!model.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Seu perfil ainda não foi verificado.'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status de verificação',
            error: error.message
        });
    }
};
