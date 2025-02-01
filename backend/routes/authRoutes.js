const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
    register, 
    login, 
    getMe, 
    logout, 
    updatePassword
} = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// Rate limiting para rotas de autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite por IP
    message: 'Muitas tentativas de autenticação. Por favor, tente novamente em 15 minutos.'
});

// Rotas públicas com rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Rotas privadas
router.use(auth);
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/update-password', updatePassword);

module.exports = router;
