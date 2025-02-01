const express = require('express');
const { auth, isModel, isAdmin, isClient } = require('../middlewares/auth');
const {
    createConnectAccount,
    getAccountStatus,
    createPaymentSession,
    handleWebhook,
    refundPayment
} = require('../controllers/paymentController');

const router = express.Router();

// Rota pública (webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Rotas privadas
router.use(auth);

// Rotas para modelos
router.post('/connect', isModel, createConnectAccount);
router.get('/account-status', isModel, getAccountStatus);

// Rotas para clientes
router.post('/create-session', isClient, createPaymentSession);

// Rotas para admin
router.post('/:paymentId/refund', isAdmin, refundPayment);

module.exports = router;
