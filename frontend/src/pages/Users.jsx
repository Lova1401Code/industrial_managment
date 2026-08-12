import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import { fmtDate } from '../utils/format.js';

const ROLES = ['admin', 'manager', 'technician', 'viewer'];
const empty = { username: '', name: '', email: '', role: 'viewer', password: '' };

export default function Users() {
  const { can } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => {
    setLoading(true);
    api.listUsers().then(setUsers).catch(() => toast.error('Erreur chargement')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (!can('admin', 'manager')) return <div className="empty">Accès réservé aux administrateurs et managers.</div>;

  const openNew = () => { setForm(empty); setEditing('new'); };
  const openEdit = (u) => { setForm({ ...u, password: '' }); setEditing(u.id); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') {
        const { password, ...rest } = form;
        await api.createUser({ ...rest, password });
        toast.success('Utilisateur créé');
      } else {
        const { password, ...rest } = form;
        const payload = password ? { ...rest, password } : rest;
        await api.updateUser(editing, payload);
        toast.success('Utilisateur modifié');
      }
      setEditing(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const toggleActive = async (u) => {
    try { await api.updateUser(u.id, { active: !u.active }); toast.success(u.active ? 'Désactivé' : 'Activé'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const setRole = async (u, role) => {
    try { await api.setUserRole(u.id, role); toast.success('Rôle mis à jour'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const canAdmin = can('admin');

  return (
    <div>
      <div className="row-between" style={{marginBottom:14}}>
        <div className="muted">{users.length} utilisateurs</div>
        <button className="primary" onClick={openNew}>+ Nouvel utilisateur</button>
      </div>
      <div className="card">
        {loading ? <div className="empty">Chargement...</div> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Identifiant</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.name}</td><td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role}`}>{u.role}</span>
                    {canAdmin && (
                      <select value={u.role} onChange={e => setRole(u, e.target.value)} style={{display:'inline-block',width:'auto',marginLeft:6,padding:'2px 6px',fontSize:'.72rem'}}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                  </td>
                  <td>{u.active ? <span className="badge completed">Actif</span> : <span className="badge critical">Inactif</span>}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>
                    <button className="sm" onClick={() => openEdit(u)}>Éditer</button>
                    <button className="sm" onClick={() => toggleActive(u)}>{u.active ? 'Désactiver' : 'Activer'}</button>
                    {canAdmin && <button className="sm danger" onClick={() => { if (confirm('Supprimer (désactiver) cet utilisateur ?')) { api.deleteUser(u.id).then(() => { toast.success('Désactivé'); load(); }).catch(e => toast.error(e.message)); } }}>Supprimer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="field"><label>Identifiant</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required disabled={editing !== 'new'} /></div>
            <div className="field"><label>Nom complet</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="field"><label>Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="field"><label>Rôle</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field"><label>{editing === 'new' ? 'Mot de passe' : 'Nouveau mot de passe (vide = inchangé)'}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={editing === 'new'} /></div>
            <div className="actions">
              <button type="button" onClick={() => setEditing(null)}>Annuler</button>
              <button type="submit" className="primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}