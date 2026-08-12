import { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { api } from '../api.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { fmtMoney } from '../utils/format.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

const opts = { responsive: true, plugins: { legend: { labels: { color: '#8b9bb0' } } }, scales: { x: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' } }, y: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' }, beginAtZero: true } } };

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function PowerBI() {
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [production, setProduction] = useState([]);
  const [machines, setMachines] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [parts, setParts] = useState([]);
  const [costs, setCosts] = useState(null);
  const [history, setHistory] = useState([]);

  const load = () => {
    api.dashboard().then(setDashboard).catch(() => {});
    api.productionHistory(30).then(setHistory).catch(() => {});
    api.listMachines().then(setMachines).catch(() => {});
    api.listMaintenances().then(setMaintenances).catch(() => {});
    api.listParts().then(setParts).catch(() => {});
    api.maintenanceCosts(30).then(setCosts).catch(() => {});
    api.listProduction().then(setProduction).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const exportAll = () => {
    downloadCSV(production, 'production.csv');
    downloadCSV(machines, 'machines.csv');
    downloadCSV(maintenances, 'maintenances.csv');
    downloadCSV(parts, 'parts.csv');
    toast.success('Export CSV généré');
  };

  if (!dashboard) return <div className="empty">Chargement...</div>;

  const productionTrend = {
    labels: history.map(p => p.date.slice(5)),
    datasets: [
      { label: 'Objectif', data: history.map(p => p.target), borderColor: '#4d9dff', tension: .3 },
      { label: 'Réelle', data: history.map(p => p.actual), borderColor: '#5ad6a8', tension: .3 },
      { label: 'Bonnes', data: history.map(p => p.good), borderColor: '#f0a93b', tension: .3 }
    ]
  };

  const machineStatusDist = {
    labels: ['En marche', 'En panne', 'Maintenance', 'En attente'],
    datasets: [{ data: [dashboard.kpi.machines.running, dashboard.kpi.machines.down, dashboard.kpi.machines.maintenance, dashboard.kpi.machines.idle], backgroundColor: ['#5ad6a8','#e5484d','#f0a93b','#8b9bb0'] }]
  };

  const maintenanceCostChart = costs ? {
    labels: costs.machineCosts.map(m => m.name),
    datasets: [{ label: 'Coût (€)', data: costs.machineCosts.map(m => m.cost), backgroundColor: '#e5484d' }]
  } : null;

  const stockByCategory = Object.values(parts.reduce((acc, p) => {
    acc[p.category] = acc[p.category] || { name: p.category, value: 0 };
    acc[p.category].value += p.stock * p.unitCost;
    return acc;
  }, {}));
  const stockChart = {
    labels: stockByCategory.map(c => c.name),
    datasets: [{ label: 'Valeur (€)', data: stockByCategory.map(c => c.value), backgroundColor: '#4d9dff' }]
  };

  return (
    <div>
      <div className="row-between" style={{marginBottom:14}}>
        <div className="muted">Tableau de bord analytique - KPI industriels (Power BI mocké)</div>
        <button className="primary" onClick={exportAll}>Exporter les données (CSV)</button>
      </div>

      <div className="grid grid-4" style={{marginBottom:16}}>
        <div className="card kpi"><div className="label">TRG - Taux de réalisation</div><div className="value">{dashboard.kpi.productionToday.achievementRate}%</div></div>
        <div className="card kpi success"><div className="label">Taux de qualité</div><div className="value">{dashboard.kpi.productionToday.qualityRate}%</div></div>
        <div className="card kpi warn"><div className="label">Disponibilité machines</div><div className="value">{Math.round((dashboard.kpi.machines.running / dashboard.kpi.machines.total) * 100)}%</div></div>
        <div className="card kpi"><div className="label">MTBF / coût maintenance</div><div className="value">{fmtMoney(dashboard.kpi.maintenance.cost30d)}</div></div>
      </div>

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card"><h3>Analyse de la production (30j)</h3><Line data={productionTrend} options={opts} height={140} /></div>
        <div className="card"><h3>Répartition des statuts machines</h3><Doughnut data={machineStatusDist} options={{responsive:true,plugins:{legend:{labels:{color:'#8b9bb0'}}}}} height={140} /></div>
      </div>

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card"><h3>Coût de maintenance par machine</h3>{maintenanceCostChart ? <Bar data={maintenanceCostChart} options={opts} height={140} /> : <div className="empty">-</div>}</div>
        <div className="card"><h3>Valeur du stock par catégorie</h3><Bar data={stockChart} options={opts} height={140} /></div>
      </div>

      <div className="card">
        <h3>Connexion Power BI (export pour analyse externe)</h3>
        <p className="muted" style={{marginBottom:12}}>Pour connecter Power BI Desktop à cette plateforme, exportez les données CSV ci-dessus, puis dans Power BI :</p>
        <ol style={{color:'var(--muted)',lineHeight:1.8,fontSize:'.9rem'}}>
          <li>Ouvrez Power BI Desktop → "Obtenir les données" → "Fichier" → "Texte/CSV"</li>
          <li>Sélectionnez les fichiers CSV exportés (production, machines, maintenances, parts)</li>
          <li>Power BI détectera automatiquement les types de colonnes</li>
          <li>Créez vos visuels : graphiques de production, répartition machine, coûts, stock</li>
          <li>Publiez sur votre espace Power BI Service pour le partage</li>
        </ol>
      </div>
    </div>
  );
}