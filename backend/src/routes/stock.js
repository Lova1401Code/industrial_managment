import { Router } from 'express';
import { db, nextId } from '../data/seed.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
const isLow = (p) => p.stock <= p.minStock;

router.get('/', (req, res) => res.json(db.parts.map(p => ({ ...p, low: isLow(p) }))));

router.get('/alerts', (_req, res) => {
  const low = db.parts.filter(isLow).map(p => ({
    id: p.id, name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock,
    severity: p.stock === 0 ? 'critical' : 'warning',
    shortfall: p.minStock - p.stock
  }));
  return res.json(low);
});

router.get('/movements', (req, res) => {
  let list = db.stockMovements;
  if (req.query.partId) list = list.filter(m => m.partId === req.query.partId);
  list = list.sort((a, b) => (a.at < b.at ? 1 : -1));
  return res.json(list.map(m => ({
    ...m,
    partName: db.parts.find(p => p.id === m.partId)?.name,
    userName: db.users.find(u => u.id === m.user)?.name
  })));
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.sku) return res.status(400).json({ error: 'Nom et SKU requis' });
  const p = {
    id: nextId('sp', db.parts), name: b.name, sku: b.sku, category: b.category || 'Divers',
    stock: b.stock || 0, minStock: b.minStock || 0, unitCost: b.unitCost || 0, location: b.location || ''
  };
  db.parts.push(p);
  return res.status(201).json(p);
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  const p = db.parts.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Pièce introuvable' });
  const b = req.body || {};
  ['name', 'sku', 'category', 'stock', 'minStock', 'unitCost', 'location'].forEach(k => {
    if (b[k] !== undefined) p[k] = b[k];
  });
  return res.json(p);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const i = db.parts.findIndex(x => x.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Pièce introuvable' });
  const removed = db.parts.splice(i, 1)[0];
  return res.json({ ok: true, deleted: removed.id });
});

router.post('/movements', requireRole('admin', 'manager', 'technician'), (req, res) => {
  const b = req.body || {};
  if (!b.partId || !b.type || b.quantity === undefined) return res.status(400).json({ error: 'partId, type et quantity requis' });
  const p = db.parts.find(x => x.id === b.partId);
  if (!p) return res.status(404).json({ error: 'Pièce introuvable' });
  const qty = Math.abs(b.quantity);
  if (b.type === 'out' && qty > p.stock) return res.status(400).json({ error: 'Stock insuffisant' });
  p.stock += (b.type === 'in' ? qty : -qty);
  const mv = {
    id: nextId('mv', db.stockMovements), partId: b.partId, type: b.type, quantity: qty,
    at: new Date().toISOString(), note: b.note || '', user: req.user.sub
  };
  db.stockMovements.push(mv);
  return res.status(201).json(mv);
});

export default router;