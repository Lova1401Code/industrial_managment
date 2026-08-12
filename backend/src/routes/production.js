import { Router } from 'express';
import { db, nextId } from '../data/seed.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
const ratio = (p) => (p.target > 0 ? Math.round((p.actual / p.target) * 1000) / 10 : 0);
const decorate = (p) => ({ ...p, achievementRate: ratio(p) });

router.get('/', (req, res) => {
  let list = db.productions;
  if (req.query.date) list = list.filter(p => p.date === req.query.date);
  if (req.query.machineId) list = list.filter(p => p.machineId === req.query.machineId);
  list = list.sort((a, b) => (a.date < b.date ? 1 : -1));
  return res.json(list.map(decorate));
});

router.get('/today', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const list = db.productions.filter(p => p.date === today);
  const totalTarget = list.reduce((s, p) => s + p.target, 0);
  const totalActual = list.reduce((s, p) => s + p.actual, 0);
  const totalGood = list.reduce((s, p) => s + p.goodUnits, 0);
  return res.json({
    date: today,
    count: list.length,
    totalTarget, totalActual, totalGood,
    achievementRate: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 1000) / 10 : 0,
    qualityRate: totalActual > 0 ? Math.round((totalGood / totalActual) * 1000) / 10 : 0,
    lines: db.machines.reduce((acc, m) => {
      const p = list.find(x => x.machineId === m.id);
      if (p) acc[m.line] = acc[m.line] || { target: 0, actual: 0, good: 0 };
      if (p) { acc[m.line].target += p.target; acc[m.line].actual += p.actual; acc[m.line].good += p.goodUnits; }
      return acc;
    }, {})
  });
});

router.get('/history', (req, res) => {
  const days = parseInt(req.query.days || '30', 10);
  const since = new Date(); since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);
  const list = db.productions.filter(p => p.date >= sinceStr).sort((a, b) => (a.date < b.date ? -1 : 1));
  const byDate = {};
  for (const p of list) {
    byDate[p.date] = byDate[p.date] || { date: p.date, target: 0, actual: 0, good: 0 };
    byDate[p.date].target += p.target;
    byDate[p.date].actual += p.actual;
    byDate[p.date].good += p.goodUnits;
  }
  return res.json(Object.values(byDate));
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const b = req.body || {};
  if (!b.machineId || !b.date || b.target === undefined || b.actual === undefined) {
    return res.status(400).json({ error: 'machineId, date, target et actual requis' });
  }
  const p = {
    id: nextId('p', db.productions),
    machineId: b.machineId, date: b.date, target: b.target, actual: b.actual,
    goodUnits: b.goodUnits !== undefined ? b.goodUnits : b.actual,
    createdAt: new Date().toISOString()
  };
  db.productions.push(p);
  return res.status(201).json(decorate(p));
});

export default router;