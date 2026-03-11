/**
 * Stripe webhook handler — Prisma version
 * Endpoint: POST /api/webhook/stripe
 */
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require('./email');
const { prisma } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { user_email, subscription_plan_id, plan_type } = session.metadata || {};
                if (!user_email) break;

                // Update pending payment transaction
                const tx = await prisma.paymentTransaction.findFirst({
                    where: { payment_gateway_id: session.id }
                });
                if (tx) {
                    await prisma.paymentTransaction.update({
                        where: { id: tx.id },
                        data: {
                            status: 'completed',
                            payment_method: session.payment_method_types?.[0] || 'card',
                            receipt_url: session.receipt_url || session.url,
                        }
                    });
                }

                const plan = subscription_plan_id ? await prisma.subscriptionPlan.findUnique({ where: { id: subscription_plan_id } }) : null;
                const renewalDate = new Date();
                if (plan_type === 'annual') renewalDate.setFullYear(renewalDate.getFullYear() + 1);

                const user = await prisma.user.findUnique({ where: { email: user_email } });
                if (user) {
                    if (plan_type === 'guest_points') {
                        const pointsAmount = parseInt(session.metadata?.points_amount || '0', 10);
                        if (pointsAmount > 0) {
                            const newBalance = (user.guest_points || 0) + pointsAmount;
                            await prisma.user.update({
                                where: { email: user_email },
                                data: { guest_points: newBalance }
                            });
                            await prisma.guestPointTransaction.create({
                                data: {
                                    user_email: user_email,
                                    transaction_type: 'earned_purchase',
                                    points: pointsAmount,
                                    balance_after: newBalance,
                                    description: `Purchased ${pointsAmount} GuestPoints`
                                }
                            });
                            await prisma.notification.create({
                                data: {
                                    user_email,
                                    type: 'system',
                                    title: 'GuestPoints Purchased',
                                    message: `You have successfully purchased ${pointsAmount} GuestPoints.`,
                                    link: '/settings'
                                }
                            });
                        }
                    } else {
                        await prisma.user.update({
                            where: { email: user_email },
                            data: {
                                subscription_plan_id: subscription_plan_id || undefined,
                                subscription_status: plan_type === 'lifetime' ? 'lifetime' : 'active',
                                ...(plan_type === 'annual' && { subscription_renewal_date: renewalDate }),
                                has_first_year_guarantee: plan_type === 'annual',
                            }
                        });
                        await prisma.notification.create({
                            data: {
                                user_email,
                                type: 'system',
                                title: 'Subscription Activated',
                                message: `Your ${plan?.name || 'Unswap'} subscription is now active. Welcome!`,
                                link: '/dashboard'
                            }
                        });
                        await sendEmail({ to: user_email, subject: 'Welcome to Unswap — Subscription Activated', body: `Your ${plan?.name || 'subscription'} is now active. You can access all platform features!` });
                    }
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                const customer = await stripe.customers.retrieve(invoice.customer);
                const email = customer.email;
                if (!email) break;

                const user = await prisma.user.findUnique({ where: { email } });
                if (user) {
                    await prisma.paymentTransaction.create({
                        data: {
                            user_email: email,
                            subscription_plan_id: user.subscription_plan_id,
                            amount: invoice.amount_paid / 100,
                            currency: invoice.currency.toUpperCase(),
                            status: 'completed',
                            payment_gateway_id: invoice.id,
                            transaction_type: 'renewal',
                            receipt_url: invoice.hosted_invoice_url,
                        }
                    });
                    await prisma.user.update({
                        where: { email },
                        data: {
                            subscription_status: 'active',
                            subscription_renewal_date: new Date(subscription.current_period_end * 1000)
                        }
                    });
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const customer = await stripe.customers.retrieve(invoice.customer);
                const email = customer.email;
                if (!email) break;
                await prisma.notification.create({
                    data: {
                        user_email: email,
                        type: 'system',
                        title: 'Payment Failed',
                        message: 'Your subscription payment failed. Please update your payment method.',
                        link: '/settings'
                    }
                });
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customer = await stripe.customers.retrieve(subscription.customer);
                const email = customer.email;
                if (!email) break;

                const user = await prisma.user.findUnique({ where: { email } });
                if (user) {
                    await prisma.user.update({
                        where: { email },
                        data: { subscription_status: 'inactive' }
                    });
                    await prisma.notification.create({
                        data: {
                            user_email: email,
                            type: 'system',
                            title: 'Subscription Cancelled',
                            message: 'Your subscription has been cancelled. You can renew at any time from Settings.',
                            link: '/subscription-plans'
                        }
                    });
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook handler error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
