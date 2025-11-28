const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Prices (should match client side)
const PRICES = {
    'starter': 99,
    'global': 199,
    'elite': 399,
    'coins_100': 49,
    'coins_500': 199,
    'coins_1500': 499
};

// Create Payment Intent
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        const { itemId, type } = req.body; // type: 'subscription' or 'coin_purchase'
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const amount = PRICES[itemId];
        if (!amount) return res.status(400).json({ error: 'Invalid item' });

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe expects amount in cents
            currency: 'inr',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: user._id.toString(),
                itemId,
                type
            }
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Stripe Intent Error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Webhook Handler
// NOTE: This needs raw body parsing in server.js
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { userId, itemId, type } = paymentIntent.metadata;

        console.log(`Payment succeeded for user ${userId}: ${itemId} (${type})`);

        try {
            const user = await User.findById(userId);
            if (user) {
                if (type === 'subscription') {
                    user.subscriptionTier = itemId;
                    user.isPremium = true;
                    user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                } else if (type === 'coin_purchase') {
                    const coinAmounts = {
                        'coins_100': 100,
                        'coins_500': 500,
                        'coins_1500': 1500
                    };
                    user.coins += (coinAmounts[itemId] || 0);
                }
                await user.save();

                // Record transaction
                await Transaction.create({
                    userId: user._id,
                    type: type,
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency,
                    status: 'completed',
                    details: { itemId, stripePaymentId: paymentIntent.id }
                });
            }
        } catch (err) {
            console.error('Error fulfilling order:', err);
        }
    }

    res.send();
});

module.exports = router;
