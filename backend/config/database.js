const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Validação da URI do MongoDB
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI não está definida nas variáveis de ambiente');
            process.exit(1);
        }

        console.log('Tentando conectar ao MongoDB...');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Estas opções são recomendadas para evitar avisos de depreciação
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('MongoDB Connected:');
        console.log('Host:', conn.connection.host);
        console.log('Database:', conn.connection.name);
        console.log('Port:', conn.connection.port);
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

module.exports = connectDB;
