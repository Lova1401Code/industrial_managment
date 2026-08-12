import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import { fmt, fmtMoney, fmtDateTime } from '../utils/format.js';

export default function Stock() {
  const { can } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('parts');
  const [parts, setParts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', stock: 0, minStock: 0, unitCost: 0, location: '' });
  const [mvForm, setMvForm] = useState({ partId: '', type: 'in', quantity: 0, note: '' });

  const canEdit = can('admin', 'manager', 'technician');

  const load = () => {
    api.listParts().then(setParts).catch(() => {});
    api.listMovements().then(setMovements).catch(() => {});
    api.stockAlerts().then(setAlerts).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: '', sku: '', category: '', stock: 0, minStock: 0, unitCost: 0, location: '' }); setEditing('new'); };
  const openEdit = (p) => { setForm({...p}); setEditing(p.id); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await api.createPart(form);
      else await api.updatePart(editing, form);
      toast.success('Pièce enregistrée');
      setEditing(null); load();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (p) => {
    if (!confirm(`Supprimer la pièce ${p.name} ?`)) return;
    try { await api.deletePart(p.id); toast.success('Pièce supprimée'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const move = async (e) => {
    e.preventDefault();
    try {
      await api.createMovement({ ...mvForm, quantity: parseInt(mvForm.quantity, 10) });
      toast.success('Mouvement enregistré');
      setMvForm({ partId: '', type: 'in', quantity: 0, note: '' }); load();
    } catch (err) { toast.error(err.message); }
  };

  const totalValue = parts.reduce((s, p) => s + p.stock * p.unitCost, 0);

  return (
    <div>
      <div className="grid grid-4" style={{marginBottom:16}}>
        <div className="card kpi"><div className="label">Pièces référencées</div><div className="value">{parts.length}</div></div>
        <div className="card kpi warn"><div className="label">Stock faible</div><div className="value">{alerts.length}</div></div>
        <div className="card kpi danger"><div className="label">Stock critique (0)</div><div className="value">{alerts.filter(a => a.severity === 'critical').length}</div></div>
        <div className="card kpi success"><div className="label">Valeur du stock</div><div className="value">{fmtMoney(totalValue)}</div></div>
      </div>

      <div className="row-between" style={{marginBottom:12}}>
        <div className="flex">
          <button className={tab === 'parts' ? 'primary sm' : 'sm'} onClick={() => setTab('parts')}>Pièces</button>
          <button className={tab === 'movements' ? 'primary sm' : 'sm'} onClick={() => setTab('movements')}>Mouvements</button>
        </div>
        {canEdit && tab === 'parts' && <button className="primary" onClick={openNew}>+ Nouvelle pièce</button>}
      </div>

      {tab === 'parts' ? (
        <div className="card">
          <div className="table-wrap"><table>
            <thead><tr><th>Pièce</th><th>SKU</th><th>Catégorie</th><th>Stock</th><th>Min.</th><th>Coût unit.</th><th>Valeur</th><th>Empl.</th><th>Actions</th></tr></thead>
            <tbody>
              {parts.map(p => {
                const low = p.stock <= p.minStock;
                return (
                  <tr key={p.id} style={low ? {background:'rgba(240,169,59,.06)'} : {}}>
                    <td><strong>{p.name}</strong>{low && <span className="badge warning" style={{marginLeft:6}}>faible</span>}</td>
                    <td>{p.sku}</td><td>{p.category}</td>
                    <td style={{color: low ? 'var(--warning)' : 'inherit'}}>{p.stock}</td>
                    <td>{p.minStock}</td>
                    <td>{fmtMoney(p.unitCost)}</td>
                    <td>{fmtMoney(p.stock * p.unitCost)}</td>
                    <td>{p.location}</td>
                    <td>
                      {canEdit && <button className="sm" onClick={() => openEdit(p)}>Éditer</button>}
                      {can('admin') && <button className="sm danger" onClick={() => remove(p)}>Supprimer</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      ) : (
        <div className="card">
          <div className="card-head"><h3>Mouvements de stock</h3></div>
          {canEdit && (
            <form onSubmit={move} style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <select value={mvForm.partId} onChange={e => setMvForm({...mvForm, partId: e.target.value})} required style={{width:'auto'}}>
                <option value="">Pièce...</option>
                {parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={mvForm.type} onChange={e => setMvForm({...mvForm, type: e.target.value})} style={{width:'auto'}}>
                <option value="in">Entrée</option><option value="out">Sortie</option>
              </select>
              <input type="number" placeholder="Qté" value={mvForm.quantity} onChange={e => setMvForm({...mvForm, quantity: e.target.value})} required style={{width:90}} />
              <input placeholder="Note" value={mvForm.note} onChange={e => setMvForm({...mvForm, note: e.target.value})} style={{width:240}} />
              <button type="submit" className="primary sm">Enregistrer</button>
            </form>
          )}
          <div className="table-wrap"><table>
            <thead><tr><th>Date</th><th>Pièce</th><th>Type</th><th>Qté</th><th>Note</th><th>Par</th></tr></thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td>{fmtDateTime(m.at)}</td><td>{m.partName}</td>
                  <td><span className={`badge ${m.type === 'in' ? 'completed' : 'critical'}`}>{m.type === 'in' ? 'Entrée' : 'Sortie'}</span></td>
                  <td>{fmt(m.quantity)}</td><td>{m.note}</td><td>{m.userName}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nouvelle pièce' : 'Modifier la pièce'} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="field-row">
              <div className="field"><label>Nom</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div className="field"><label>SKU</label><input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} required /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Catégorie</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
              <div className="field"><label>Emplacement</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Stock actuel</label><input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value,10)})} /></div>
              <div className="field"><label>Stock minimum</label><input type="number" value={form.minStock} onChange={e => setForm({...form, minStock: parseInt(e.target.value,10)})} /></div>
              <div className="field"><label>Coût unitaire (€)</label><input type="number" step="0.01" value={form.unitCost} onChange={e => setForm({...form, unitCost: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="actions"><button type="button" onClick={() => setEditing(null)}>Annuler</button><button type="submit" className="primary">Enregistrer</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}