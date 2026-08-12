import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { fmtDateTime, statusLabel, alertTypeLabel } from '../utils/format.js';

export default function Alerts() {
  const { can } = useAuth();
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('');

  const canResolve = can('admin', 'manager', 'technician');

  const load = () => api.listAlerts(filter === 'unresolved' ? '?unresolved=true' : '').then(setAlerts).catch(() => {});
  useEffect(() => { load(); }, [filter]);

  const resolve = async (a) => {
    try { await api.resolveAlert(a.id); toast.success('Alerte résolue'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const filtered = alerts.filter(a => !sevFilter || a.severity === sevFilter);

  return (
    <div>
      <div className="flex wrap" style={{marginBottom:14}}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{width:'auto'}}>
          <option value="all">Toutes</option><option value="unresolved">Non résolues</option>
        </select>
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} style={{width:'auto'}}>
          <option value="">Toutes sévérités</option>
          <option value="critical">Critique</option><option value="high">Élevée</option><option value="warning">Attention</option><option value="info">Info</option>
        </select>
        <span className="muted">{filtered.length} alertes</span>
      </div>

      <div className="card">
        {filtered.length === 0 ? <div className="empty">Aucune alerte</div> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Type</th><th>Sévérité</th><th>Message</th><th>Date</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>{alertTypeLabel(a.type)}</td>
                  <td><span className={`badge ${a.severity}`}>{statusLabel(a.severity)}</span></td>
                  <td>{a.message}</td>
                  <td>{fmtDateTime(a.at)}</td>
                  <td>{a.resolved ? <span className="badge completed">Résolue</span> : <span className="badge open">Active</span>}</td>
                  <td>{!a.resolved && canResolve && <button className="sm" onClick={() => resolve(a)}>Résoudre</button>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}