import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Machines from './pages/Machines.jsx';
import Production from './pages/Production.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Stock from './pages/Stock.jsx';
import Alerts from './pages/Alerts.jsx';
import Simulator from './pages/Simulator.jsx';
import PowerBI from './pages/PowerBI.jsx';
import NotFound from './pages/NotFound.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="machines" element={<Machines />} />
        <Route path="production" element={<Production />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="stock" element={<Stock />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="powerbi" element={<PowerBI />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}