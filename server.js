const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Make io globally accessible
  global.io = io;

  // Socket.io connection handling for ACTIVITY GROUP CHATS
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join an activity chat room
    socket.on('join-activity', (activityId) => {
      socket.join(`activity-${activityId}`);
      console.log(`🔵 Socket ${socket.id} joined activity-${activityId}`);
      
      // Notify others in the room
      socket.to(`activity-${activityId}`).emit('user-joined-activity', {
        socketId: socket.id,
      });
    });

    // Leave an activity chat room
    socket.on('leave-activity', (activityId) => {
      socket.leave(`activity-${activityId}`);
      console.log(`🔴 Socket ${socket.id} left activity-${activityId}`);
      
      // Notify others in the room
      socket.to(`activity-${activityId}`).emit('user-left-activity', {
        socketId: socket.id,
      });
    });

    // User is typing in activity chat
    socket.on('typing', ({ activityId, userName }) => {
      socket.to(`activity-${activityId}`).emit('user-typing', { userName });
      console.log(`⌨️  ${userName} is typing in activity-${activityId}`);
    });

    // User stopped typing
    socket.on('stop-typing', ({ activityId }) => {
      socket.to(`activity-${activityId}`).emit('user-stopped-typing');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 Server ready                      ║
║   📡 http://${hostname}:${port}      ║
║   💬 Socket.io initialized             ║
║   🎯 Activity Group Chat enabled       ║
╚════════════════════════════════════════╝
      `);
    });
});