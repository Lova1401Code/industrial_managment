import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { fmtDateTime } from '../utils/format.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const opts = { responsive: true, plugins: { legend: { labels: { color: '#8b9bb0' } } }, scales: { x: { ticks: { color: '#8b9bb0', maxTicksLimit: 8 }, grid: { color: '#2a3a4f' } }, y: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' }, beginAtZero: true } } };

export default function Simulator() {
  const { can } = useAuth();
  const toast = useToast();
  const [machines, setMachines] = useState([]);
  const [readings, setReadings] = useState([]);
  const [selected, setSelected] = useState('');
  const [auto, setAuto] = useState(false);
  const [anomaly, setAnomaly] = useState(null);

  const canRun = can('admin', 'manager');

  const loadMachines = () => api.listMachines().then(setMachines).catch(() => {});
  const loadReadings = (mid, limit = 30) => {
    api.readings(mid, limit).then(setReadings).catch(() => {});
  };
  useEffect(() => { loadMachines(); loadReadings(''); }, []);

  const tick = async () => {
    try { await api.tick(selected || undefined); loadReadings(selected, 50); }
    catch (err) { toast.error(err.message); }
  };

  useEffect(() => {
    if (!auto) return;
    const i = setInterval(tick, 2000);
    return () => clearInterval(i);
  }, [auto, selected]);

  const checkAnomaly = async () => {
    if (!selected) { toast.warning('Sélectionnez une machine'); return; }
    try { const r = await api.anomalyCheck(selected); setAnomaly(r); }
    catch (err) { toast.error(err.message); }
  };

  const chartData = {
    labels: readings.map(r => new Date(r.at).toLocaleTimeString('fr-FR')),
    datasets: [
      { label: 'Température (°C)', data: readings.map(r => r.temperature), borderColor: '#e5484d', tension: .3, fill: false },
      { label: 'Vibration (mm/s)', data: readings.map(r => r.vibration), borderColor: '#f0a93b', tension: .3, fill: false },
      { label: 'Pression (bar)', data: readings.map(r => r.pressure), borderColor: '#4d9dff', tension: .3, fill: false }
    ]
  };

  const powerData = {
    labels: readings.map(r => new Date(r.at).toLocaleTimeString('fr-FR')),
    datasets: [{ label: 'Puissance (kW)', data: readings.map(r => r.powerKw), borderColor: '#5ad6a8', backgroundColor: 'rgba(90,214,168,.15)', tension: .3, fill: true }]
  };

  const last = readings[readings.length - 1];

  return (
    <div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-head"><h3>Simulation des capteurs IoT</h3></div>
        <div className="flex wrap">
          <select value={selected} onChange={e => { setSelected(e.target.value); loadReadings(e.target.value, 50); }} style={{width:'auto'}}>
            <option value="">Toutes machines</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {canRun && <button className="primary" onClick={tick}>Générer un tick</button>}
          {canRun && <button onClick={() => setAuto(a => !a)}>{auto ? 'Arrêter auto (2s)' : 'Démarrer auto'}</button>}
          {canRun && <button onClick={checkAnomaly}>Vérifier risque de panne</button>}
        </div>
        {anomaly && (
          <div className={`card kpi ${anomaly.risk === 'high' ? 'danger' : anomaly.risk === 'medium' ? 'warn' : 'success'}`} style={{marginTop:14,marginBottom:0}}>
            <div className="label">Risque de panne détecté</div>
            <div className="value">{anomaly.risk.toUpperCase()} ({anomaly.score}/100)</div>
            <div className="delta">Temp. moy: {anomaly.avgTemp}°C • Vibr. moy: {anomaly.avgVib} mm/s</div>
          </div>
        )}
      </div>

      {last && (
        <div className="grid grid-4" style={{marginBottom:16}}>
          <div className="card kpi"><div className="label">Température</div><div className="value" style={{color: last.temperature > 65 ? 'var(--danger)' : 'inherit'}}>{last.temperature}°C</div></div>
          <div className="card kpi"><div className="label">Pression</div><div className="value">{last.pressure} bar</div></div>
          <div className="card kpi"><div className="label">Vibration</div><div className="value" style={{color: last.vibration > 5 ? 'var(--warning)' : 'inherit'}}>{last.vibration} mm/s</div></div>
          <div className="card kpi"><div className="label">Puissance</div><div className="value">{last.powerKw} kW</div></div>
        </div>
      )}

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card">
          <h3>Capteurs (température / pression / vibration)</h3>
          {readings.length < 2 ? <div className="empty">Générez des ticks pour visualiser</div> : <Line data={chartData} options={opts} height={120} />}
        </div>
        <div className="card">
          <h3>Consommation énergétique</h3>
          {readings.length < 2 ? <div className="empty">Générez des ticks pour visualiser</div> : <Line data={powerData} options={opts} height={120} />}
        </div>
      </div>

      <div className="card">
        <h3>Dernières lectures</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>Heure</th><th>Machine</th><th>État</th><th>Temp.</th><th>Press.</th><th>Vibr.</th><th>Puiss.</th><th>Anomalie</th></tr></thead>
          <tbody>
            {readings.slice(-12).reverse().map(r => {
              const m = machines.find(x => x.id === r.machineId);
              return (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.at)}</td><td>{m?.name || r.machineId}</td>
                  <td><span className={`badge ${r.state}`}>{r.state}</span></td>
                  <td>{r.temperature}°C</td><td>{r.pressure}</td><td>{r.vibration}</td><td>{r.powerKw}</td>
                  <td>{r.anomaly ? <span className="badge critical">⚠ Oui</span> : <span className="badge info">Non</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}