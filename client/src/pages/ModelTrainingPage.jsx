import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Upload, Play, BarChart3, CheckCircle, Cpu, Target, Gauge, Activity } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const ML_URL = 'http://localhost:8000';

export default function ModelTrainingPage() {
  const [selectedModel, setSelectedModel] = useState('random_forest');
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [models, setModels] = useState([]);
  const [allMetrics, setAllMetrics] = useState({});

  // Fetch real model list + metrics from ML service
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch(`${ML_URL}/models`);
        const data = await res.json();
        setModels(data);

        // Build metrics map
        const metricsMap = {};
        data.forEach(m => {
          if (m.accuracy) {
            metricsMap[m.id] = {
              accuracy: m.accuracy,
              precision: m.precision,
              recall: m.recall,
              f1: m.f1,
            };
          }
        });
        setAllMetrics(metricsMap);
      } catch (err) {
        console.log('ML service not available — using defaults');
      }
    }
    fetchModels();
  }, [trainingComplete]);

  const handleTrain = async () => {
    setTraining(true);
    setTrainingComplete(false);
    setProgress(0);

    try {
      // Start training on ML service
      const res = await fetch(`${ML_URL}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, n_samples: 5000 }),
      });

      if (!res.ok) throw new Error('Training request failed');

      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const progressRes = await fetch(`${ML_URL}/train/progress/${selectedModel}`);
          const progressData = await progressRes.json();

          setProgress(progressData.progress || 0);

          if (progressData.status === 'complete') {
            clearInterval(pollInterval);
            setTraining(false);
            setTrainingComplete(true);
            setProgress(100);

            // Refresh metrics
            const metricsRes = await fetch(`${ML_URL}/metrics/${selectedModel}`);
            if (metricsRes.ok) {
              const newMetrics = await metricsRes.json();
              setAllMetrics(prev => ({ ...prev, [selectedModel]: newMetrics }));
            }
          } else if (progressData.status === 'error') {
            clearInterval(pollInterval);
            setTraining(false);
          }
        } catch {
          // Keep polling
        }
      }, 500);

    } catch (err) {
      console.error('Training failed:', err);
      setTraining(false);
    }
  };

  const metrics = allMetrics[selectedModel] || { accuracy: 0, precision: 0, recall: 0, f1: 0 };

  const comparisonData = {
    labels: Object.keys(allMetrics).length > 0
      ? Object.keys(allMetrics).map(k => k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      : ['No models trained yet'],
    datasets: Object.keys(allMetrics).length > 0 ? [
      { label: 'Accuracy', data: Object.values(allMetrics).map(m => m.accuracy || 0), backgroundColor: '#00d4ff', borderRadius: 4 },
      { label: 'F1 Score', data: Object.values(allMetrics).map(m => m.f1 || 0), backgroundColor: '#a855f7', borderRadius: 4 },
    ] : [],
  };

  const modelOptions = [
    { id: 'isolation_forest', name: 'Isolation Forest' },
    { id: 'random_forest', name: 'Random Forest' },
    { id: 'xgboost', name: 'XGBoost' },
    { id: 'autoencoder', name: 'Autoencoder' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>AI Model Training</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Train, evaluate, and compare ML models — real training on the ML service</p>
      </div>

      {/* Model Selector + Train */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} style={{ color: '#00d4ff' }} /> Select Model
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {modelOptions.map((m) => (
              <button key={m.id} onClick={() => setSelectedModel(m.id)} style={{
                padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'left',
                background: selectedModel === m.id ? 'rgba(0,212,255,0.1)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${selectedModel === m.id ? 'rgba(0,212,255,0.3)' : 'var(--border-color)'}`,
                color: selectedModel === m.id ? '#00d4ff' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              }}>{m.name}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleTrain} disabled={training} className="btn btn-primary" style={{ flex: 1, fontSize: '0.8125rem' }}>
              {training ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Play size={14} /> Train on ML Service</>}
            </button>
          </div>

          {(training || trainingComplete) && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Training Progress</span>
                <span style={{ color: '#00d4ff', fontFamily: 'var(--font-mono)' }}>{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                <motion.div animate={{ width: `${Math.min(100, progress)}%` }} style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #00d4ff, #22c55e)' }} />
              </div>
              {trainingComplete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', color: '#22c55e', fontSize: '0.8125rem' }}>
                  <CheckCircle size={14} /> Training complete — real metrics updated!
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Metrics */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Model Metrics {metrics.accuracy ? '(Real)' : '(Not Trained)'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Accuracy', value: metrics.accuracy, icon: Target, color: '#22c55e' },
              { label: 'Precision', value: metrics.precision, icon: Gauge, color: '#00d4ff' },
              { label: 'Recall', value: metrics.recall, icon: Activity, color: '#a855f7' },
              { label: 'F1 Score', value: metrics.f1, icon: BarChart3, color: '#f97316' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                <Icon size={20} style={{ color, marginBottom: '0.375rem' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value || '—'}%</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Model Comparison */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Model Comparison (Real Metrics)</h3>
        <div style={{ height: 250 }}>
          {Object.keys(allMetrics).length > 0 ? (
            <Bar data={comparisonData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
              scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
                y: { min: 0, max: 100, grid: { color: 'rgba(30,41,59,0.3)' }, ticks: { color: '#64748b' } },
              },
            }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Train models to see comparison chart. Start the ML service on port 8000.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
