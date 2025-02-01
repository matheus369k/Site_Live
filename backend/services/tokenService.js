const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

class TokenService {
    // Gera um access token JWT
    generateAccessToken(user) {
        return jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    }

    // Gera um refresh token
    async generateRefreshToken(user, userAgent, ipAddress) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias de validade

        const refreshToken = await RefreshToken.create({
            token,
            user: user._id,
            expiresAt,
            userAgent,
            ipAddress
        });

        return refreshToken.token;
    }

    // Verifica e retorna os dados do access token
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    // Verifica e retorna o refresh token
    async verifyRefreshToken(token) {
        const refreshToken = await RefreshToken.findOne({
            token,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).populate('user');

        if (!refreshToken) {
            throw new Error('Refresh token inválido ou expirado');
        }

        return refreshToken;
    }

    // Revoga um refresh token
    async revokeRefreshToken(token) {
        await RefreshToken.findOneAndUpdate(
            { token },
            { isRevoked: true }
        );
    }

    // Revoga todos os refresh tokens de um usuário
    async revokeAllUserTokens(userId) {
        await RefreshToken.updateMany(
            { user: userId },
            { isRevoked: true }
        );
    }

    // Limpa tokens expirados ou revogados (pode ser executado periodicamente)
    async cleanupTokens() {
        const now = new Date();
        await RefreshToken.deleteMany({
            $or: [
                { expiresAt: { $lt: now } },
                { isRevoked: true }
            ]
        });
    }
}

module.exports = new TokenService();
