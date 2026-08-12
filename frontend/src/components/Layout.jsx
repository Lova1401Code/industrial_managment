import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const NAV = [
  { section: 'Pilotage', items: [
    { to: '/dashboard', label: 'Dashboard', icon: 'D' },
    { to: '/alerts', label: 'Alertes', icon: '!' },
  ]},
  { section: 'Opérations', items: [
    { to: '/machines', label: 'Machines', icon: 'M' },
    { to: '/production', label: 'Production', icon: 'P' },
    { to: '/maintenance', label: 'Maintenance', icon: 'W' },
    { to: '/stock', label: 'Stock & Pièces', icon: 'S' },
  ]},
  { section: 'Analyse & Data', items: [
    { to: '/simulator', label: 'Simulation IoT', icon: 'T' },
    { to: '/powerbi', label: 'Power BI', icon: 'B' },
  ]},
  { section: 'Administration', items: [
    { to: '/users', label: 'Utilisateurs', icon: 'U', roles: ['admin', 'manager'] },
  ]},
];

const TITLES = {
  '/dashboard': 'Dashboard - KPI & Synthèse',
  '/alerts': 'Alertes',
  '/machines': 'Machines & Équipements',
  '/production': 'Production',
  '/maintenance': 'Maintenance & Pannes',
  '/stock': 'Stock & Pièces de Rechange',
  '/simulator': 'Simulation IoT - Capteurs',
  '/powerbi': 'Power BI - Analyse & BI',
  '/users': 'Utilisateurs & Permissions',
};

export default function Layout() {
  const { user, logout, can } = useAuth();
  const loc = useLocation();
  const title = TITLES[loc.pathname] || 'Industrial Management';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">⚡ IMI Platform</div>
        <nav className="nav">
          {NAV.map(group => {
            const items = group.items.filter(i => !i.roles || can(...i.roles));
            if (!items.length) return null;
            return (
              <div key={group.section}>
                <div className="nav-section">{group.section}</div>
                {items.map(i => (
                  <NavLink key={i.to} to={i.to} className={({isActive}) => isActive ? 'active' : ''}>
                    <span style={{display:'inline-flex',width:20,height:20,borderRadius:5,background:'var(--panel-2)',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,color:'var(--accent)'}}>{i.icon}</span>
                    {i.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="page-title">{title}</div>
          <div className="user">
            <span>{user?.name}</span>
            <span className={`role-badge badge ${user?.role}`}>{user?.role}</span>
            <button className="sm" onClick={logout}>Déconnexion</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}