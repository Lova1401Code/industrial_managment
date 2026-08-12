import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, nextId } from '../data/seed.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
const strip = (u) => ({ id: u.id, username: u.username, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.createdAt });

router.get('/', (_req, res) => res.json(db.users.map(strip)));

router.get('/:id', (req, res) => {
  const u = db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  return res.json(strip(u));
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const { username, password, name, email, role } = req.body || {};
  if (!username || !password || !name || !role) return res.status(400).json({ error: 'Champs requis manquants' });
  if (db.users.some(u => u.username === username)) return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });
  const user = {
    id: nextId('u', db.users),
    username, password: bcrypt.hashSync(password, 10), name,
    email: email || '', role, active: true, createdAt: new Date().toISOString()
  };
  db.users.push(user);
  return res.status(201).json(strip(user));
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  const u = db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const { name, email, role, active, password } = req.body || {};
  if (name) u.name = name;
  if (email !== undefined) u.email = email;
  if (role) u.role = role;
  if (active !== undefined) u.active = active;
  if (password) u.password = bcrypt.hashSync(password, 10);
  return res.json(strip(u));
});

router.patch('/:id/role', requireRole('admin'), (req, res) => {
  const u = db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  u.role = req.body.role;
  return res.json(strip(u));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const i = db.users.findIndex(x => x.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });
  db.users[i].active = false;
  return res.json({ ok: true, deactivated: db.users[i].id });
});

export default router;