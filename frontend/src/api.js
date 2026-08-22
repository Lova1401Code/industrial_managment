const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  return localStorage.getItem('imip_token') || '';
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...options, headers });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = (data && data.error) || `Erreur ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  // Users
  listUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (u) => request('/users', { method: 'POST', body: JSON.stringify(u) }),
  updateUser: (id, u) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(u) }),
  setUserRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  // Machines
  listMachines: (q = '') => request(`/machines${q}`),
  getMachine: (id) => request(`/machines/${id}`),
  createMachine: (m) => request('/machines', { method: 'POST', body: JSON.stringify(m) }),
  updateMachine: (id, m) => request(`/machines/${id}`, { method: 'PUT', body: JSON.stringify(m) }),
  setMachineStatus: (id, status, note) => request(`/machines/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  deleteMachine: (id) => request(`/machines/${id}`, { method: 'DELETE' }),
  getMachineHistory: (id) => request(`/machines/${id}/history`),
  // Production
  listProduction: (q = '') => request(`/production${q}`),
  productionToday: () => request('/production/today'),
  productionHistory: (days) => request(`/production/history?days=${days}`),
  createProduction: (p) => request('/production', { method: 'POST', body: JSON.stringify(p) }),
  // Maintenance
  listMaintenances: (q = '') => request(`/maintenance${q}`),
  maintenanceCosts: (days) => request(`/maintenance/costs?days=${days}`),
  getMaintenance: (id) => request(`/maintenance/${id}`),
  createMaintenance: (m) => request('/maintenance', { method: 'POST', body: JSON.stringify(m) }),
  patchMaintenance: (id, m) => request(`/maintenance/${id}`, { method: 'PATCH', body: JSON.stringify(m) }),
  reportBreakdown: (b) => request('/maintenance/breakdown', { method: 'POST', body: JSON.stringify(b) }),
  listBreakdowns: (q = '') => request(`/maintenance/breakdowns${q}`),
  patchBreakdown: (id, b) => request(`/maintenance/breakdowns/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  // Stock
  listParts: () => request('/stock'),
  stockAlerts: () => request('/stock/alerts'),
  listMovements: (q = '') => request(`/stock/movements${q}`),
  createPart: (p) => request('/stock', { method: 'POST', body: JSON.stringify(p) }),
  updatePart: (id, p) => request(`/stock/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deletePart: (id) => request(`/stock/${id}`, { method: 'DELETE' }),
  createMovement: (m) => request('/stock/movements', { method: 'POST', body: JSON.stringify(m) }),
  // Alerts
  listAlerts: (q = '') => request(`/alerts${q}`),
  resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: 'PATCH' }),
  // Dashboard
  dashboard: () => request('/dashboard'),
  // Simulator
  tick: (machineId) => request('/simulator/tick', { method: 'POST', body: JSON.stringify({ machineId }) }),
  readings: (machineId, limit) => request(`/simulator/readings?${machineId ? `machineId=${machineId}&` : ''}limit=${limit || 100}`),
  anomalyCheck: (machineId) => request('/simulator/anomaly-check', { method: 'POST', body: JSON.stringify({ machineId }) })
};