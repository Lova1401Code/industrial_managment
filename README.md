# Industrial Management & Intelligence Platform (IMIP) — MVP V1

Plateforme web de **gestion, supervision, analyse et aide à la décision** pour une entreprise industrielle.
Projet de portfolio professionnel :: React (Vite) + Express (API mockée) + Docker + GitHub Actions.

---

## Fonctionnalités du MVP

| Module | Détails |
|---|---|
| **Authentification** | Login/Logout, sessions (JWT mocké en stockage local), gestion des rôles |
| **Utilisateurs** | Création, modification, désactivation, attribution de rôle (admin / manager / technician / viewer) |
| **Machines** | CRUD, gestion du statut (en marche / panne / maintenance / en attente), historique d'événements |
| **Production** | Enregistrement, objectifs, production réelle, taux de réalisation, qualité, historique 30 jours |
| **Maintenance** | Déclaration de panne, création d'intervention, affectation technicien, suivi du statut, coûts |
| **Stock** | Gestion des pièces, entrées/sorties, stock minimum, alertes de stock faible |
| **Alertes** | Machine en panne, stock faible, maintenance à effectuer, anomalie détectée |
| **Dashboard** | KPI principaux, graphiques, machines en panne, production du jour, alertes, maintenance en cours |
| **Simulation IoT** | Génération de données capteurs : température, pression, vibration, énergie, détection d'anomalies, estimation du risque de panne |
| **Power BI** | Export CSV des données + dashboard analytique (analyses mockées dans l'interface) |

---

## Comptes de démonstration

| Identifiant | Mot de passe | Rôle |
|---|---|---|
| `admin` | `admin123` | admin |
| `manager` | `manager123` | manager |
| `tech1` | `tech123` | technicien |
| `viewer` | `viewer123` | observateur (lecture seule) |

---

## Architecture

```
industrial_managment/
├── backend/            # API Express (backend mocké, données en mémoire)
│   ├── src/
│   │   ├── data/seed.js      # Données industrielles de départ
│   │   ├── middleware/       # Auth JWT + erreurs
│   │   ├── routes/           # auth, users, machines, production, maintenance, stock, alerts, dashboard, simulator
│   │   └── server.js
│   └── test/                 # Tests automatisés (node:test)
├── frontend/           # Application React SPA (Vite)
│   └── src/
│       ├── contexts/   # Contexte authentification + toasts
│       ├── components/ # Layout, Modal
│       ├── pages/      # Dashboard, Users, Machines, Production, Maintenance, Stock, Alerts, Simulator, PowerBI
│       ├── utils/      # Formatage
│       └── api.js      # Client API
├── docker-compose.yml  # Orchestration backend + frontend
├── .github/workflows/ci.yml  # CI : tests, lint, build, smoke test
└── README.md
```

---

## Démarrage en développement

Prerequis : Node.js ≥ 20.

```bash
# 0. Configurer les variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Éditer backend/.env pour définir un JWT_SECRET fort en production

# 1. Backend (port 4000)
cd backend
npm install
npm run dev

# 2. Frontend (port 5173, proxy vers /api)
cd ../frontend
npm install
npm run dev
```

Ouvrez http://localhost:5173 et connectez-vous avec un compte de démonstration.

> Vite redirige automatiquement `/api/*` vers `http://localhost:4000` (voir `frontend/vite.config.js`).

---

## Démarrage avec Docker

```bash
docker compose up --build
# Frontend  : http://localhost:8080
# Backend   : http://localhost:4000/api
```

---

## Tests & CI

```bash
# Tests backend
cd backend && npm test

# Lint + build frontend
cd frontend && npm run lint && npm run build
```

Une pipeline **GitHub Actions** (`ci.yml`) exécute sur chaque push/PR :
1. **backend** — `npm ci`, tests `node:test`, vérification syntaxe
2. **frontend** — `npm ci`, build Vite, lint ESLint
3. **e2e smoke** — démarre l'API, login admin, interroge `/api/dashboard`

---

## Programme de montée en industrialisation (post-MVP)

- Persistance réelle (PostgreSQL) + ORM
- API REST documentée (OpenAPI/Swagger)
- Authentification avec refresh tokens + gestion d'audit
- Réels flux IoT (MQTT / WebSocket) au lieu de la simulation
- Modèles ML de maintenance prédictive (scikit-learn / TensorFlow)
- Tests frontend (Vitest + Testing Library) et e2e (Playwright)
- Déploiement Docker Compose → Kubernetes, observabilité (Grafana/Prometheus)