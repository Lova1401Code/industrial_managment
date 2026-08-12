import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import { fmtMoney, fmtDateTime, statusLabel } from '../utils/format.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const chartOpts = { responsive: true, plugins: { legend: { labels: { color: '#8b9bb0' } } }, scales: { x: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' } }, y: { ticks: { color: '#8b9bb0' }, grid: { color: '#2a3a4f' }, beginAtZero: true } } };
const MTYPES = ['preventive', 'corrective', 'predictive'];
const MSTATUSES = ['scheduled', 'in_progress', 'completed'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];

export default function Maintenance() {
  const { can, user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('interventions');
  const [maintenances, setMaintenances] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);
  const [costs, setCosts] = useState(null);
  const [machines, setMachines] = useState([]);
  const [users, setUsers] = useState([]);
  const [adding, setAdding] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [form, setForm] = useState({ machineId: '', type: 'preventive', description: '', technicianId: '' });
  const [breakdownForm, setBreakdownForm] = useState({ machineId: '', description: '', severity: 'medium' });

  const canEdit = can('admin', 'manager', 'technician');

  const load = () => {
    api.listMaintenances().then(setMaintenances).catch(() => {});
    api.listBreakdowns().then(setBreakdowns).catch(() => {});
    api.maintenanceCosts(30).then(setCosts).catch(() => {});
    api.listMachines().then(setMachines).catch(() => {});
    api.listUsers().then(setUsers).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const technicians = users.filter(u => u.role === 'technician' && u.active);

  const saveMaintenance = async (e) => {
    e.preventDefault();
    try {
      await api.createMaintenance({ ...form, status: 'scheduled', scheduledFor: new Date().toISOString() });
      toast.success('Intervention créée');
      setAdding(false); setForm({ machineId: '', type: 'preventive', description: '', technicianId: '' }); load();
    } catch (err) { toast.error(err.message); }
  };

  const saveBreakdown = async (e) => {
    e.preventDefault();
    try {
      await api.reportBreakdown({ ...breakdownForm, reportedBy: user?.sub });
      toast.success('Panne déclarée');
      setReporting(false); setBreakdownForm({ machineId: '', description: '', severity: 'medium' }); load();
    } catch (err) { toast.error(err.message); }
  };

  const patchMaintenance = async (m, patch) => {
    try { await api.patchMaintenance(m.id, patch); toast.success('Mis à jour'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const patchBreakdown = async (b, patch) => {
    try { await api.patchBreakdown(b.id, patch); toast.success('Mis à jour'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const costChart = costs ? {
    labels: costs.machineCosts.map(m => m.name),
    datasets: [{ label: 'Coût (€)', data: costs.machineCosts.map(m => m.cost), backgroundColor: '#e5484d' }]
  } : null;

  return (
    <div>
      <div className="grid grid-4" style={{marginBottom:16}}>
        <div className="card kpi"><div className="label">Coût maintenance (30j)</div><div className="value">{fmtMoney(costs?.total || 0)}</div><div className="delta">{costs?.count || 0} interventions</div></div>
        <div className="card kpi warn"><div className="label">En cours</div><div className="value">{maintenances.filter(m => m.status === 'in_progress').length}</div></div>
        <div className="card kpi"><div className="label">Planifiées</div><div className="value">{maintenances.filter(m => m.status === 'scheduled').length}</div></div>
        <div className="card kpi danger"><div className="label">Pannes ouvertes</div><div className="value">{breakdowns.filter(b => b.status === 'open').length}</div></div>
      </div>

      <div className="card" style={{marginBottom:16}}>
        <h3>Coût de maintenance par machine (30j)</h3>
        {costChart ? <Bar data={costChart} options={chartOpts} height={100} /> : <div className="empty">Chargement</div>}
      </div>

      <div className="row-between" style={{marginBottom:12}}>
        <div className="flex">
          <button className={tab === 'interventions' ? 'primary sm' : 'sm'} onClick={() => setTab('interventions')}>Interventions</button>
          <button className={tab === 'breakdowns' ? 'primary sm' : 'sm'} onClick={() => setTab('breakdowns')}>Pannes</button>
        </div>
        {canEdit && (
          <div className="flex">
            {tab === 'interventions' && <button className="primary" onClick={() => { setForm(f => ({...f, machineId: machines[0]?.id || '', technicianId: technicians[0]?.id || ''})); setAdding(true); }}>+ Nouvelle intervention</button>}
            {tab === 'breakdowns' && <button className="danger" onClick={() => { setBreakdownForm(f => ({...f, machineId: machines[0]?.id || ''})); setReporting(true); }}>Déclarer une panne</button>}
          </div>
        )}
      </div>

      {tab === 'interventions' ? (
        <div className="card">
          <div className="table-wrap"><table>
            <thead><tr><th>Machine</th><th>Type</th><th>Description</th><th>Technicien</th><th>Statut</th><th>Coût</th><th>Actions</th></tr></thead>
            <tbody>
              {maintenances.map(m => (
                <tr key={m.id}>
                  <td>{m.machine?.name}</td><td>{m.type}</td><td>{m.description}</td>
                  <td>{m.technician?.name || '-'}</td>
                  <td><span className={`badge ${m.status}`}>{statusLabel(m.status)}</span></td>
                  <td>{fmtMoney(m.cost)}</td>
                  <td>
                    {canEdit && (
                      <select value={m.status} onChange={e => patchMaintenance(m, { status: e.target.value })} style={{width:'auto',padding:'2px 4px',fontSize:'.72rem'}}>
                        {MSTATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    )}
                    {canEdit && m.status === 'completed' && (
                      <input type="number" placeholder="Coût" value={m.cost || ''} onChange={e => patchMaintenance(m, { cost: parseFloat(e.target.value) || 0, endedAt: new Date().toISOString() })} style={{width:70,marginLeft:4,padding:'2px 4px',fontSize:'.72rem'}} />
                    )}
                    {canEdit && can('admin','manager') && (
                      <select value={m.technicianId || ''} onChange={e => patchMaintenance(m, { technicianId: e.target.value })} style={{width:'auto',marginLeft:4,padding:'2px 4px',fontSize:'.72rem'}}>
                        <option value="">Aucun</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap"><table>
            <thead><tr><th>Machine</th><th>Description</th><th>Sévérité</th><th>Statut</th><th>Signalée</th><th>Cause</th><th>Actions</th></tr></thead>
            <tbody>
              {breakdowns.map(b => (
                <tr key={b.id}>
                  <td>{b.machine}</td><td>{b.description}</td>
                  <td><span className={`badge ${b.severity}`}>{statusLabel(b.severity)}</span></td>
                  <td><span className={`badge ${b.status}`}>{statusLabel(b.status)}</span></td>
                  <td>{fmtDateTime(b.reportedAt)}</td>
                  <td>{b.cause || '-'}</td>
                  <td>
                    {canEdit && (
                      <select value={b.status} onChange={e => patchBreakdown(b, { status: e.target.value })} style={{width:'auto',padding:'2px 4px',fontSize:'.72rem'}}>
                        <option value="open">open</option><option value="resolved">resolved</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {adding && (
        <Modal title="Nouvelle intervention de maintenance" onClose={() => setAdding(false)}>
          <form onSubmit={saveMaintenance}>
            <div className="field"><label>Machine</label>
              <select value={form.machineId} onChange={e => setForm({...form, machineId: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field"><label>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>{MTYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="field"><label>Technicien</label><select value={form.technicianId} onChange={e => setForm({...form, technicianId: e.target.value})}><option value="">Aucun</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </div>
            <div className="field"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required rows={3} /></div>
            <div className="actions"><button type="button" onClick={() => setAdding(false)}>Annuler</button><button type="submit" className="primary">Créer</button></div>
          </form>
        </Modal>
      )}

      {reporting && (
        <Modal title="Déclarer une panne" onClose={() => setReporting(false)}>
          <form onSubmit={saveBreakdown}>
            <div className="field"><label>Machine</label>
              <select value={breakdownForm.machineId} onChange={e => setBreakdownForm({...breakdownForm, machineId: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Sévérité</label><select value={breakdownForm.severity} onChange={e => setBreakdownForm({...breakdownForm, severity: e.target.value})}>{SEVERITIES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></div>
            <div className="field"><label>Description</label><textarea value={breakdownForm.description} onChange={e => setBreakdownForm({...breakdownForm, description: e.target.value})} required rows={3} /></div>
            <div className="actions"><button type="button" onClick={() => setReporting(false)}>Annuler</button><button type="submit" className="danger">Déclarer la panne</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}