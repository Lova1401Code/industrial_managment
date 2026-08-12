import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, nextId } from '../data/seed.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Identifiants requis' });
  const user = db.users.find(u => u.username === username && u.active);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const token = signToken(user);
  return res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  return res.json({ id: user.id, username: user.username, name: user.name, role: user.role, email: user.email, active: user.active });
});

router.post('/logout', authMiddleware, (_req, res) => {
  res.json({ ok: true });
});

export default router;