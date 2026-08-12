import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty" style={{padding:'60px 20px'}}>
      <h1 style={{fontSize:'3rem',color:'var(--accent)',marginBottom:8}}>404</h1>
      <div className="muted" style={{marginBottom:18}}>Page introuvable</div>
      <Link to="/dashboard"><button className="primary">Retour au dashboard</button></Link>
    </div>
  );
}