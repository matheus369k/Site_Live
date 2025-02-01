const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const morgan = require('morgan');

// Rotas
const authRoutes = require('./routes/authRoutes');
const modelRoutes = require('./routes/modelRoutes');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Cors
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Sanitização
app.use(mongoSanitize()); // Previne NoSQL injection
app.use(xss()); // Sanitiza inputs

// Segurança
app.use(helmet()); // Headers de segurança
app.use(hpp()); // Previne HTTP Parameter Pollution

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Erro interno do servidor'
    });
});

module.exports = app;
