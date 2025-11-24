const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

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
            country: data.country || 'Unknown',
            interests: data.interests || [],
            targetCountry: data.targetCountry || null, // For premium: specific country or 'GLOBAL'
            partnerId: null,
            state: 'IDLE' // IDLE, SEARCHING, CHATTING
        };
        users.set(socket.id, user);
        socket.emit('login_success', user);
    });

    // Helper to check compatibility
    const checkCompatibility = (user1, user2) => {
        // 1. Country Matching
        // User1's requirement for User2
        let u1MatchesU2 = false;
        if (user1.isPremium && user1.targetCountry && user1.targetCountry !== 'GLOBAL') {
            u1MatchesU2 = (user2.country === user1.targetCountry);
        } else if (user1.isPremium && user1.targetCountry === 'GLOBAL') {
            u1MatchesU2 = true;
        } else {
            // Free user: Must be same country
            u1MatchesU2 = (user1.country === user2.country);
        }

        // User2's requirement for User1
        let u2MatchesU1 = false;
        if (user2.isPremium && user2.targetCountry && user2.targetCountry !== 'GLOBAL') {
            u2MatchesU1 = (user1.country === user2.targetCountry);
        } else if (user2.isPremium && user2.targetCountry === 'GLOBAL') {
            u2MatchesU1 = true;
        } else {
            // Free user: Must be same country (or if User1 is Premium and "visiting" virtually?)
            // Let's allow Premium users to match Free users if the Premium user targets the Free user's country.
            // But strictly speaking, if User2 is Free, they expect User1 to be from same country.
            // We'll treat Premium's targetCountry as effective location for this check if we want to allow it.
            // For now, strict check:
            u2MatchesU1 = (user2.country === user1.country);

            // Exception: If User1 is Premium and targets User2's country, we allow it?
            // Let's say YES, Premium users override the location check for the other person?
            // Or simpler:
            if (user1.isPremium && user1.targetCountry === user2.country) {
                u2MatchesU1 = true;
            }
        }

        if (!u1MatchesU2 || !u2MatchesU1) return false;

        // 2. Interest Matching (Optional boost, not strict filter for MVP unless specified)
        // "Match with ... Same preferred interests (if available)"
        // We won't block on interests, but we could prioritize.
        // For this implementation, we just return true if location matches.
        // We can add a score later.

        return true;
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
