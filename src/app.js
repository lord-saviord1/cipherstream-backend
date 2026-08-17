import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { console.error('[db] Connection failed:', err.message); res.status(500).json({ error: 'Database connection failed' }); }
});
app.use('/api/webhooks/monnify', express.raw({ type: '*/*' }), (req, res, next) => { req.rawBody = req.body; next(); });
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'CipherStream backend' }));
export default app;
