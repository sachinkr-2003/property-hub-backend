const { Server } = require('socket.io');
const Conversation = require('../models/Conversation');

let io = null;

const initChatSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`⚡ [Socket.io Connected] Client ID: ${socket.id}`);

    // Join a specific property/user chat thread room
    socket.on('join_thread', (threadId) => {
      if (!threadId) return;
      socket.join(threadId);
      console.log(`💬 Client ${socket.id} joined thread room: ${threadId}`);
    });

    // Leave thread room
    socket.on('leave_thread', (threadId) => {
      if (!threadId) return;
      socket.leave(threadId);
    });

    // Real-time message dispatch
    socket.on('send_message', async (data) => {
      try {
        const { threadId, text, senderName, senderId, isSender } = data;
        if (!threadId || !text) return;

        const messageObj = {
          customId: `msg-${Date.now()}`,
          senderId: senderId || 'user',
          senderName: senderName || 'User',
          text: text.trim(),
          isSender: isSender !== undefined ? isSender : true,
          timestamp: new Date(),
        };

        // 1. Broadcast immediately to all clients in the room (Optimistic WebSocket delivery)
        io.to(threadId).emit('receive_message', {
          threadId,
          message: messageObj,
        });

        // 2. Persist message asynchronously to MongoDB
        try {
          const conv = await Conversation.findOne({
            $or: [{ customId: threadId }, { _id: threadId }],
          });

          if (conv) {
            conv.messages.push(messageObj);
            conv.lastMessage = text.trim();
            conv.lastMessageTime = new Date();
            await conv.save();
          }
        } catch (dbErr) {
          console.warn('[ChatSocket] Failed persisting message to DB:', dbErr.message);
        }
      } catch (err) {
        console.error('[ChatSocket] Error in send_message:', err.message);
      }
    });

    // Real-time typing indicators
    socket.on('typing', ({ threadId, senderName, isTyping }) => {
      if (!threadId) return;
      socket.to(threadId).emit('user_typing', {
        threadId,
        senderName,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io Disconnected] Client ID: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = {
  initChatSocket,
  getIo,
};
