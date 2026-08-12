import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { db, resetDb, nextId } from '../src/data/seed.js';

test('seed: données de départ présentes', () => {
  resetDb();
  assert.ok(db.users.length >= 5);
  assert.ok(db.machines.length >= 5);
  assert.ok(db.productions.length > 100);
  assert.ok(db.parts.length >= 5);
  assert.ok(db.maintenances.length >= 3);
  assert.ok(db.alerts.length >= 3);
});

test('seed: le mot de passe admin est hashé', () => {
  resetDb();
  const admin = db.users.find(u => u.username === 'admin');
  assert.ok(admin);
  assert.ok(bcrypt.compareSync('admin123', admin.password));
});

test('nextId: génère un identifiant incrémental', () => {
  resetDb();
  const id = nextId('m', db.machines);
  assert.match(id, /^m\d+$/);
  const n = parseInt(id.slice(1), 10);
  assert.ok(n > 0);
});

test('seed: les productions respectent le format attendu', () => {
  resetDb();
  const p = db.productions[0];
  assert.ok(p.machineId);
  assert.ok(typeof p.target === 'number' && p.target > 0);
  assert.ok(typeof p.actual === 'number');
  assert.ok(p.goodUnits <= p.actual);
});

test('seed: chaque alerte a un type valide', () => {
  resetDb();
  const types = ['machine_down', 'low_stock', 'maintenance_due', 'anomaly'];
  for (const a of db.alerts) assert.ok(types.includes(a.type));
});