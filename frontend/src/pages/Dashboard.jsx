import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { api } from '../api.js';
import { fmt, fmtMoney, statusLabel, alertTypeLabel } from '../utils/format.js';
import { Link } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const chartOpts = { responsive: true, plugins: { legend: { labels: { color: '#8b9bb0' } } }, scales: { x: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' } }, y: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' }, beginAtZero: true } } };

function KpiCard({ label, value, sub, tone }) {
  return (
    <div className={`card kpi ${tone || ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="delta">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = () => api.dashboard().then(d => { if (mounted) setData(d); }).catch(() => {});
    load();
    const i = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  if (!data) return <div className="empty">Chargement du dashboard...</div>;

  const k = data.kpi;
  const trend = {
    labels: data.productionTrend7d.map(p => p.date.slice(5)),
    datasets: [
      { label: 'Objectif', data: data.productionTrend7d.map(p => p.target), borderColor: '#4d9dff', backgroundColor: 'transparent', tension: .3 },
      { label: 'Réelle', data: data.productionTrend7d.map(p => p.actual), borderColor: '#5ad6a8', backgroundColor: 'rgba(90,214,168,.15)', tension: .3, fill: true }
    ]
  };
  const lineData = {
    labels: data.productionByLine.map(l => `Ligne ${l.line}`),
    datasets: [{ label: 'Taux de réalisation (%)', data: data.productionByLine.map(l => l.achievementRate), backgroundColor: ['#5ad6a8','#4d9dff','#f0a93b','#e5484d'] }]
  };

  return (
    <div>
      <div className="grid grid-4" style={{marginBottom:16}}>
        <KpiCard label="Production du jour (objectif)" value={fmt(k.productionToday.target)} sub={`${fmt(k.productionToday.actual)} produites`} />
        <KpiCard label="Taux de réalisation" value={`${k.productionToday.achievementRate}%`} tone={k.productionToday.achievementRate >= 90 ? 'success' : 'warn'} sub={`Qualité: ${k.productionToday.qualityRate}%`} />
        <KpiCard label="Machines en panne" value={k.machines.down} tone={k.machines.down > 0 ? 'danger' : ''} sub={`${k.machines.running} en marche / ${k.machines.total} total`} />
        <KpiCard label="Coût maintenance (30j)" value={fmtMoney(k.maintenance.cost30d)} sub={`${k.maintenance.ongoing} en cours, ${k.maintenance.scheduled} planifiées`} />
      </div>

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card">
          <h3>Production - 7 derniers jours</h3>
          <Line data={trend} options={chartOpts} height={120} />
        </div>
        <div className="card">
          <h3>Performance par ligne de production</h3>
          <Bar data={lineData} options={chartOpts} height={120} />
        </div>
      </div>

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-head"><h3>Machines en panne / maintenance</h3><Link to="/machines">Voir tout →</Link></div>
          {data.downtimesByMachine.length === 0 ? <div className="empty">Aucune machine arrêtée</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Machine</th><th>Ligne</th><th>Statut</th><th>Temps d'arrêt</th></tr></thead>
              <tbody>
                {data.downtimesByMachine.slice(0, 6).map(m => (
                  <tr key={m.machineId}>
                    <td>{m.name}</td><td>{m.line}</td>
                    <td><span className={`badge ${m.status}`}>{statusLabel(m.status)}</span></td>
                    <td>{m.downtimeHours} h</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="card">
          <div className="card-head"><h3>Alertes récentes</h3><Link to="/alerts">Voir tout →</Link></div>
          {data.openAlerts.length === 0 ? <div className="empty">Aucune alerte active</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Type</th><th>Sévérité</th><th>Message</th></tr></thead>
              <tbody>
                {data.openAlerts.slice(0, 6).map(a => (
                  <tr key={a.id}>
                    <td>{alertTypeLabel(a.type)}</td>
                    <td><span className={`badge ${a.severity}`}>{statusLabel(a.severity)}</span></td>
                    <td>{a.message}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><h3>Maintenance en cours</h3><Link to="/maintenance">Voir tout →</Link></div>
          {data.ongoingMaintenances.length === 0 ? <div className="empty">Aucune maintenance en cours</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Machine</th><th>Type</th><th>Technicien</th></tr></thead>
              <tbody>
                {data.ongoingMaintenances.map(m => (
                  <tr key={m.id}>
                    <td>{m.machine?.name}</td><td>{m.type}</td>
                    <td>{m.technician?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="card">
          <div className="card-head"><h3>Stock faible</h3><Link to="/stock">Voir tout →</Link></div>
          {data.lowStock.length === 0 ? <div className="empty">Aucun stock faible</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Pièce</th><th>Stock</th><th>Min.</th><th>Manque</th></tr></thead>
              <tbody>
                {data.lowStock.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td><td>{p.stock}</td><td>{p.minStock}</td>
                    <td>{p.minStock - p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </div>
  );
}