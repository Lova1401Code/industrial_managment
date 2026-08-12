import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import { fmt } from '../utils/format.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const chartOpts = { responsive: true, plugins: { legend: { labels: { color: '#8b9bb0' } } }, scales: { x: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' } }, y: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' }, beginAtZero: true } } };

export default function Production() {
  const { can } = useAuth();
  const toast = useToast();
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [machines, setMachines] = useState([]);
  const [list, setList] = useState([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0,10));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ machineId: '', date: new Date().toISOString().slice(0,10), target: 0, actual: 0, goodUnits: 0 });

  const canEdit = can('admin', 'manager');

  const load = () => {
    api.productionToday().then(setToday).catch(() => {});
    api.productionHistory(30).then(setHistory).catch(() => {});
    api.listMachines().then(setMachines).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    api.listProduction(`?date=${dateFilter}`).then(setList).catch(() => {});
  }, [dateFilter]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.createProduction(form);
      toast.success('Production enregistrée');
      setAdding(false);
      setForm({ machineId: '', date: new Date().toISOString().slice(0,10), target: 0, actual: 0, goodUnits: 0 });
      load();
      api.listProduction(`?date=${dateFilter}`).then(setList);
    } catch (err) { toast.error(err.message); }
  };

  const trend = {
    labels: history.map(p => p.date.slice(5)),
    datasets: [
      { label: 'Objectif', data: history.map(p => p.target), borderColor: '#4d9dff', backgroundColor: 'transparent', tension: .3 },
      { label: 'Réelle', data: history.map(p => p.actual), borderColor: '#5ad6a8', backgroundColor: 'rgba(90,214,168,.15)', tension: .3, fill: true },
      { label: 'Bonnes unités', data: history.map(p => p.good), borderColor: '#f0a93b', backgroundColor: 'transparent', tension: .3 }
    ]
  };

  return (
    <div>
      <div className="grid grid-4" style={{marginBottom:16}}>
        <div className="card kpi"><div className="label">Objectif du jour</div><div className="value">{fmt(today?.totalTarget || 0)}</div></div>
        <div className="card kpi success"><div className="label">Production réelle</div><div className="value">{fmt(today?.totalActual || 0)}</div></div>
        <div className="card kpi"><div className="label">Bonnes unités</div><div className="value">{fmt(today?.totalGood || 0)}</div></div>
        <div className="card kpi warn"><div className="label">Taux de réalisation</div><div className="value">{today?.achievementRate || 0}%</div><div className="delta">Qualité: {today?.qualityRate || 0}%</div></div>
      </div>

      <div className="grid grid-2" style={{marginBottom:16}}>
        <div className="card">
          <h3>Évolution de la production (30 jours)</h3>
          <Line data={trend} options={chartOpts} height={120} />
        </div>
        <div className="card">
          <h3>Performance par ligne (jour)</h3>
          {today ? (
            <Bar data={{
              labels: Object.keys(today.lines).map(l => `Ligne ${l}`),
              datasets: [
                { label: 'Objectif', data: Object.values(today.lines).map(l => l.target), backgroundColor: '#4d9dff' },
                { label: 'Réelle', data: Object.values(today.lines).map(l => l.actual), backgroundColor: '#5ad6a8' }
              ]
            }} options={chartOpts} height={120} />
          ) : <div className="empty">Chargement...</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Production par machine - {dateFilter}</h3>
          <div className="flex">
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{width:'auto'}} />
            {canEdit && <button className="primary sm" onClick={() => { setForm(f => ({...f, machineId: machines[0]?.id || ''})); setAdding(true); }}>+ Enregistrer production</button>}
          </div>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>Machine</th><th>Objectif</th><th>Réelle</th><th>Bonnes</th><th>Taux</th><th>Qualité</th></tr></thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={6} className="empty">Aucune production</td></tr> : list.map(p => {
              const m = machines.find(x => x.id === p.machineId);
              const rate = p.target > 0 ? Math.round((p.actual / p.target) * 1000) / 10 : 0;
              const q = p.actual > 0 ? Math.round((p.goodUnits / p.actual) * 1000) / 10 : 0;
              return (
                <tr key={p.id}>
                  <td>{m?.name || p.machineId}</td>
                  <td>{fmt(p.target)}</td><td>{fmt(p.actual)}</td><td>{fmt(p.goodUnits)}</td>
                  <td><div className="progress" style={{width:80}}><div style={{width:`${Math.min(rate,100)}%`,background:rate>=90?'var(--success)':rate>=70?'var(--warning)':'var(--danger)'}}></div></div>{' '}<strong>{rate}%</strong></td>
                  <td>{q}%</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {adding && (
        <Modal title="Enregistrer une production" onClose={() => setAdding(false)}>
          <form onSubmit={save}>
            <div className="field"><label>Machine</label>
              <select value={form.machineId} onChange={e => setForm({...form, machineId: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name} (objectif {m.dailyTarget})</option>)}
              </select>
            </div>
            <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
            <div className="field-row">
              <div className="field"><label>Objectif</label><input type="number" value={form.target} onChange={e => setForm({...form, target: parseInt(e.target.value,10)})} required /></div>
              <div className="field"><label>Production réelle</label><input type="number" value={form.actual} onChange={e => setForm({...form, actual: parseInt(e.target.value,10)})} required /></div>
            </div>
            <div className="field"><label>Bonnes unités</label><input type="number" value={form.goodUnits} onChange={e => setForm({...form, goodUnits: parseInt(e.target.value,10)})} /></div>
            <div className="actions"><button type="button" onClick={() => setAdding(false)}>Annuler</button><button type="submit" className="primary">Enregistrer</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}