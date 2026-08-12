import { Router } from 'express';
import { db, nextId } from '../data/seed.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const { status, line } = req.query;
  let list = db.machines;
  if (status) list = list.filter(m => m.status === status);
  if (line) list = list.filter(m => m.line === line);
  return res.json(list);
});

router.get('/:id', (req, res) => {
  const m = db.machines.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Machine introuvable' });
  const history = db.machineHistory.filter(h => h.machineId === m.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  return res.json({ ...m, history });
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.type) return res.status(400).json({ error: 'Nom et type requis' });
  const m = {
    id: nextId('m', db.machines),
    name: b.name, type: b.type, line: b.line || 'A', status: b.status || 'idle',
    installDate: b.installDate || new Date().toISOString().slice(0, 10),
    manufacturer: b.manufacturer || '', model: b.model || '',
    dailyTarget: b.dailyTarget || 0, lastMaintenance: b.lastMaintenance || null,
    createdAt: new Date().toISOString()
  };
  db.machines.push(m);
  db.machineHistory.push({ id: nextId('h', db.machineHistory), machineId: m.id, event: 'created', note: 'Machine créée', at: new Date().toISOString() });
  return res.status(201).json(m);
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  const m = db.machines.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Machine introuvable' });
  const b = req.body || {};
  ['name', 'type', 'line', 'status', 'manufacturer', 'model', 'dailyTarget', 'lastMaintenance'].forEach(k => {
    if (b[k] !== undefined) m[k] = b[k];
  });
  return res.json(m);
});

router.patch('/:id/status', requireRole('admin', 'manager', 'technician'), (req, res) => {
  const m = db.machines.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Machine introuvable' });
  const old = m.status;
  m.status = req.body.status;
  db.machineHistory.push({
    id: nextId('h', db.machineHistory), machineId: m.id, event: req.body.status,
    note: req.body.note || `Statut: ${old} -> ${req.body.status}`, at: new Date().toISOString()
  });
  return res.json(m);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const i = db.machines.findIndex(x => x.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Machine introuvable' });
  const removed = db.machines.splice(i, 1)[0];
  db.machineHistory = db.machineHistory.filter(h => h.machineId !== removed.id);
  return res.json({ ok: true, deleted: removed.id });
});

router.get('/:id/history', (req, res) => {
  const list = db.machineHistory.filter(h => h.machineId === req.params.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  return res.json(list);
});

export default router;