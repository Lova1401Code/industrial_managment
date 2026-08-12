import { Router } from 'express';
import { db, nextId } from '../data/seed.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const decorateMaintenance = (m) => {
  const machine = db.machines.find(x => x.id === m.machineId);
  const tech = db.users.find(u => u.id === m.technicianId);
  return {
    ...m,
    machine: machine ? { id: machine.id, name: machine.name, line: machine.line } : null,
    technician: tech ? { id: tech.id, name: tech.name } : null
  };
};

router.get('/', (req, res) => {
  let list = db.maintenances;
  if (req.query.status) list = list.filter(m => m.status === req.query.status);
  if (req.query.machineId) list = list.filter(m => m.machineId === req.query.machineId);
  return res.json(list.map(decorateMaintenance));
});

router.get('/costs', (req, res) => {
  const days = parseInt(req.query.days || '30', 10);
  const since = new Date(); since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();
  const list = db.maintenances.filter(m => m.endedAt && m.endedAt >= sinceStr);
  const total = list.reduce((s, m) => s + (m.cost || 0), 0);
  const byMachine = {};
  for (const m of list) {
    byMachine[m.machineId] = (byMachine[m.machineId] || 0) + (m.cost || 0);
  }
  const machineCosts = Object.entries(byMachine).map(([id, cost]) => {
    const m = db.machines.find(x => x.id === id);
    return { machineId: id, name: m ? m.name : id, cost };
  }).sort((a, b) => b.cost - a.cost);
  return res.json({ periodDays: days, total, count: list.length, machineCosts });
});

router.get('/:id', (req, res) => {
  const m = db.maintenances.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Maintenance introuvable' });
  return res.json(decorateMaintenance(m));
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const b = req.body || {};
  if (!b.machineId || !b.type || !b.description) return res.status(400).json({ error: 'machineId, type et description requis' });
  const m = {
    id: nextId('mt', db.maintenances),
    machineId: b.machineId, type: b.type, technicianId: b.technicianId || null,
    status: b.status || 'scheduled', startedAt: b.startedAt || null, endedAt: b.endedAt || null,
    cost: b.cost || 0, description: b.description,
    breakdownId: b.breakdownId || null, scheduledFor: b.scheduledFor || null
  };
  db.maintenances.push(m);
  return res.status(201).json(decorateMaintenance(m));
});

router.patch('/:id', requireRole('admin', 'manager', 'technician'), (req, res) => {
  const m = db.maintenances.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Maintenance introuvable' });
  ['technicianId', 'status', 'startedAt', 'endedAt', 'cost', 'description'].forEach(k => {
    if (req.body[k] !== undefined) m[k] = req.body[k];
  });
  return res.json(decorateMaintenance(m));
});

router.post('/breakdown', requireRole('admin', 'manager', 'technician'), (req, res) => {
  const b = req.body || {};
  if (!b.machineId || !b.description) return res.status(400).json({ error: 'machineId et description requis' });
  const breakdown = {
    id: nextId('b', db.breakdowns),
    machineId: b.machineId, reportedAt: new Date().toISOString(),
    reportedBy: req.user.sub, description: b.description,
    severity: b.severity || 'medium', status: 'open', cause: b.cause || null
  };
  db.breakdowns.push(breakdown);
  const machine = db.machines.find(x => x.id === b.machineId);
  if (machine) machine.status = 'down';
  db.machineHistory.push({ id: nextId('h', db.machineHistory), machineId: b.machineId, event: 'breakdown', note: b.description, at: breakdown.reportedAt });
  return res.status(201).json(breakdown);
});

router.get('/breakdowns', (req, res) => {
  let list = db.breakdowns;
  if (req.query.status) list = list.filter(b => b.status === req.query.status);
  list = list.sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1));
  return res.json(list.map(b => ({
    ...b,
    machine: db.machines.find(m => m.id === b.machineId)?.name
  })));
});

router.patch('/breakdowns/:id', requireRole('admin', 'manager', 'technician'), (req, res) => {
  const b = db.breakdowns.find(x => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: 'Panne introuvable' });
  ['status', 'cause', 'severity'].forEach(k => {
    if (req.body[k] !== undefined) b[k] = req.body[k];
  });
  return res.json(b);
});

export default router;