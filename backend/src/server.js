import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db, resetDb } from './data/seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import machineRoutes from './routes/machines.js';
import productionRoutes from './routes/production.js';
import maintenanceRoutes from './routes/maintenance.js';
import stockRoutes from './routes/stock.js';
import alertRoutes from './routes/alerts.js';
import dashboardRoutes from './routes/dashboard.js';
import simulatorRoutes from './routes/simulator.js';
import { authMiddleware } from './middleware/auth.js';
import { errorLogger, notFound } from './middleware/errors.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.post('/reset', (_req, res) => { resetDb(); res.json({ ok: true }); });

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/machines', authMiddleware, machineRoutes);
app.use('/api/production', authMiddleware, productionRoutes);
app.use('/api/maintenance', authMiddleware, maintenanceRoutes);
app.use('/api/stock', authMiddleware, stockRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/simulator', authMiddleware, simulatorRoutes);

app.use(notFound);
app.use(errorLogger);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});