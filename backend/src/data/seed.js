import bcrypt from 'bcryptjs';

const deepClone = (o) => JSON.parse(JSON.stringify(o));

const today = new Date();
const dayOffset = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const seedData = {
  users: [
    { id: 'u1', username: 'admin',  password: bcrypt.hashSync('admin123', 10), name: 'Administrateur Général', role: 'admin',  email: 'admin@indus.local',  active: true, createdAt: dayOffset(120) },
    { id: 'u2', username: 'manager', password: bcrypt.hashSync('manager123', 10), name: 'Responsable Production', role: 'manager', email: 'manager@indus.local', active: true, createdAt: dayOffset(100) },
    { id: 'u3', username: 'tech1', password: bcrypt.hashSync('tech123', 10), name: 'Jean Dupont (Technicien)', role: 'technician', email: 'tech1@indus.local', active: true, createdAt: dayOffset(80) },
    { id: 'u4', username: 'tech2', password: bcrypt.hashSync('tech123', 10), name: 'Marie Martin (Technicienne)', role: 'technician', email: 'tech2@indus.local', active: true, createdAt: dayOffset(70) },
    { id: 'u5', username: 'viewer', password: bcrypt.hashSync('viewer123', 10), name: 'Observateur', role: 'viewer', email: 'viewer@indus.local', active: true, createdAt: dayOffset(30) },
    { id: 'u6', username: 'olduser', password: bcrypt.hashSync('old123', 10), name: 'Ancien Employé', role: 'viewer', email: 'old@indus.local', active: false, createdAt: dayOffset(200) }
  ],
  machines: [
    { id: 'm1', name: 'Ligne A - Embouteillage', type: 'Embouteillage', line: 'A', status: 'running', installDate: '2020-01-15', manufacturer: 'Bosch', model: 'FAB-1', dailyTarget: 10000, lastMaintenance: dayOffset(15), createdAt: dayOffset(120) },
    { id: 'm2', name: 'Ligne A - Remplissage',  type: 'Remplissage', line: 'A', status: 'running', installDate: '2020-01-15', manufacturer: 'Krones', model: 'VODM-A', dailyTarget: 9000, lastMaintenance: dayOffset(10), createdAt: dayOffset(120) },
    { id: 'm3', name: 'Ligne B - Pressage',    type: 'Pressage', line: 'B', status: 'down', installDate: '2018-06-01', manufacturer: 'Siemens', model: 'P-200', dailyTarget: 8000, lastMaintenance: dayOffset(45), createdAt: dayOffset(120) },
    { id: 'm4', name: 'Ligne B - Séchage',      type: 'Séchage', line: 'B', status: 'maintenance', installDate: '2019-03-10', manufacturer: 'GEA', model: 'D-50', dailyTarget: 7500, lastMaintenance: dayOffset(5), createdAt: dayOffset(120) },
    { id: 'm5', name: 'Ligne C - Conditionnement', type: 'Conditionnement', line: 'C', status: 'running', installDate: '2021-09-01', manufacturer: 'Sidel', model: 'C-300', dailyTarget: 12000, lastMaintenance: dayOffset(20), createdAt: dayOffset(120) },
    { id: 'm6', name: 'Ligne C - Fardelage',    type: 'Fardelage', line: 'C', status: 'idle', installDate: '2021-09-01', manufacturer: 'Sidel', model: 'F-2', dailyTarget: 11000, lastMaintenance: dayOffset(25), createdAt: dayOffset(120) }
  ],
  machineHistory: [
    { id: 'h1', machineId: 'm1', event: 'start', note: 'Démarrage', at: dayOffset(1) },
    { id: 'h2', machineId: 'm3', event: 'breakdown', note: 'Vibrations anormales détectées', at: dayOffset(2) },
    { id: 'h3', machineId: 'm4', event: 'maintenance_start', note: 'Maintenance préventive programmée', at: dayOffset(3) },
    { id: 'h4', machineId: 'm3', event: 'down', note: 'Arrêt complet', at: dayOffset(2) },
    { id: 'h5', machineId: 'm6', event: 'idle', note: 'En attente de produit', at: dayOffset(1) }
  ],
  productions: [],
  breakdowns: [
    { id: 'b1', machineId: 'm3', reportedAt: dayOffset(2), reportedBy: 'u2', description: 'Vibrations anormales sur la presse', severity: 'high', status: 'open', cause: 'Suspected bearing failure' },
    { id: 'b2', machineId: 'm1', reportedAt: dayOffset(20), reportedBy: 'u3', description: 'Bruit anormal moteur convoyeur', severity: 'medium', status: 'resolved', cause: 'Roulement usé remplacé' },
    { id: 'b3', machineId: 'm4', reportedAt: dayOffset(30), reportedBy: 'u2', description: 'Surchauffe circuit vapeur', severity: 'critical', status: 'resolved', cause: 'Vanne défectueuse remplacée' }
  ],
  maintenances: [
    { id: 'mt1', machineId: 'm4', type: 'preventive', technicianId: 'u3', status: 'in_progress', startedAt: dayOffset(3), endedAt: null, cost: 0, description: 'Maintenance préventive trimestrielle' },
    { id: 'mt2', machineId: 'm3', type: 'corrective', technicianId: 'u4', status: 'scheduled', startedAt: null, endedAt: null, cost: 0, description: 'Réparation suite à vibrations', breakdownId: 'b1' },
    { id: 'mt3', machineId: 'm1', type: 'corrective', technicianId: 'u3', status: 'completed', startedAt: dayOffset(20), endedAt: dayOffset(19), cost: 850, description: 'Remplacement roulement convoyeur' },
    { id: 'mt4', machineId: 'm2', type: 'preventive', technicianId: 'u4', status: 'scheduled', startedAt: null, endedAt: null, cost: 0, description: 'Inspection mensuelle', scheduledFor: dayOffset(-2) },
    { id: 'mt5', machineId: 'm5', type: 'predictive', technicianId: 'u3', status: 'completed', startedAt: dayOffset(25), endedAt: dayOffset(24), cost: 420, description: 'Calibration capteurs' }
  ],
  parts: [
    { id: 'sp1', name: 'Roulement SKF 6205', sku: 'BRG-6205', category: 'Roulement', stock: 8,  minStock: 10, unitCost: 45,  location: 'A-01' },
    { id: 'sp2', name: 'Vanne pneumatique DN50', sku: 'VLV-DN50', category: 'Vanne', stock: 3,  minStock: 5,  unitCost: 220, location: 'B-04' },
    { id: 'sp3', name: 'Courroie trapézoïdale B-45', sku: 'BLT-B45', category: 'Courroie', stock: 25, minStock: 8,  unitCost: 18,  location: 'C-12' },
    { id: 'sp4', name: 'Capteur de température PT100', sku: 'SNR-PT100', category: 'Capteur', stock: 2,  minStock: 6,  unitCost: 95,  location: 'D-03' },
    { id: 'sp5', name: 'Joint torique NBR 80mm', sku: 'OBL-80', category: 'Joint', stock: 120, minStock: 50, unitCost: 3,   location: 'A-10' },
    { id: 'sp6', name: 'Filtre à air 50µm', sku: 'FLT-50', category: 'Filtre', stock: 4,  minStock: 7,  unitCost: 35,  location: 'E-02' },
    { id: 'sp7', name: 'Moteur asynchrone 5kW', sku: 'MTR-5K', category: 'Moteur', stock: 1,  minStock: 2,  unitCost: 850, location: 'F-01' }
  ],
  stockMovements: [
    { id: 'mv1', partId: 'sp1', type: 'in',  quantity: 20, at: dayOffset(25), note: 'Réapprovisionnement fournisseur', user: 'u3' },
    { id: 'mv2', partId: 'sp1', type: 'out', quantity: 12, at: dayOffset(20), note: 'Remplacement roulement Ligne A', user: 'u3' },
    { id: 'mv3', partId: 'sp4', type: 'out', quantity: 4,  at: dayOffset(15), note: 'Étalonnage', user: 'u4' },
    { id: 'mv4', partId: 'sp6', type: 'in',  quantity: 10, at: dayOffset(10), note: 'Commande trimestrielle', user: 'u2' },
    { id: 'mv5', partId: 'sp6', type: 'out', quantity: 6,  at: dayOffset(5),  note: 'Maintenance Ligne C', user: 'u3' },
    { id: 'mv6', partId: 'sp7', type: 'out', quantity: 1,  at: dayOffset(2),  note: 'Remplacement moteur Ligne B', user: 'u4' }
  ],
  alerts: [
    { id: 'al1', type: 'machine_down', severity: 'critical', message: 'Ligne B - Pressage en panne', machineId: 'm3', at: dayOffset(2), resolved: false },
    { id: 'al2', type: 'low_stock', severity: 'warning', message: 'Stock faible: Roulement SKF 6205', partId: 'sp1', at: dayOffset(1), resolved: false },
    { id: 'al3', type: 'low_stock', severity: 'warning', message: 'Stock faible: Capteur PT100', partId: 'sp4', at: dayOffset(1), resolved: false },
    { id: 'al4', type: 'maintenance_due', severity: 'info', message: 'Maintenance prévue pour Ligne B - Séchage', machineId: 'm4', at: dayOffset(3), resolved: false },
    { id: 'al5', type: 'anomaly', severity: 'high', message: 'Anomalie vibratoire détectée sur Ligne B - Pressage', machineId: 'm3', at: dayOffset(2), resolved: false },
    { id: 'al6', type: 'low_stock', severity: 'critical', message: 'Stock critique: Moteur asynchrone 5kW', partId: 'sp7', at: dayOffset(0), resolved: false }
  ],
  sensorReadings: [],
  sessions: {}
};

(() => {
  const arr = [];
  let id = 1;
  for (let day = 0; day < 30; day++) {
    for (const m of seedData.machines) {
      const target = m.dailyTarget;
      const r = m.status === 'down' ? 0 : (m.status === 'maintenance' ? 0.4 : (m.status === 'idle' ? 0.6 : 0.9 + Math.random() * 0.15));
      arr.push({
        id: `p${id++}`,
        machineId: m.id,
        date: dayOffset(day).slice(0, 10),
        target,
        actual: Math.round(target * r),
        goodUnits: Math.round(target * r * (0.92 + Math.random() * 0.06)),
        createdAt: dayOffset(day)
      });
    }
  }
  seedData.productions = arr;
})();

export const db = deepClone(seedData);

export function resetDb() {
  for (const k of Object.keys(seedData)) {
    db[k] = deepClone(seedData[k]);
  }
}

export function nextId(prefix, collection) {
  const max = collection.reduce((acc, x) => {
    const n = parseInt(String(x.id).replace(/^\D+/, ''), 10);
    return n > acc ? n : acc;
  }, 0);
  return `${prefix}${max + 1}`;
}