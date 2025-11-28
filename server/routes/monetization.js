const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get available plans and coin packages
router.get('/plans', (req, res) => {
    res.json({
        subscriptions: [
            { id: 'starter', name: 'Starter Premium', price: 99, currency: 'INR', benefits: ['Remove ads', 'Unlimited matches', 'Rematch'] },
            { id: 'global', name: 'Global Premium', price: 199, currency: 'INR', benefits: ['Switch country', 'Priority matching', 'Add friends', 'Unlimited chats'] },
            { id: 'elite', name: 'Elite Tier', price: 399, currency: 'INR', benefits: ['All Global features', 'Gender filter', 'Premium badge', 'Early access'] }
        ],
        coinPackages: [
            { id: 'coins_100', coins: 100, price: 49, currency: 'INR' },
            { id: 'coins_500', coins: 500, price: 199, currency: 'INR' },
            { id: 'coins_1500', coins: 1500, price: 499, currency: 'INR' }
        ]
    });
});

// Subscribe to a plan (Mock Payment)
router.post('/subscribe', auth, async (req, res) => {
    try {
        const { planId } = req.body;
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Mock payment validation
        if (!['starter', 'global', 'elite'].includes(planId)) {
            return res.status(400).json({ error: 'Invalid plan ID' });
        }

        // Update user subscription
        user.subscriptionTier = planId;
        user.isPremium = true;
        user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await user.save();

        // Record transaction
        const prices = { starter: 99, global: 199, elite: 399 };
        await Transaction.create({
            userId: user._id,
            type: 'subscription',
            amount: prices[planId],
            status: 'completed',
            details: { planId }
        });

        res.json({ success: true, message: `Subscribed to ${planId}`, user });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Subscription failed' });
    }
});

// Buy coins (Mock Payment)
router.post('/buy-coins', auth, async (req, res) => {
    try {
        const { packageId } = req.body;
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const packages = {
            'coins_100': { coins: 100, price: 49 },
            'coins_500': { coins: 500, price: 199 },
            'coins_1500': { coins: 1500, price: 499 }
        };

        const pack = packages[packageId];
        if (!pack) return res.status(400).json({ error: 'Invalid package ID' });

        // Update user coins
        user.coins += pack.coins;
        await user.save();

        // Record transaction
        await Transaction.create({
            userId: user._id,
            type: 'coin_purchase',
            amount: pack.price,
            status: 'completed',
            details: { packageId, coins: pack.coins }
        });

        res.json({ success: true, message: `Added ${pack.coins} coins`, coins: user.coins });
    } catch (error) {
        console.error('Coin purchase error:', error);
        res.status(500).json({ error: 'Coin purchase failed' });
    }
});

// Use feature (Deduct coins)
router.post('/use-feature', auth, async (req, res) => {
    try {
        const { feature } = req.body;
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const costs = {
            'boost': 20,
            'friend_add': 10,
            'gift': 50
        };

        const cost = costs[feature];
        if (!cost) return res.status(400).json({ error: 'Invalid feature' });

        if (user.coins < cost) {
            return res.status(400).json({ error: 'Insufficient coins' });
        }

        user.coins -= cost;
        await user.save();

        // Record usage (optional, or just track as analytics)
        await Transaction.create({
            userId: user._id,
            type: 'feature_usage',
            amount: 0, // No real money spent here
            status: 'completed',
            details: { feature, cost }
        });

        res.json({ success: true, message: `${feature} activated`, coins: user.coins });
    } catch (error) {
        console.error('Feature usage error:', error);
        res.status(500).json({ error: 'Failed to use feature' });
    }
});

module.exports = router;
