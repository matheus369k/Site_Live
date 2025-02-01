const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
    startChat,
    sendMessage,
    getChats,
    getChat,
    toggleBlockChat
} = require('../controllers/chatController');

// Rotas protegidas
router.use(auth);

// Rotas de chat
router.route('/')
    .get(getChats)    // Lista todos os chats do usuário
    .post(startChat); // Inicia um novo chat

router.route('/:chatId')
    .get(getChat);    // Obtém detalhes de um chat

router.route('/:chatId/messages')
    .post(sendMessage); // Envia uma mensagem

router.route('/:chatId/block')
    .put(toggleBlockChat); // Bloqueia/Desbloqueia um chat

module.exports = router;
