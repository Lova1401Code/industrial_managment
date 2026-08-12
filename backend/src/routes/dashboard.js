import { Router } from 'express';
import { db } from '../data/seed.js';

const router = Router();

router.get('/', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayProd = db.productions.filter(p => p.date === today);
  const totalTarget = todayProd.reduce((s, p) => s + p.target, 0);
  const totalActual = todayProd.reduce((s, p) => s + p.actual, 0);
  const totalGood = todayProd.reduce((s, p) => s + p.goodUnits, 0);

  const downMachines = db.machines.filter(m => m.status === 'down');
  const maintenanceMachines = db.machines.filter(m => m.status === 'maintenance');
  const ongoingMaintenances = db.maintenances.filter(m => m.status === 'in_progress');
  const scheduledMaintenances = db.maintenances.filter(m => m.status === 'scheduled');
  const lowStock = db.parts.filter(p => p.stock <= p.minStock);
  const openAlerts = db.alerts.filter(a => !a.resolved);

  const downtimesByMachine = downMachines.concat(maintenanceMachines).map(m => {
    const lastDown = db.machineHistory
      .filter(h => h.machineId === m.id && ['down', 'breakdown', 'maintenance_start'].includes(h.event))
      .sort((a, b) => (a.at < b.at ? 1 : -1))[0];
    const hours = lastDown ? Math.round((Date.now() - new Date(lastDown.at).getTime()) / 3600000) : 0;
    return { machineId: m.id, name: m.name, line: m.line, status: m.status, downtimeHours: hours };
  }).sort((a, b) => b.downtimeHours - a.downtimeHours);

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const maintenanceCost30d = db.maintenances
    .filter(m => m.endedAt && new Date(m.endedAt) >= thirtyDaysAgo)
    .reduce((s, m) => s + (m.cost || 0), 0);

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const prods = db.productions.filter(p => p.date === ds);
    last7Days.push({
      date: ds,
      target: prods.reduce((s, p) => s + p.target, 0),
      actual: prods.reduce((s, p) => s + p.actual, 0),
      good: prods.reduce((s, p) => s + p.goodUnits, 0)
    });
  }

  const productionByLine = db.machines.reduce((acc, m) => {
    const p = todayProd.find(x => x.machineId === m.id);
    if (p) {
      acc[m.line] = acc[m.line] || { line: m.line, target: 0, actual: 0, good: 0, machines: 0 };
      acc[m.line].target += p.target; acc[m.line].actual += p.actual; acc[m.line].good += p.goodUnits;
      acc[m.line].machines += 1;
    }
    return acc;
  }, {});
  const lineRanking = Object.values(productionByLine).map(l => ({
    ...l, achievementRate: l.target > 0 ? Math.round((l.actual / l.target) * 1000) / 10 : 0
  })).sort((a, b) => b.achievementRate - a.achievementRate);

  return res.json({
    date: today,
    kpi: {
      productionToday: { target: totalTarget, actual: totalActual, good: totalGood,
        achievementRate: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 1000) / 10 : 0,
        qualityRate: totalActual > 0 ? Math.round((totalGood / totalActual) * 1000) / 10 : 0 },
      machines: { total: db.machines.length, running: db.machines.filter(m => m.status === 'running').length,
        down: downMachines.length, maintenance: maintenanceMachines.length, idle: db.machines.filter(m => m.status === 'idle').length },
      maintenance: { ongoing: ongoingMaintenances.length, scheduled: scheduledMaintenances.length, cost30d: maintenanceCost30d },
      stock: { total: db.parts.length, low: lowStock.length, critical: lowStock.filter(p => p.stock === 0).length },
      alerts: { open: openAlerts.length, critical: openAlerts.filter(a => a.severity === 'critical').length,
        warning: openAlerts.filter(a => a.severity === 'warning').length, info: openAlerts.filter(a => a.severity === 'info').length }
    },
    downMachines,
    ongoingMaintenances,
    lowStock,
    openAlerts,
    downtimesByMachine,
    productionByLine: lineRanking,
    productionTrend7d: last7Days
  });
});

export default router;