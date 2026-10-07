# 🛡️ NetShield AI – Intelligent Network Traffic Anomaly Detection System

An AI-powered cybersecurity platform that monitors network traffic in real time, detects anomalies using Machine Learning, classifies cyber attacks, and generates intelligent alerts.

## 🏗️ Architecture

| Service | Tech | Port |
|---------|------|------|
| Frontend | React + Vite + Tailwind CSS | 3000 |
| Backend | Node.js + Express + MongoDB | 5000 |
| ML Service | Python + Flask + scikit-learn | 8000 |
| Database | MongoDB | 27017 |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Frontend
cd client && npm install

# Backend
cd server && npm install

# ML Service
cd ml-service && pip install -r requirements.txt
```

### 2. Environment Variables

Copy `.env.example` to `.env` in each service directory and update values.

### 3. Start Services

```bash
# Terminal 1 – Backend
cd server && npm run dev

# Terminal 2 – ML Service
cd ml-service && python app.py

# Terminal 3 – Frontend
cd client && npm run dev
```

### Docker (Alternative)
```bash
docker-compose up --build
```

## 📊 Features

- 🔐 JWT Authentication with Role-Based Access
- 📡 Live Network Traffic Monitoring
- 🤖 AI-Based Anomaly Detection (4 ML models)
- 🔍 Deep Packet Inspection
- ⚠️ Smart Alert System
- 📈 Interactive Analytics Dashboard
- 🛡️ Threat Intelligence Database
- 📱 Responsive Cybersecurity UI
- 🌙 Dark & Light Themes

## 🧠 ML Models

| Model | Type | Use Case |
|-------|------|----------|
| Isolation Forest | Unsupervised | Unknown anomaly detection |
| Random Forest | Supervised | Multi-class attack classification |
| XGBoost | Supervised | High-accuracy classification |
| Autoencoder | Deep Learning | Reconstruction-error anomaly detection |

## 📄 License

MIT
