# FraudShield — Real-Time Financial Transaction Fraud Detection System

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

FraudShield is a production-grade fraud detection platform that ingests a simulated real-time transaction stream, scores each transaction using a trained ensemble ML model, and visualizes fraud patterns on a live dashboard — all connected through a microservices architecture.

> Built as a portfolio project to demonstrate full-stack engineering, machine learning, and real-time systems design in a fintech context.

---

## Screenshots

> Dashboard with live transaction feed, stat cards, and fraud analytics

![Dashboard](screenshots/dashboard.png)

> Fraud hotspot map showing geographic distribution of flagged transactions

![Map](screenshots/map.png)

> Alerts page with real-time fraud notifications

![Alerts](screenshots/alerts.png)

---

## Architecture

```
[Transaction Simulator (Node.js)]
          ↓  POST /api/transactions (JWT)
[Express REST API]  ←→  [MongoDB Atlas]
          ↓  POST /score
[Python FastAPI ML Service]
          ↓  fraud_score + is_fraud
[Express updates MongoDB + emits Socket.io events]
          ↓  new_transaction / fraud_alert
[React Dashboard — live updates, no polling]
```

The system is built as two decoupled microservices — a Node.js/Express API and a Python/FastAPI ML service — that communicate over HTTP. This means the ML model can be scaled, retrained, or swapped independently without touching the API layer.

---

## Features

- **Real-time transaction scoring** — every transaction is scored by an ensemble ML model within milliseconds of ingestion
- **Live dashboard** — Socket.io pushes updates to the dashboard instantly, no polling required
- **JWT authentication** — secure login/register with bcrypt password hashing and per-user data isolation
- **Fraud hotspot map** — interactive geographic map showing where fraud is concentrated across US cities
- **Analytics charts** — fraud rate over time, score distribution histogram, fraud rate by merchant category
- **Transaction simulator** — generates realistic fake transactions at configurable rates to demonstrate the system live
- **Ensemble ML model** — Logistic Regression + Random Forest + XGBoost with soft voting, achieving 0.976 AUC-ROC
- **Class imbalance handling** — `class_weight='balanced'` and `scale_pos_weight` to handle the naturally rare fraud rate

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| Tailwind CSS v4 | Styling |
| Recharts | Data visualization charts |
| React Leaflet | Geographic fraud hotspot map |
| Socket.io Client | Real-time dashboard updates |
| React Router v6 | Client-side routing |
| Axios | HTTP client with JWT interceptors |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB Atlas + Mongoose | Database and ODM |
| Socket.io | Real-time WebSocket events |
| JWT + bcryptjs | Authentication and password hashing |
| Axios | HTTP calls to ML microservice |

### ML Service
| Technology | Purpose |
|---|---|
| Python 3.13 + FastAPI | ML microservice API |
| scikit-learn | Logistic Regression, Random Forest, VotingClassifier |
| XGBoost | Gradient boosting model |
| pandas + NumPy | Data processing and feature engineering |
| joblib | Model serialization |
| Pydantic | Request/response validation |

---

## Machine Learning

### Model
A soft-voting ensemble of three classifiers:
- **Logistic Regression** — fast, interpretable linear baseline
- **Random Forest** — 100 trees, handles non-linear patterns
- **XGBoost** — gradient boosting, highest individual accuracy

### Training Data
10,000 synthetic transactions generated with hand-crafted fraud rules based on real-world patterns:
- High-value transactions (> $2,000)
- Late-night activity (10pm – 5am)
- Foreign transactions
- High-value ATM withdrawals
- High-value online purchases at night

### Performance
| Metric | Score |
|---|---|
| Precision | 0.87 |
| Recall | 0.74 |
| F1 Score | 0.80 |
| AUC-ROC | 0.976 |

### Key ML Decisions
- **Soft voting** over hard voting — uses predicted probabilities rather than binary votes, consistently more accurate
- **`class_weight='balanced'`** — compensates for the naturally low fraud rate (~3%) without oversampling
- **StandardScaler** fitted only on training data — prevents data leakage into evaluation metrics
- **Feature engineering** — amount log-scaling, time-of-day extraction, is_night and is_foreign binary flags, one-hot encoded category and country

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/tanazlodi/fraudshield.git
cd fraudshield
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your values:

```env
PORT=5001
MONGO_URI=mongodb+srv://your_user:your_password@your_cluster.mongodb.net/fraudshield
ML_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_secret_key_here
MODEL_PATH=./model/fraud_model.pkl
```

### 3. Install server dependencies

```bash
cd server
npm install
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

### 5. Set up Python ML service

```bash
cd ../ml-service
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### 6. Train the ML model

```bash
cd model
python generate_data.py
python train_v2.py
cd ..
```

### 7. Install simulator dependencies

```bash
cd ../simulator
npm install
```

---

## Running the Project

You need **three terminals** running simultaneously:

**Terminal 1 — Express API**
```bash
cd server
node index.js
```

**Terminal 2 — Python ML Service**
```bash
cd ml-service
source venv/bin/activate
uvicorn main:app --port 8000
```
> Note: first startup takes ~45 seconds to load ML dependencies

**Terminal 3 — React Frontend**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Optional — Transaction Simulator**
```bash
cd simulator
node stream.js
```

The simulator logs in automatically, then sends one transaction every 2 seconds. Watch the dashboard update in real time.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive JWT |

### Transactions (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | Paginated transaction history |
| GET | `/api/transactions/:id` | Single transaction detail |
| POST | `/api/transactions` | Ingest and score a transaction |
| GET | `/api/transactions/filter/flagged` | Fraud-flagged transactions only |

### Analytics (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/summary` | Stat card data |
| GET | `/api/analytics/fraud-over-time` | Fraud counts grouped by hour |
| GET | `/api/analytics/by-category` | Fraud rate per merchant category |
| GET | `/api/analytics/score-distribution` | Fraud score histogram data |
| GET | `/api/analytics/fraud-locations` | Lat/lng of flagged transactions |

### ML Service
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/score` | Score a transaction |

---

## Project Structure

```
fraudshield/
├── client/                      # React frontend
│   └── src/
│       ├── components/          # Reusable UI components
│       ├── pages/               # Route-level page components
│       ├── context/             # React Context (auth state)
│       ├── hooks/               # Custom hooks (useSocket)
│       └── services/            # API call functions
├── server/                      # Express API
│   ├── models/                  # Mongoose schemas (User, Transaction)
│   ├── routes/                  # API route handlers
│   ├── middleware/              # JWT authentication middleware
│   ├── services/                # ML service HTTP client
│   └── socket/                  # Socket.io setup
├── ml-service/                  # Python FastAPI ML microservice
│   ├── model/
│   │   ├── generate_data.py     # Synthetic training data generator
│   │   ├── train_v2.py          # Model training pipeline
│   │   ├── predict.py           # Inference logic
│   │   └── saved_v2/            # Trained model artifacts (.pkl)
│   └── data/                    # Training datasets (not in git)
└── simulator/                   # Transaction stream generator
    └── stream.js
```

---

## Security

- Passwords hashed with bcrypt (salt rounds: 12) — raw passwords never stored
- JWT tokens expire after 7 days
- Per-user data isolation — every query filters by `userId`
- Generic auth error messages — never reveals whether email or password was wrong
- Environment variables for all secrets — never committed to git
- MongoDB IP whitelisting via Atlas Network Access

---

## Roadmap

- [ ] Deploy to Render (backend) + Vercel (frontend)
- [ ] SHAP values for model explainability — show *why* a transaction was flagged
- [ ] Human review queue — analysts can mark alerts as reviewed
- [ ] Rate limiting on API endpoints
- [ ] Refresh token rotation for longer sessions
- [ ] Multi-organization support with role-based access control

---

## 👤 Author

**Tanaz Lodi**
[github.com/tanazlodi](https://github.com/tanazlodi)

---

## License

This project is licensed under the MIT License.
```
