require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Model = require('../src/models/Model');

async function setupTestUsers() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Conectado ao MongoDB');

        // Limpar dados existentes
        await User.deleteMany({ email: { $in: ['modelo@test.com', 'cliente@test.com'] }});
        await Model.deleteMany({ name: 'Modelo Teste' });
        console.log('🧹 Dados antigos removidos');

        // Criar usuário modelo
        const modelPassword = await bcrypt.hash('password123', 10);
        const modelUser = await User.create({
            name: 'Modelo Teste',
            email: 'modelo@test.com',
            password: modelPassword,
            role: 'model',
            verified: true
        });

        // Criar perfil de modelo
        await Model.create({
            user: modelUser._id,
            name: 'Modelo Teste',
            bio: 'Modelo para testes',
            description: 'Modelo de teste para o sistema LiveConfidente',
            active: true,
            location: {
                city: 'São Paulo',
                state: 'SP',
                country: 'Brasil'
            },
            pricing: {
                hourlyRate: 200,
                currency: 'BRL'
            },
            languages: ['Português'],
            categories: ['Chat'],
            availability: {
                weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                startTime: '09:00',
                endTime: '18:00',
                timezone: 'America/Sao_Paulo'
            },
            profileComplete: true
        });

        // Criar usuário cliente
        const clientPassword = await bcrypt.hash('password123', 10);
        await User.create({
            name: 'Cliente Teste',
            email: 'cliente@test.com',
            password: clientPassword,
            role: 'client',
            verified: true
        });

        console.log('✅ Usuários de teste criados com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar usuários:', error);
        process.exit(1);
    }
}

setupTestUsers();
