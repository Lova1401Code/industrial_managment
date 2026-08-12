import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Connexion réussie');
      nav('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const fill = (u, p) => { setUsername(u); setPassword(p); };

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={submit}>
        <h1>⚡ IMI Platform</h1>
        <div className="subtitle">Industrial Management & Intelligence</div>
        <div className="field">
          <label>Identifiant</label>
          <input value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="primary" disabled={loading} style={{width:'100%'}}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <div className="demo">
          <strong>Comptes de démonstration :</strong><br/>
          <button type="button" className="sm" onClick={() => fill('admin','admin123')} style={{marginTop:6}}>admin / admin123</button>{' '}
          <button type="button" className="sm" onClick={() => fill('manager','manager123')}>manager / manager123</button>{' '}
          <button type="button" className="sm" onClick={() => fill('tech1','tech123')}>tech1 / tech123</button>{' '}
          <button type="button" className="sm" onClick={() => fill('viewer','viewer123')}>viewer / viewer123</button>
        </div>
      </form>
    </div>
  );
}