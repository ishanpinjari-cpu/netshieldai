import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { io as ioClient } from 'socket.io-client';
import connectDB from './config/db.js';
import config from './config/env.js';
import authRoutes from './routes/auth.js';
import {
  packetsRouter, alertsRouter, devicesRouter,
  threatsRouter, logsRouter, analyticsRouter,
  settingsRouter, mlRouter,
} from './routes/api.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO server (for frontend clients)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Connect DB (won't crash if MongoDB isn't running)
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packets', packetsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/threats', threatsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/ml', mlRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NetShield AI Backend',
    ml_connected: mlSocketConnected,
    timestamp: new Date().toISOString(),
  });
});

// =============================================
//  Connect to Python ML Service via WebSocket
// =============================================

let mlSocketConnected = false;
const ML_SERVICE_URL = config.mlServiceUrl || 'http://localhost:8000';

function connectToMLService() {
  console.log(`🔗 Connecting to ML Service at ${ML_SERVICE_URL}...`);

  const mlSocket = ioClient(ML_SERVICE_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 3000,
    reconnectionAttempts: Infinity,
  });

  mlSocket.on('connect', () => {
    console.log('✅ Connected to ML Service');
    mlSocketConnected = true;

    // Tell ML service to start streaming
    mlSocket.emit('stream:start');
  });

  mlSocket.on('disconnect', () => {
    console.log('❌ Disconnected from ML Service');
    mlSocketConnected = false;
  });

  mlSocket.on('connect_error', (err) => {
    if (!mlSocketConnected) {
      // Only log once on initial failure
      console.log('⏳ ML Service not ready yet — retrying...');
    }
  });

  // Relay all ML service events to connected frontend clients
  const relayEvents = [
    'stats:update', 'traffic:update', 'protocols:update',
    'topips:update', 'packet:new', 'detection:new',
    'alert:new', 'stats:threats', 'training:complete',
    'stream:status', 'connection:status',
  ];

  relayEvents.forEach((event) => {
    mlSocket.on(event, (data) => {
      io.emit(event, data);
    });
  });

  return mlSocket;
}

// =============================================
//  Socket.IO — Frontend Client Handling
// =============================================

io.on('connection', (socket) => {
  console.log(`🔌 Frontend client connected: ${socket.id}`);

  // Send initial status
  socket.emit('connection:status', {
    ml_connected: mlSocketConnected,
    server: 'NetShield AI Backend',
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Frontend client disconnected: ${socket.id}`);
  });
});

// =============================================
//  Start Server
// =============================================

const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`\n🛡️  NetShield AI Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);

  // Connect to ML service after server starts
  connectToMLService();
});

export { io };
