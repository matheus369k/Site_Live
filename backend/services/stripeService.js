const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
    // Criar uma conta conectada para a modelo (Stripe Connect)
    async createConnectedAccount(email, model) {
        try {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'BR',
                email: email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true }
                },
                business_type: 'individual',
                business_profile: {
                    url: process.env.FRONTEND_URL + '/models/' + model._id,
                    mcc: '7299' // Serviços pessoais
                }
            });

            return account;
        } catch (error) {
            throw new Error(`Erro ao criar conta Stripe: ${error.message}`);
        }
    }

    // Criar link de onboarding para a modelo
    async createAccountLink(accountId) {
        try {
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${process.env.FRONTEND_URL}/stripe/refresh`,
                return_url: `${process.env.FRONTEND_URL}/stripe/return`,
                type: 'account_onboarding'
            });

            return accountLink;
        } catch (error) {
            throw new Error(`Erro ao criar link de onboarding: ${error.message}`);
        }
    }

    // Criar sessão de pagamento
    async createPaymentSession(model, service, client) {
        try {
            // Calcula o valor com a taxa da plataforma (10%)
            const unitAmount = Math.round(service.price * 100); // Stripe trabalha em centavos
            const platformFee = Math.round(unitAmount * 0.1); // 10% de taxa

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer_email: client.email,
                line_items: [{
                    price_data: {
                        currency: 'brl',
                        unit_amount: unitAmount,
                        product_data: {
                            name: service.name,
                            description: `Sessão com ${model.user.name} - ${service.duration} minutos`
                        }
                    },
                    quantity: 1
                }],
                payment_intent_data: {
                    application_fee_amount: platformFee,
                    transfer_data: {
                        destination: model.stripeAccountId
                    }
                },
                metadata: {
                    modelId: model._id.toString(),
                    clientId: client._id.toString(),
                    serviceId: service._id.toString()
                },
                success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
            });

            return session;
        } catch (error) {
            throw new Error(`Erro ao criar sessão de pagamento: ${error.message}`);
        }
    }

    // Verificar status da conta conectada
    async getAccountStatus(accountId) {
        try {
            const account = await stripe.accounts.retrieve(accountId);
            return {
                id: account.id,
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                details_submitted: account.details_submitted,
                requirements: account.requirements
            };
        } catch (error) {
            throw new Error(`Erro ao verificar status da conta: ${error.message}`);
        }
    }

    // Processar webhook do Stripe
    async handleWebhook(event) {
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object;
                    // Retorna os dados para processar o pagamento
                    return {
                        type: 'payment_success',
                        modelId: session.metadata.modelId,
                        clientId: session.metadata.clientId,
                        serviceId: session.metadata.serviceId,
                        amount: session.amount_total,
                        paymentId: session.payment_intent
                    };

                case 'account.updated':
                    const account = event.data.object;
                    // Retorna os dados da atualização da conta
                    return {
                        type: 'account_updated',
                        accountId: account.id,
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                        detailsSubmitted: account.details_submitted
                    };

                default:
                    return null;
            }
        } catch (error) {
            throw new Error(`Erro ao processar webhook: ${error.message}`);
        }
    }

    // Reembolsar pagamento
    async refundPayment(paymentIntentId, reason) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: paymentIntentId,
                reason: reason || 'requested_by_customer'
            });

            return refund;
        } catch (error) {
            throw new Error(`Erro ao processar reembolso: ${error.message}`);
        }
    }
}

module.exports = new StripeService();
