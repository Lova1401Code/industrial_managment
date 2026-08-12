import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import { fmt, fmtDate, fmtDateTime, statusLabel } from '../utils/format.js';

const STATUSES = ['running', 'idle', 'maintenance', 'down'];
const empty = { name: '', type: '', line: 'A', status: 'idle', manufacturer: '', model: '', dailyTarget: 1000, installDate: new Date().toISOString().slice(0,10) };

export default function Machines() {
  const { can } = useAuth();
  const toast = useToast();
  const [machines, setMachines] = useState([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [history, setHistory] = useState(null);

  const canEdit = can('admin', 'manager');
  const canTech = can('admin', 'manager', 'technician');

  const load = () => api.listMachines().then(setMachines).catch(() => toast.error('Erreur chargement'));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditing('new'); };
  const openEdit = (m) => { setForm({...m}); setEditing(m.id); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await api.createMachine(form);
      else await api.updateMachine(editing, form);
      toast.success('Machine enregistrée');
      setEditing(null); load();
    } catch (err) { toast.error(err.message); }
  };

  const changeStatus = async (m, status) => {
    try { await api.setMachineStatus(m.id, status, `Changement via interface`); toast.success('Statut mis à jour'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const remove = async (m) => {
    if (!confirm(`Supprimer la machine ${m.name} ?`)) return;
    try { await api.deleteMachine(m.id); toast.success('Machine supprimée'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const showHistory = async (m) => {
    try { const h = await api.getMachineHistory(m.id); setHistory({ machine: m, items: h }); }
    catch (err) { toast.error(err.message); }
  };

  const filtered = machines.filter(m => !filter || m.name.toLowerCase().includes(filter.toLowerCase()) || m.line === filter);

  return (
    <div>
      <div className="row-between" style={{marginBottom:14}}>
        <div className="flex">
          <input placeholder="Rechercher..." value={filter} onChange={e => setFilter(e.target.value)} style={{width:220}} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{width:'auto'}}>
            <option value="">Toutes lignes</option>
            <option value="A">Ligne A</option><option value="B">Ligne B</option><option value="C">Ligne C</option>
          </select>
          <span className="muted">{filtered.length} machines</span>
        </div>
        {canEdit && <button className="primary" onClick={openNew}>+ Nouvelle machine</button>}
      </div>

      <div className="grid grid-3">
        {filtered.map(m => (
          <div className="card" key={m.id}>
            <div className="card-head">
              <h3 style={{margin:0}}>{m.name}</h3>
              <span className={`badge ${m.status}`}>{statusLabel(m.status)}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,fontSize:'.85rem'}}>
              <div className="row-between"><span className="muted">Type</span><span>{m.type}</span></div>
              <div className="row-between"><span className="muted">Ligne</span><span>{m.line}</span></div>
              <div className="row-between"><span className="muted">Fabricant</span><span>{m.manufacturer} {m.model}</span></div>
              <div className="row-between"><span className="muted">Objectif/jour</span><span>{fmt(m.dailyTarget)}</span></div>
              <div className="row-between"><span className="muted">Dern. maintenance</span><span>{fmtDate(m.lastMaintenance)}</span></div>
            </div>
            <div style={{marginTop:12,display:'flex',gap:6,flexWrap:'wrap'}}>
              <button className="sm" onClick={() => showHistory(m)}>Historique</button>
              {canTech && (
                <select value={m.status} onChange={e => changeStatus(m, e.target.value)} style={{width:'auto',padding:'4px 6px',fontSize:'.72rem'}}>
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              )}
              {canEdit && <button className="sm" onClick={() => openEdit(m)}>Éditer</button>}
              {canEdit && <button className="sm danger" onClick={() => remove(m)}>Supprimer</button>}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Nouvelle machine' : 'Modifier la machine'} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="field"><label>Nom</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="field-row">
              <div className="field"><label>Type</label><input value={form.type} onChange={e => setForm({...form, type: e.target.value})} required /></div>
              <div className="field"><label>Ligne</label><select value={form.line} onChange={e => setForm({...form, line: e.target.value})}><option>A</option><option>B</option><option>C</option></select></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Fabricant</label><input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} /></div>
              <div className="field"><label>Modèle</label><input value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Statut</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>{STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></div>
              <div className="field"><label>Objectif quotidien</label><input type="number" value={form.dailyTarget} onChange={e => setForm({...form, dailyTarget: parseInt(e.target.value,10)})} /></div>
            </div>
            <div className="field"><label>Date d'installation</label><input type="date" value={form.installDate} onChange={e => setForm({...form, installDate: e.target.value})} /></div>
            <div className="actions"><button type="button" onClick={() => setEditing(null)}>Annuler</button><button type="submit" className="primary">Enregistrer</button></div>
          </form>
        </Modal>
      )}

      {history && (
        <Modal title={`Historique - ${history.machine.name}`} onClose={() => setHistory(null)}>
          {history.items.length === 0 ? <div className="empty">Aucun historique</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Date</th><th>Événement</th><th>Note</th></tr></thead>
              <tbody>
                {history.items.map(h => (
                  <tr key={h.id}><td>{fmtDateTime(h.at)}</td><td><span className={`badge ${h.event}`}>{h.event}</span></td><td>{h.note}</td></tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Modal>
      )}
    </div>
  );
}