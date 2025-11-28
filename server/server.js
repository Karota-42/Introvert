const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const monetizationRoutes = require('./routes/monetization');
// const stripeRoutes = require('./routes/stripe'); // Disabled for now

const app = express();
app.use(cors());

// Stripe webhook needs raw body, so we mount it before express.json()
// However, since we defined express.raw() inside the router for that specific route, 
// we can mount the router here, but we need to be careful.
// Best practice: Mount webhook route separately if possible, or ensure express.json() doesn't consume it.
// The stripe.js router uses `express.raw({ type: 'application/json' })` on the webhook route.
// But if `app.use(express.json())` is global, it might interfere.
// Let's move `app.use('/api/stripe', stripeRoutes)` BEFORE `app.use(express.json())` just to be safe, 
// OR use a specific path that excludes json parsing.

// Actually, let's just mount it. If express.json() is already used, we might need to modify server.js structure.
// Let's look at the file again.
// app.use('/api/stripe', stripeRoutes); // Disabled for now (Mock payments only)

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/introvert';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/monetization', monetizationRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    console.log(`\n[EMAIL SERVICE] Sending password reset link to: ${email}`);
    console.log(`[EMAIL SERVICE] Link: http://localhost:5173/reset-password?token=${uuidv4()}\n`);
    res.json({ success: true, message: 'Reset link sent' });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for now, lock down in prod
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Store connected users
// Map<socketId, UserObject>
const users = new Map();

// Queue for matchmaking
// Array of socketIds waiting for a match
let waitingQueue = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user login / initialization
    socket.on('login', (data) => {
        const user = {
            id: socket.id,
            username: data.username || 'Anonymous',
            isPremium: data.isPremium || false,
            subscriptionTier: data.subscriptionTier || 'free',
            country: data.country || 'Unknown',
            gender: data.gender || 'prefer_not_to_say',
            interests: data.interests || [],
            targetCountry: data.targetCountry || 'GLOBAL', // Default to GLOBAL
            targetGender: data.targetGender || 'ANY',
            partnerId: null,
            state: 'IDLE' // IDLE, SEARCHING, CHATTING
        };
        users.set(socket.id, user);
        socket.emit('login_success', user);
    });

    // Helper to check compatibility
    const checkCompatibility = (user1, user2) => {
        // 1. Country Matching
        let u1MatchesU2 = true;
        let u2MatchesU1 = true;

        // User 1 Requirements
        if (user1.isPremium && user1.targetCountry && user1.targetCountry !== 'GLOBAL') {
            // Premium user requesting specific country
            if (user2.country !== user1.targetCountry) u1MatchesU2 = false;
        } else {
            // Free user or Global Premium
            // Free users match globally by default (as per "Country switch = Premium")
            // So we don't restrict them to their own country unless that's the desired default.
            // Assuming "Random Global" is the default for free users.
        }

        // User 2 Requirements
        if (user2.isPremium && user2.targetCountry && user2.targetCountry !== 'GLOBAL') {
            if (user1.country !== user2.targetCountry) u2MatchesU1 = false;
        }

        // 2. Gender Matching (Elite Tier only)
        // Note: We need to pass gender in login data to support this fully.
        // Assuming user object has gender and targetGender if Elite.
        if (user1.subscriptionTier === 'elite' && user1.targetGender && user1.targetGender !== 'ANY') {
            if (user2.gender !== user1.targetGender) u1MatchesU2 = false;
        }
        if (user2.subscriptionTier === 'elite' && user2.targetGender && user2.targetGender !== 'ANY') {
            if (user1.gender !== user2.targetGender) u2MatchesU1 = false;
        }

        return u1MatchesU2 && u2MatchesU1;
    };

    // Start searching for a match
    socket.on('find_match', () => {
        const user = users.get(socket.id);
        if (!user) return;

        if (user.state === 'CHATTING') return;

        user.state = 'SEARCHING';

        // Try to find a match in the queue
        let matchId = null;

        // Iterate through queue to find a match
        // Note: This is O(N), fine for MVP.
        for (let i = 0; i < waitingQueue.length; i++) {
            const partnerId = waitingQueue[i];
            if (partnerId === socket.id) continue; // Should not happen if we manage queue well

            const partner = users.get(partnerId);
            if (partner && partner.state === 'SEARCHING') {
                if (checkCompatibility(user, partner)) {
                    matchId = partnerId;
                    // Remove partner from queue
                    waitingQueue.splice(i, 1);
                    break;
                }
            }
        }

        if (matchId) {
            // Match found!
            const partner = users.get(matchId);

            user.state = 'CHATTING';
            partner.state = 'CHATTING';

            user.partnerId = matchId;
            partner.partnerId = socket.id;

            const roomId = [socket.id, matchId].sort().join('-');
            socket.join(roomId);
            io.sockets.sockets.get(matchId)?.join(roomId);

            io.to(roomId).emit('match_found', { roomId });

            // Notify each user about their partner
            socket.emit('partner_info', { username: partner.username, country: partner.country, interests: partner.interests });
            io.to(matchId).emit('partner_info', { username: user.username, country: user.country, interests: user.interests });

            console.log(`Matched ${user.username} (${user.country}) with ${partner.username} (${partner.country})`);
        } else {
            // No match found, add to queue if not already there
            if (!waitingQueue.includes(socket.id)) {
                waitingQueue.push(socket.id);
            }
        }
    });

    // Handle messages
    socket.on('send_message', (data) => {
        const user = users.get(socket.id);
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('receive_message', {
                text: data.text,
                senderId: socket.id,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Handle skip / next
    socket.on('skip_user', () => {
        const user = users.get(socket.id);
        if (!user) return;

        const partnerId = user.partnerId;
        if (partnerId) {
            const partner = users.get(partnerId);
            if (partner) {
                partner.state = 'IDLE';
                partner.partnerId = null;
                io.to(partnerId).emit('partner_disconnected');
            }
        }

        user.state = 'IDLE';
        user.partnerId = null;

        // Auto search again if desired, or let client trigger it
        // socket.emit('skipped');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const user = users.get(socket.id);

        if (user) {
            // Remove from queue if present
            waitingQueue = waitingQueue.filter(id => id !== socket.id);

            // Notify partner
            if (user.partnerId) {
                const partner = users.get(user.partnerId);
                if (partner) {
                    partner.state = 'IDLE';
                    partner.partnerId = null;
                    io.to(user.partnerId).emit('partner_disconnected');
                }
            }
            users.delete(socket.id);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
