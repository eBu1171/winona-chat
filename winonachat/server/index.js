const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Add a simple health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Server is running', stats });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Updated to match client URL
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Stats tracking
let stats = {
    online: 0,
    activeChats: 0,
    malesWaiting: 0,
    femalesWaiting: 0
};

// Waiting queues
const maleQueue = [];
const femaleQueue = [];

// Store active chats
const activeChats = new Map();

// Handle socket connections
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    stats.online++;
    io.emit('stats', stats);

    // Handle user entering the matching queue
    socket.on('find_match', (userData) => {
        console.log(`User ${socket.id} looking for match as ${userData.gender}`);

        // Remove user from any previous queue
        const maleIndex = maleQueue.findIndex(user => user.socketId === socket.id);
        if (maleIndex !== -1) {
            maleQueue.splice(maleIndex, 1);
            stats.malesWaiting--;
        }

        const femaleIndex = femaleQueue.findIndex(user => user.socketId === socket.id);
        if (femaleIndex !== -1) {
            femaleQueue.splice(femaleIndex, 1);
            stats.femalesWaiting--;
        }

        // Add user to appropriate queue
        const userInfo = {
            socketId: socket.id,
            gender: userData.gender
        };

        if (userData.gender === 'male') {
            maleQueue.push(userInfo);
            stats.malesWaiting++;

            // Check if there's a female waiting
            if (femaleQueue.length > 0) {
                const femaleMatch = femaleQueue.shift();
                stats.femalesWaiting--;
                matchUsers(userInfo, femaleMatch);
            }
        } else if (userData.gender === 'female') {
            femaleQueue.push(userInfo);
            stats.femalesWaiting++;

            // Check if there's a male waiting
            if (maleQueue.length > 0) {
                const maleMatch = maleQueue.shift();
                stats.malesWaiting--;
                matchUsers(maleMatch, userInfo);
            }
        }

        // Emit updated stats to all users
        io.emit('stats', stats);
    });

    // Handle chat messages
    socket.on('send_message', (messageData) => {
        const { chatId, message } = messageData;

        if (activeChats.has(chatId)) {
            const { user1, user2 } = activeChats.get(chatId);

            // Send message to the other user in the chat
            if (socket.id === user1.socketId) {
                io.to(user2.socketId).emit('receive_message', { message, sender: 'partner' });
            } else if (socket.id === user2.socketId) {
                io.to(user1.socketId).emit('receive_message', { message, sender: 'partner' });
            }
        }
    });

    // Handle user canceling match search
    socket.on('cancel_search', () => {
        removeFromQueues(socket.id);
        io.emit('stats', stats);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        stats.online--;

        // Remove from queues
        removeFromQueues(socket.id);

        // End any active chats
        endActiveChats(socket.id);

        // Update stats for everyone
        io.emit('stats', stats);
    });
});

// Function to match two users
function matchUsers(user1, user2) {
    const chatId = `chat_${Date.now()}`;

    // Store the chat
    activeChats.set(chatId, { user1, user2 });
    stats.activeChats++;

    // Notify both users of the match
    io.to(user1.socketId).emit('match_found', { chatId, partnerGender: user2.gender });
    io.to(user2.socketId).emit('match_found', { chatId, partnerGender: user1.gender });

    console.log(`Matched users: ${user1.socketId} (${user1.gender}) and ${user2.socketId} (${user2.gender})`);
}

// Function to remove a user from waiting queues
function removeFromQueues(socketId) {
    const maleIndex = maleQueue.findIndex(user => user.socketId === socketId);
    if (maleIndex !== -1) {
        maleQueue.splice(maleIndex, 1);
        stats.malesWaiting--;
    }

    const femaleIndex = femaleQueue.findIndex(user => user.socketId === socketId);
    if (femaleIndex !== -1) {
        femaleQueue.splice(femaleIndex, 1);
        stats.femalesWaiting--;
    }
}

// Function to end active chats for a disconnected user
function endActiveChats(socketId) {
    for (const [chatId, chat] of activeChats.entries()) {
        const { user1, user2 } = chat;

        if (user1.socketId === socketId) {
            io.to(user2.socketId).emit('chat_ended', { reason: 'partner_disconnected' });
            activeChats.delete(chatId);
            stats.activeChats--;
        } else if (user2.socketId === socketId) {
            io.to(user1.socketId).emit('chat_ended', { reason: 'partner_disconnected' });
            activeChats.delete(chatId);
            stats.activeChats--;
        }
    }
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 