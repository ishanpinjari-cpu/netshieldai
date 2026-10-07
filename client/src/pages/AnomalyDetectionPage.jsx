import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Cpu, Gauge, Target, Clock, Zap, RotateCcw } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import useDashboardStore from '../store/dashboardStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ML_URL = 'http://localhost:8000';

const attackCategories = [
  'Normal Traffic', 'Suspicious Traffic', 'Malware Communication', 'DDoS Attack',
  'Port Scanning', 'Brute Force Attempts', 'Botnet Activity', 'Data Exfiltration', 'Unknown Anomaly',
];

export default function AnomalyDetectionPage() {
  const [selectedModel, setSelectedModel] = useState('random_forest');
  const [models, setModels] = useState([]);
  const [detections, setDetections] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch models from ML service
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch(`${ML_URL}/models`);
        const data = await res.json();
        setModels(data);
      } catch (err) {
        console.log('ML service not available yet');
        // Fallback
        setModels([
          { id: 'isolation_forest', name: 'Isolation Forest', type: 'Unsupervised', accuracy: 0 },
          { id: 'random_forest', name: 'Random Forest', type: 'Supervised', accuracy: 0 },
          { id: 'xgboost', name: 'XGBoost', type: 'Supervised', accuracy: 0 },
          { id: 'autoencoder', name: 'Autoencoder', type: 'Deep Learning', accuracy: 0 },
        ]);
      }
      setLoading(false);
    }
    fetchModels();
  }, []);

  // Fetch metrics for selected model
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`${ML_URL}/metrics/${selectedModel}`);
        if (res.ok) {
          const data = await res.json();
          setModelMetrics(data);
        }
      } catch {}
    }
    fetchMetrics();
  }, [selectedModel]);

  // Stream real detections from WebSocket via dashboardStore
  const { recentPackets } = useDashboardStore();

  // Process recent packets into detections
  useEffect(() => {
    const anomalies = recentPackets.filter(p => p.category && p.category !== 'Normal Traffic');
    setDetections(anomalies.slice(0, 100));

    // Count categories
    const stats = {};
    attackCategories.forEach(cat => {
      stats[cat] = recentPackets.filter(p => p.category === cat).length;
    });
    setCategoryStats(stats);
  }, [recentPackets]);

  const chartData = {
    labels: attackCategories.map((c) => c.length > 15 ? c.slice(0, 15) + '...' : c),
    datasets: [{
      label: 'Detections',
      data: attackCategories.map((c) => categoryStats[c] || 0),
      backgroundColor: [
        '#22c55e', '#eab308', '#ef4444', '#f97316', '#00d4ff',
        '#a855f7', '#ec4899', '#f43f5e', '#64748b',
      ],
      borderWidth: 0,
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', borderColor: '#1e293b', borderWidth: 1 },
    },
    scales: {
      x: { grid: { color: 'rgba(30,41,59,0.3)' }, ticks: { color: '#64748b' } },
      y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    },
  };

  const allPackets = recentPackets.slice(0, 50);
  const totalDetections = allPackets.length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>AI Anomaly Detection</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Machine learning-powered threat classification — real network data</p>
      </div>

      {/* Model Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${models.length || 4}, 1fr)`, gap: '0.75rem', marginBottom: '1rem' }}>
        {models.map((m) => (
          <motion.button key={m.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedModel(m.id)}
            className="glass-card" style={{
              padding: '1rem', cursor: 'pointer', textAlign: 'left',
              border: selectedModel === m.id ? '1px solid rgba(0,212,255,0.5)' : '1px solid var(--border-color)',
              background: selectedModel === m.id ? 'rgba(0,212,255,0.08)' : 'var(--bg-card)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
              <Cpu size={14} style={{ color: selectedModel === m.id ? '#00d4ff' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: selectedModel === m.id ? '#00d4ff' : 'var(--text-primary)' }}>{m.name}</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{m.type}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedModel === m.id ? '#00d4ff' : 'var(--text-primary)', marginTop: '0.375rem' }}>
              {m.accuracy || modelMetrics?.accuracy || '—'}%
            </div>
          </motion.button>
        ))}
      </div>

      {/* Metrics + Attack Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Active Model: {selectedModel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Accuracy', value: modelMetrics?.accuracy || '—', icon: '🎯', color: '#22c55e' },
              { label: 'Precision', value: modelMetrics?.precision || '—', icon: '◎', color: '#00d4ff' },
              { label: 'Avg. Pred Time', value: modelMetrics?.training_time ? `${modelMetrics.training_time}s` : '—', icon: '⏱', color: '#f97316' },
              { label: 'Detections', value: totalDetections, icon: '⚡', color: '#a855f7' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{icon} {label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{typeof value === 'number' ? (label.includes('Pred') ? value : `${value}%`) : value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Attack Distribution</h3>
          <div style={{ height: 220 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Recent Detections Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Detections</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalDetections} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Source IP</th>
                <th>Dest IP</th>
                <th>Category</th>
                <th>Confidence</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Pred Time</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {allPackets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Connecting to ML service...' : 'Waiting for network data... Make sure ML service is running on port 8000'}
                  </td>
                </tr>
              ) : (
                allPackets.map((d, i) => (
                  <tr key={d.id || i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{d.src_ip || d.srcIP || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{d.dst_ip || d.dstIP || '—'}</td>
                    <td>
                      <span style={{
                        padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                        background: d.category === 'Normal Traffic' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: d.category === 'Normal Traffic' ? '#22c55e' : '#ef4444',
                      }}>{d.category || '—'}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{d.confidence || '—'}%</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: (d.risk_score || d.riskScore || 0) >= 60 ? '#ef4444' : (d.risk_score || d.riskScore || 0) >= 40 ? '#f97316' : '#22c55e',
                        }} />
                        {d.risk_score || d.riskScore || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`risk-badge risk-badge--${d.risk_level || d.riskLevel || 'low'}`}>
                        {(d.risk_level || d.riskLevel || 'low').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{d.prediction_time_ms || d.predictionTime || '—'}ms</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
