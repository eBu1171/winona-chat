const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "https://winona-chat.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://winona-chat.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory storage for users waiting for a match
const waitingUsers = {
  male: [],
  female: []
};

// Currently active chats
const activeChats = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user gender selection
  socket.on('setGender', (gender) => {
    socket.gender = gender;
    console.log(`User ${socket.id} set gender: ${gender}`);

    // Find a match (opposite gender)
    const oppositeGender = gender === 'male' ? 'female' : 'male';

    if (waitingUsers[oppositeGender].length > 0) {
      // Match found - Get the first waiting user of opposite gender
      const partnerSocket = waitingUsers[oppositeGender].shift();

      // Create a unique room ID for these two users
      const roomId = `${socket.id}-${partnerSocket.id}`;

      // Join both users to the room
      socket.join(roomId);
      partnerSocket.join(roomId);

      // Mark both users as being in an active chat
      activeChats.set(socket.id, {
        roomId,
        partnerId: partnerSocket.id
      });

      activeChats.set(partnerSocket.id, {
        roomId,
        partnerId: socket.id
      });

      // Inform both users they've been matched
      io.to(socket.id).emit('chatMatched', {
        partnerId: partnerSocket.id
      });

      io.to(partnerSocket.id).emit('chatMatched', {
        partnerId: socket.id
      });

      console.log(`Matched: ${socket.id} (${gender}) with ${partnerSocket.id} (${oppositeGender})`);
    } else {
      // No match found - Add user to waiting queue
      waitingUsers[gender].push(socket);
      socket.emit('waiting');
      console.log(`User ${socket.id} added to ${gender} waiting queue`);
    }
  });

  // Handle chat messages
  socket.on('sendMessage', (message) => {
    const userChat = activeChats.get(socket.id);
    if (userChat) {
      io.to(userChat.roomId).emit('message', {
        sender: socket.id,
        text: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle ending a chat
  socket.on('endChat', () => {
    const userChat = activeChats.get(socket.id);
    if (userChat) {
      const { roomId, partnerId } = userChat;

      // Notify partner the chat ended with a reason
      io.to(partnerId).emit('chatEnded', { reason: 'partner-ended' });

      // Remove both users from the room
      socket.leave(roomId);
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.leave(roomId);
      }

      // Remove both users from active chats
      activeChats.delete(socket.id);
      activeChats.delete(partnerId);

      console.log(`Chat ended between ${socket.id} and ${partnerId}`);
    }
  });

  // Handle finding a new chat partner
  socket.on('findNewChat', () => {
    // Clear any existing chat first
    const userChat = activeChats.get(socket.id);
    if (userChat) {
      socket.emit('endChat');
    }

    if (socket.gender) {
      // Re-add to waiting queue with existing gender
      waitingUsers[socket.gender].push(socket);
      socket.emit('waiting');
      console.log(`User ${socket.id} looking for new partner, added to ${socket.gender} waiting queue`);
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // If user was in an active chat, notify partner
    const userChat = activeChats.get(socket.id);
    if (userChat) {
      const { partnerId } = userChat;
      io.to(partnerId).emit('chatEnded', { reason: 'partner-disconnected' });
      activeChats.delete(partnerId);
      activeChats.delete(socket.id);
    }

    // Remove from waiting queues if present
    if (socket.gender) {
      waitingUsers[socket.gender] = waitingUsers[socket.gender].filter(user => user.id !== socket.id);
    }
  });

  // Handle typing status
  socket.on('typing', (isTyping) => {
    const userChat = activeChats.get(socket.id);
    if (userChat) {
      // Log the typing event
      console.log(`User ${socket.id} typing status: ${isTyping}, partner: ${userChat.partnerId}`);

      // Send directly to the partner
      io.to(userChat.partnerId).emit('typing', {
        userId: socket.id,
        isTyping: isTyping
      });
    }
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const stats = {
    online: io.sockets.sockets.size,
    waiting: {
      male: waitingUsers.male.length,
      female: waitingUsers.female.length
    },
    activeChats: Math.floor(activeChats.size / 2) // Divide by 2 since each chat has 2 participants
  };

  res.json(stats);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 