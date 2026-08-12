export function fmt(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function fmtDate(s) {
  if (!s) return '-';
  const d = new Date(s);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDateTime(s) {
  if (!s) return '-';
  const d = new Date(s);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtMoney(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function statusLabel(status) {
  const map = {
    running: 'En marche', down: 'En panne', maintenance: 'Maintenance', idle: 'En attente',
    open: 'Ouvert', in_progress: 'En cours', scheduled: 'Planifiée', completed: 'Terminée', resolved: 'Résolue',
    critical: 'Critique', high: 'Élevée', medium: 'Moyenne', low: 'Faible', info: 'Info', warning: 'Attention'
  };
  return map[status] || status;
}

export function alertTypeLabel(t) {
  const map = {
    machine_down: 'Machine en panne', low_stock: 'Stock faible',
    maintenance_due: 'Maintenance à effectuer', anomaly: 'Anomalie détectée'
  };
  return map[t] || t;
}