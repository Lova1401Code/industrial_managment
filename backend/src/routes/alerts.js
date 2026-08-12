import { Router } from 'express';
import { db, nextId } from '../data/seed.js';

const router = Router();

router.get('/', (req, res) => {
  let list = db.alerts;
  if (req.query.unresolved === 'true') list = list.filter(a => !a.resolved);
  if (req.query.severity) list = list.filter(a => a.severity === req.query.severity);
  list = list.sort((a, b) => (a.at < b.at ? 1 : -1));
  return res.json(list);
});

router.patch('/:id/resolve', (req, res) => {
  const a = db.alerts.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Alerte introuvable' });
  a.resolved = true;
  a.resolvedAt = new Date().toISOString();
  return res.json(a);
});

router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.type || !b.message) return res.status(400).json({ error: 'type et message requis' });
  const a = {
    id: nextId('al', db.alerts), type: b.type, severity: b.severity || 'info',
    message: b.message, machineId: b.machineId || null, partId: b.partId || null,
    at: new Date().toISOString(), resolved: false
  };
  db.alerts.push(a);
  return res.status(201).json(a);
});

export default router;