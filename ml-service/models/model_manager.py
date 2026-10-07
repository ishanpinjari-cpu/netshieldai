import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import os
import json
import time

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("[INFO] XGBoost not installed — skipping")

try:
    import tensorflow as tf
    from tensorflow import keras
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("[INFO] TensorFlow not installed — skipping")

from config import MODEL_DIR
from services.traffic_simulator import generate_training_data, extract_features, ATTACK_CATEGORIES


class ModelManager:
    """Manages all ML models for network anomaly detection."""

    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        self.metrics = {}
        self.is_ready = False
        self._training_progress = {}

    def auto_init(self):
        """Auto-load saved models or train fresh ones on startup."""
        print("\n🧠 Initializing ML models...")
        loaded = self._load_saved_models()

        if loaded:
            print(f"  ✅ Loaded {loaded} saved model(s) from disk")
        else:
            print("  📦 No saved models found — training from scratch...")
            self.train_model('random_forest', n_samples=5000)
            self.train_model('isolation_forest', n_samples=5000)

        self.is_ready = True
        print(f"  🟢 Model Manager ready — {len(self.models)} model(s) active\n")

    def _load_saved_models(self):
        """Try to load previously trained models from disk."""
        loaded_count = 0
        model_names = ['random_forest', 'isolation_forest', 'xgboost']

        for name in model_names:
            model_path = os.path.join(MODEL_DIR, f'{name}.pkl')
            scaler_path = os.path.join(MODEL_DIR, f'{name}_scaler.pkl')
            le_path = os.path.join(MODEL_DIR, f'{name}_le.pkl')
            metrics_path = os.path.join(MODEL_DIR, f'{name}_metrics.json')

            if os.path.exists(model_path) and os.path.exists(scaler_path):
                try:
                    self.models[name] = joblib.load(model_path)
                    self.scalers[name] = joblib.load(scaler_path)
                    if os.path.exists(le_path):
                        self.label_encoders[name] = joblib.load(le_path)
                    if os.path.exists(metrics_path):
                        with open(metrics_path, 'r') as f:
                            self.metrics[name] = json.load(f)
                    else:
                        self.metrics[name] = {'accuracy': 0, 'precision': 0, 'recall': 0, 'f1': 0, 'trained': True}
                    loaded_count += 1
                    print(f"  📂 Loaded {name} (accuracy: {self.metrics[name].get('accuracy', '?')}%)")
                except Exception as e:
                    print(f"  ⚠️  Failed to load {name}: {e}")

        return loaded_count

    def train_model(self, model_name, n_samples=5000, progress_callback=None):
        """Train a specific model on synthetic network traffic data."""
        print(f"  🏋️ Training {model_name} on {n_samples} samples...")
        self._training_progress[model_name] = {'status': 'training', 'progress': 0}
        start_time = time.time()

        # Generate training data
        features, labels, _ = generate_training_data(n_samples)
        self._training_progress[model_name]['progress'] = 20

        # Encode labels
        le = LabelEncoder()
        encoded_labels = le.fit_transform(labels)
        self.label_encoders[model_name] = le

        # Scale features
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features)
        self.scalers[model_name] = scaler
        self._training_progress[model_name]['progress'] = 30

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            scaled_features, encoded_labels, test_size=0.2, random_state=42
        )
        self._training_progress[model_name]['progress'] = 40

        if model_name == 'isolation_forest':
            model = IsolationForest(n_estimators=100, contamination=0.25, random_state=42)
            model.fit(X_train)
            self._training_progress[model_name]['progress'] = 80

            y_pred_if = model.predict(X_test)
            y_pred = np.where(y_pred_if == -1, 1, 0)
            y_test_binary = np.where(y_test > 0, 1, 0)

            acc = accuracy_score(y_test_binary, y_pred)
            prec = precision_score(y_test_binary, y_pred, zero_division=0)
            rec = recall_score(y_test_binary, y_pred, zero_division=0)
            f1 = f1_score(y_test_binary, y_pred, zero_division=0)

        elif model_name == 'random_forest':
            model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
            model.fit(X_train, y_train)
            self._training_progress[model_name]['progress'] = 80

            y_pred = model.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        elif model_name == 'xgboost' and HAS_XGBOOST:
            model = xgb.XGBClassifier(
                n_estimators=100, max_depth=6, learning_rate=0.1,
                objective='multi:softmax', num_class=len(ATTACK_CATEGORIES),
                random_state=42, eval_metric='mlogloss'
            )
            model.fit(X_train, y_train)
            self._training_progress[model_name]['progress'] = 80

            y_pred = model.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        elif model_name == 'autoencoder' and HAS_TF:
            normal_mask = y_train == 0
            X_normal = X_train[normal_mask]

            input_dim = X_normal.shape[1]
            autoencoder = keras.Sequential([
                keras.layers.Dense(16, activation='relu', input_shape=(input_dim,)),
                keras.layers.Dense(8, activation='relu'),
                keras.layers.Dense(4, activation='relu'),
                keras.layers.Dense(8, activation='relu'),
                keras.layers.Dense(16, activation='relu'),
                keras.layers.Dense(input_dim, activation='linear'),
            ])
            autoencoder.compile(optimizer='adam', loss='mse')
            autoencoder.fit(X_normal, X_normal, epochs=20, batch_size=32, verbose=0)
            self._training_progress[model_name]['progress'] = 80

            reconstructed = autoencoder.predict(X_test, verbose=0)
            mse = np.mean(np.square(X_test - reconstructed), axis=1)
            threshold = np.percentile(mse, 75)
            y_pred = (mse > threshold).astype(int)
            y_test_binary = np.where(y_test > 0, 1, 0)

            acc = accuracy_score(y_test_binary, y_pred)
            prec = precision_score(y_test_binary, y_pred, zero_division=0)
            rec = recall_score(y_test_binary, y_pred, zero_division=0)
            f1 = f1_score(y_test_binary, y_pred, zero_division=0)
            model = autoencoder
        else:
            self._training_progress[model_name] = {'status': 'error', 'progress': 0}
            return {'error': f'Model {model_name} not available'}

        # Save model
        self.models[model_name] = model
        training_time = time.time() - start_time

        self.metrics[model_name] = {
            'accuracy': round(acc * 100, 1),
            'precision': round(prec * 100, 1),
            'recall': round(rec * 100, 1),
            'f1': round(f1 * 100, 1),
            'training_time': round(training_time, 2),
            'n_samples': n_samples,
            'trained': True,
            'trained_at': time.strftime('%Y-%m-%d %H:%M:%S'),
        }

        # Save to disk
        try:
            if model_name != 'autoencoder':
                joblib.dump(model, os.path.join(MODEL_DIR, f'{model_name}.pkl'))
            joblib.dump(scaler, os.path.join(MODEL_DIR, f'{model_name}_scaler.pkl'))
            joblib.dump(le, os.path.join(MODEL_DIR, f'{model_name}_le.pkl'))
            with open(os.path.join(MODEL_DIR, f'{model_name}_metrics.json'), 'w') as f:
                json.dump(self.metrics[model_name], f)
        except Exception as e:
            print(f"  ⚠️  Could not save model to disk: {e}")

        self._training_progress[model_name] = {'status': 'complete', 'progress': 100}
        print(f"  ✅ {model_name} trained in {training_time:.2f}s | Accuracy: {acc*100:.1f}%")
        return self.metrics[model_name]

    def predict(self, packet_data, model_name='random_forest'):
        """Predict the category of a network packet using a trained model."""
        start_time = time.time()
        features = extract_features(packet_data)

        # Use the trained model
        if model_name in self.models and model_name in self.scalers:
            scaler = self.scalers[model_name]
            scaled = scaler.transform(features)
            model = self.models[model_name]

            if model_name == 'isolation_forest':
                pred = model.predict(scaled)
                category = 'Unknown Anomaly' if pred[0] == -1 else 'Normal Traffic'
                confidence = min(100, abs(model.score_samples(scaled)[0]) * 100)
            elif model_name == 'autoencoder' and HAS_TF:
                reconstructed = model.predict(scaled, verbose=0)
                mse = np.mean(np.square(scaled - reconstructed))
                category = 'Unknown Anomaly' if mse > 0.5 else 'Normal Traffic'
                confidence = min(100, max(0, (1 - mse) * 100))
            else:
                le = self.label_encoders.get(model_name)
                pred_idx = model.predict(scaled)[0]
                proba = model.predict_proba(scaled)[0]
                category = le.inverse_transform([pred_idx])[0]
                confidence = float(np.max(proba) * 100)
        else:
            # No trained model — try to train one quickly
            if not self.models:
                print("  ⚠️  No trained models — training Random Forest...")
                self.train_model('random_forest', n_samples=2000)
                return self.predict(packet_data, 'random_forest')

            # Fall back to first available model
            available = list(self.models.keys())
            if available:
                return self.predict(packet_data, available[0])

            # Last resort
            category = 'Normal Traffic'
            confidence = 50.0

        prediction_time = (time.time() - start_time) * 1000  # ms

        # Risk scoring
        risk_score = self._calculate_risk(category, confidence)
        risk_level = 'critical' if risk_score >= 80 else 'high' if risk_score >= 60 else 'medium' if risk_score >= 40 else 'low'

        return {
            'category': category,
            'confidence': round(confidence, 1),
            'risk_score': risk_score,
            'risk_level': risk_level,
            'model_used': model_name,
            'prediction_time_ms': round(prediction_time, 2),
        }

    def _calculate_risk(self, category, confidence):
        """Calculate risk score 0-100 based on category and confidence."""
        base_risk = {
            'Normal Traffic': 5, 'Suspicious Traffic': 40,
            'Malware Communication': 85, 'DDoS Attack': 90,
            'Port Scanning': 50, 'Brute Force Attempts': 70,
            'Botnet Activity': 80, 'Data Exfiltration': 95,
            'Unknown Anomaly': 60,
        }
        base = base_risk.get(category, 50)
        return min(100, int(base * (confidence / 100)))

    def get_training_progress(self, model_name):
        """Get training progress for a model."""
        return self._training_progress.get(model_name, {'status': 'idle', 'progress': 0})

    def get_all_metrics(self):
        """Get metrics for all models."""
        return self.metrics

    def get_model_list(self):
        """List all available models with their status and metrics."""
        all_models = [
            {'id': 'isolation_forest', 'name': 'Isolation Forest', 'type': 'Unsupervised'},
            {'id': 'random_forest', 'name': 'Random Forest', 'type': 'Supervised'},
            {'id': 'xgboost', 'name': 'XGBoost', 'type': 'Supervised', 'available': HAS_XGBOOST},
            {'id': 'autoencoder', 'name': 'Autoencoder', 'type': 'Deep Learning', 'available': HAS_TF},
        ]
        for m in all_models:
            metrics = self.metrics.get(m['id'], {})
            m.update(metrics)
            m['is_loaded'] = m['id'] in self.models
        return all_models


# Singleton
model_manager = ModelManager()
