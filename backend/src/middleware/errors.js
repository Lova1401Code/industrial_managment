export function notFound(_req, res) {
  res.status(404).json({ error: 'Ressource introuvable' });
}

export function errorLogger(err, _req, res, _next) {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
}