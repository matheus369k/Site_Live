require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const winston = require('winston');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Configuração do logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Processo não tratado
process.on('unhandledRejection', (err) => {
    logger.error('Erro não tratado:', err);
});

process.on('uncaughtException', (err) => {
    logger.error('Exceção não capturada:', err);
    process.exit(1);
});

const app = express();

// Middlewares essenciais
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite por IP
});
app.use(limiter);

// CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://liveconfidente.com', 'https://www.liveconfidente.com']
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rota de status
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API do LiveConfidente está funcionando!',
        env: process.env.NODE_ENV,
        mongodb: {
            uri: process.env.MONGODB_URI ? 'Configurado' : 'Não configurado',
            connection: mongoose.connection.readyState
        },
        timestamp: new Date().toISOString()
    });
});

// Rota de health check
app.get('/health', (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        status: 'UP',
        timestamp: Date.now(),
        mongodb: {
            status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            host: mongoose.connection.host,
            uri: process.env.MONGODB_URI ? 'Configurado' : 'Não configurado',
            readyState: mongoose.connection.readyState
        },
        memory: process.memoryUsage()
    };
    res.json(healthcheck);
});

// Conexão com MongoDB
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI não está definida');
        }

        logger.info('Tentando conectar ao MongoDB...');
        
        // Opções de conexão
        const options = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
            ssl: true,
            tls: true,
            authSource: 'admin'
        };

        try {
            logger.info('Tentando conectar com URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
            const conn = await mongoose.connect(process.env.MONGODB_URI, options);
            logger.info(`MongoDB conectado: ${conn.connection.host}`);
            logger.info('Estado da conexão:', conn.connection.readyState);
            logger.info('Nome do banco:', conn.connection.name);
            return conn;
        } catch (error) {
            logger.error('Erro na conexão:', {
                message: error.message,
                code: error.code,
                name: error.name
            });
            throw error;
        }
    } catch (error) {
        logger.error('Erro ao conectar ao MongoDB:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack
        });
    }
};

// Rotas da API
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Handler de erro 404
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Rota não encontrada'
    });
});

// Handler de erros global
app.use((err, req, res, next) => {
    logger.error('Error:', err);

    // Erros operacionais conhecidos
    if (err.isOperational) {
        return res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message
        });
    }

    // Erros de programação ou desconhecidos
    return res.status(500).json({
        status: 'error',
        message: 'Algo deu errado!',
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        // Tentar conectar ao MongoDB algumas vezes
        let retries = 5;
        while (retries > 0) {
            try {
                await connectDB();
                if (mongoose.connection.readyState === 1) {
                    break;
                }
            } catch (error) {
                logger.error(`Tentativa ${6 - retries} falhou:`, error.message);
                retries--;
                if (retries > 0) {
                    logger.info(`Tentando novamente em 5 segundos... ${retries} tentativas restantes`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        const server = app.listen(PORT, () => {
            logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM recebido. Encerrando servidor...');
            server.close(() => {
                logger.info('Servidor encerrado');
                mongoose.connection.close(false, () => {
                    logger.info('MongoDB desconectado');
                    process.exit(0);
                });
            });
        });
    } catch (error) {
        logger.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();
