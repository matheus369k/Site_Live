const sgMail = require('@sendgrid/mail');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
    try {
        const msg = {
            to: options.email,
            from: {
                email: process.env.EMAIL_FROM || 'noreply@liveconfidente.com',
                name: 'LiveConfidente'
            },
            subject: options.subject,
            text: options.message,
            html: options.html || options.message.replace(/\n/g, '<br>')
        };

        await sgMail.send(msg);
        logger.info(`Email enviado para ${options.email}`);
    } catch (error) {
        logger.error('Erro ao enviar email:', error);
        // Não lançamos o erro para não interromper o fluxo da aplicação
    }
};

module.exports = sendEmail;
