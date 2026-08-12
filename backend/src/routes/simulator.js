import { Router } from 'express';
import { db, nextId } from '../data/seed.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

function generateReading(machine) {
  const running = machine.status === 'running';
  const baseTemp = 45 + Math.random() * 20;
  const basePress = 4.5 + Math.random() * 1.5;
  const baseVib = 2.0 + Math.random() * 1.5;
  const basePower = 8 + Math.random() * 4;
  const anomaly = machine.status === 'down' || (Math.random() < 0.05 && running);

  return {
    id: nextId('sr', db.sensorReadings),
    machineId: machine.id,
    at: new Date().toISOString(),
    temperature: running ? Math.round((anomaly ? baseTemp + 30 : baseTemp) * 10) / 10 : Math.round((20 + Math.random() * 5) * 10) / 10,
    pressure: running ? Math.round((anomaly ? basePress + 2 : basePress) * 100) / 100 : 0,
    vibration: running ? Math.round((anomaly ? baseVib + 5 : baseVib) * 100) / 100 : 0,
    powerKw: running ? Math.round((anomaly ? basePower * 1.4 : basePower) * 100) / 100 : Math.round(Math.random() * 100) / 100,
    state: machine.status,
    anomaly
  };
}

router.post('/tick', (req, res) => {
  const machineId = req.body.machineId;
  const targets = machineId ? db.machines.filter(m => m.id === machineId) : db.machines;
  const readings = targets.map(generateReading);
  db.sensorReadings.push(...readings);
  if (db.sensorReadings.length > 2000) db.sensorReadings = db.sensorReadings.slice(-2000);
  return res.json(readings);
});

router.get('/readings', (req, res) => {
  let list = db.sensorReadings;
  if (req.query.machineId) list = list.filter(r => r.machineId === req.query.machineId);
  if (req.query.limit) list = list.slice(-Math.min(parseInt(req.query.limit, 10), 500));
  else list = list.slice(-100);
  return res.json(list);
});

router.post('/anomaly-check', requireRole('admin', 'manager'), (req, res) => {
  const machineId = req.body.machineId;
  const last = db.sensorReadings.filter(r => r.machineId === machineId).slice(-10);
  if (last.length < 3) return res.json({ risk: 'unknown', score: 0, message: 'Données insuffisantes' });
  const avgTemp = last.reduce((s, r) => s + r.temperature, 0) / last.length;
  const avgVib = last.reduce((s, r) => s + r.vibration, 0) / last.length;
  let score = 0;
  if (avgTemp > 65) score += 40;
  if (avgVib > 5) score += 40;
  if (last.filter(r => r.anomaly).length >= 3) score += 20;
  score = Math.min(score, 100);
  const risk = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  return res.json({ machineId, risk, score, avgTemp: Math.round(avgTemp * 10) / 10, avgVib: Math.round(avgVib * 100) / 100 });
});

export default router;