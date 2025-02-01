const Model = require('../models/Model');
const User = require('../models/User');
const Payment = require('../models/Payment');
const stripeService = require('../services/stripeService');

// @desc    Criar conta Stripe para modelo
// @route   POST /api/payments/connect
// @access  Private (apenas modelos)
exports.createConnectAccount = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user.id }).populate('user');
        
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de modelo não encontrado'
            });
        }

        if (model.stripeAccountId) {
            return res.status(400).json({
                success: false,
                message: 'Você já possui uma conta Stripe'
            });
        }

        const account = await stripeService.createConnectedAccount(req.user.email, model);
        model.stripeAccountId = account.id;
        await model.save();

        const accountLink = await stripeService.createAccountLink(account.id);

        res.status(200).json({
            success: true,
            url: accountLink.url
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar conta Stripe',
            error: error.message
        });
    }
};

// @desc    Verificar status da conta Stripe
// @route   GET /api/payments/account-status
// @access  Private (apenas modelos)
exports.getAccountStatus = async (req, res) => {
    try {
        const model = await Model.findOne({ user: req.user.id });
        
        if (!model || !model.stripeAccountId) {
            return res.status(404).json({
                success: false,
                message: 'Conta Stripe não encontrada'
            });
        }

        const status = await stripeService.getAccountStatus(model.stripeAccountId);
        
        res.status(200).json({
            success: true,
            status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status da conta',
            error: error.message
        });
    }
};

// @desc    Criar sessão de pagamento
// @route   POST /api/payments/create-session
// @access  Private (clientes)
exports.createPaymentSession = async (req, res) => {
    try {
        const { modelId, serviceId } = req.body;

        const model = await Model.findById(modelId).populate('user');
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Modelo não encontrada'
            });
        }

        if (!model.stripeAccountId || !model.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Modelo não está disponível para pagamentos'
            });
        }

        const service = model.services.id(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Serviço não encontrado'
            });
        }

        const client = await User.findById(req.user.id);
        const session = await stripeService.createPaymentSession(model, service, client);

        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar sessão de pagamento',
            error: error.message
        });
    }
};

// @desc    Webhook do Stripe
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: `Webhook Error: ${err.message}`
            });
        }

        const result = await stripeService.handleWebhook(event);

        if (result) {
            if (result.type === 'payment_success') {
                // Criar registro de pagamento
                await Payment.create({
                    model: result.modelId,
                    client: result.clientId,
                    service: result.serviceId,
                    amount: result.amount,
                    paymentId: result.paymentId,
                    status: 'completed'
                });
            } else if (result.type === 'account_updated') {
                // Atualizar status da conta da modelo
                await Model.findOneAndUpdate(
                    { stripeAccountId: result.accountId },
                    {
                        stripeEnabled: result.chargesEnabled && result.payoutsEnabled,
                        stripeVerified: result.detailsSubmitted
                    }
                );
            }
        }

        res.json({ received: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar webhook',
            error: error.message
        });
    }
};

// @desc    Reembolsar pagamento
// @route   POST /api/payments/:paymentId/refund
// @access  Private (admin)
exports.refundPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pagamento não encontrado'
            });
        }

        if (payment.status === 'refunded') {
            return res.status(400).json({
                success: false,
                message: 'Pagamento já foi reembolsado'
            });
        }

        const refund = await stripeService.refundPayment(
            payment.paymentId,
            req.body.reason
        );

        payment.status = 'refunded';
        payment.refundId = refund.id;
        payment.refundReason = req.body.reason;
        await payment.save();

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar reembolso',
            error: error.message
        });
    }
};
