const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5001/api';
let modelToken, clientToken, chatId;
let modelSocket, clientSocket;

// Configuração do axios
const api = axios.create({
    baseURL: API_URL,
    validateStatus: false
});

// Função para conectar o socket
const connectSocket = (token) => {
    return io('http://localhost:5001', {
        auth: { token }
    });
};

// Função auxiliar para esperar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função principal de teste
async function runTests() {
    try {
        console.log('🚀 Iniciando testes do chat...\n');

        // 1. Login como modelo e cliente
        console.log('1️⃣  Fazendo login como modelo e cliente...');
        const modelLogin = await api.post('/auth/login', {
            email: 'modelo@test.com',
            password: 'password123'
        });
        modelToken = modelLogin.data.token;

        const clientLogin = await api.post('/auth/login', {
            email: 'cliente@test.com',
            password: 'password123'
        });
        clientToken = clientLogin.data.token;
        console.log('✅ Login realizado com sucesso!\n');

        // 2. Conectar sockets
        console.log('2️⃣  Conectando sockets...');
        modelSocket = connectSocket(modelToken);
        clientSocket = connectSocket(clientToken);
        await wait(1000);
        console.log('✅ Sockets conectados!\n');

        // 3. Cliente inicia um chat
        console.log('3️⃣  Iniciando um novo chat...');
        const newChat = await api.post('/chats', 
            { modelId: modelLogin.data.user._id },
            { headers: { Authorization: `Bearer ${clientToken}` }}
        );
        chatId = newChat.data.data._id;
        console.log('✅ Chat iniciado com sucesso! ID:', chatId, '\n');

        // 4. Cliente envia mensagens
        console.log('4️⃣  Cliente enviando mensagens...');
        for (let i = 1; i <= 6; i++) {
            const response = await api.post(`/chats/${chatId}/messages`,
                { content: `Mensagem do cliente ${i}` },
                { headers: { Authorization: `Bearer ${clientToken}` }}
            );
            console.log(`Mensagem ${i}:`, response.data.success ? '✅' : '❌');
            await wait(500);
        }
        console.log('\n');

        // 5. Modelo responde
        console.log('5️⃣  Modelo respondendo...');
        const modelResponse = await api.post(`/chats/${chatId}/messages`,
            { content: 'Olá! Como posso ajudar?' },
            { headers: { Authorization: `Bearer ${modelToken}` }}
        );
        console.log('Resposta da modelo:', modelResponse.data.success ? '✅' : '❌\n');

        // 6. Modelo bloqueia o chat
        console.log('6️⃣  Modelo bloqueando o chat...');
        const blockResponse = await api.put(`/chats/${chatId}/block`,
            { reason: 'Teste de bloqueio' },
            { headers: { Authorization: `Bearer ${modelToken}` }}
        );
        console.log('Chat bloqueado:', blockResponse.data.success ? '✅' : '❌\n');

        // 7. Cliente tenta enviar mensagem com chat bloqueado
        console.log('7️⃣  Tentando enviar mensagem com chat bloqueado...');
        const blockedMessage = await api.post(`/chats/${chatId}/messages`,
            { content: 'Tentando enviar mensagem bloqueada' },
            { headers: { Authorization: `Bearer ${clientToken}` }}
        );
        console.log('Mensagem bloqueada (esperado):', blockedMessage.status === 403 ? '✅' : '❌\n');

        // 8. Modelo desbloqueia o chat
        console.log('8️⃣  Modelo desbloqueando o chat...');
        const unblockResponse = await api.put(`/chats/${chatId}/block`,
            {},
            { headers: { Authorization: `Bearer ${modelToken}` }}
        );
        console.log('Chat desbloqueado:', unblockResponse.data.success ? '✅' : '❌\n');

        // 9. Listar chats
        console.log('9️⃣  Listando chats...');
        const clientChats = await api.get('/chats',
            { headers: { Authorization: `Bearer ${clientToken}` }}
        );
        console.log('Lista de chats do cliente:', clientChats.data.success ? '✅' : '❌');
        
        const modelChats = await api.get('/chats',
            { headers: { Authorization: `Bearer ${modelToken}` }}
        );
        console.log('Lista de chats da modelo:', modelChats.data.success ? '✅' : '❌\n');

        // 10. Ver detalhes do chat
        console.log('🔟 Verificando detalhes do chat...');
        const chatDetails = await api.get(`/chats/${chatId}`,
            { headers: { Authorization: `Bearer ${clientToken}` }}
        );
        console.log('Detalhes do chat:', chatDetails.data.success ? '✅' : '❌\n');

        console.log('🎉 Todos os testes concluídos!\n');

    } catch (error) {
        console.error('❌ Erro durante os testes:', error.message);
        if (error.response) {
            console.error('Detalhes do erro:', error.response.data);
        }
    } finally {
        // Desconectar sockets
        if (modelSocket) modelSocket.disconnect();
        if (clientSocket) clientSocket.disconnect();
    }
}

// Executar os testes
runTests();
