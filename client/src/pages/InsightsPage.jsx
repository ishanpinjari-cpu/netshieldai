import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Shield, Activity, Cpu, RefreshCcw } from 'lucide-react';
import api from '../services/api';

const iconMap = {
  Traffic: TrendingUp,
  Threat: AlertTriangle,
  Scanning: Activity,
  Health: Shield,
  AI: Cpu,
  System: Activity,
  Connections: Activity,
};

const colorMap = {
  critical: '#ef4444',
  warning: '#f97316',
  high: '#f97316',
  info: '#00d4ff',
  success: '#22c55e',
};

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/insights');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setInsights(res.data);
      } else {
        setInsights([
          { text: 'Network health is normal. Monitoring traffic capture.', category: 'Health', severity: 'info' },
          { text: 'AI Model running live predictions.', category: 'AI', severity: 'info' },
        ]);
      }
    } catch {
      setInsights([
        { text: 'Could not connect to ML service. Start ML Service on port 8000.', category: 'System', severity: 'warning' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const categories = ['all', ...new Set(insights.map((i) => i.category))];
  const filtered = filter === 'all' ? insights : insights.filter((i) => i.category === filter);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>AI Insights</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Intelligent real-time network analysis & heuristics from Python ML Service</p>
        </div>
        <button onClick={fetchInsights} disabled={loading} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <RefreshCcw size={14} className={loading ? 'spinner' : ''} /> Refresh Insights
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500,
            background: filter === c ? 'rgba(0,212,255,0.15)' : 'transparent', color: filter === c ? '#00d4ff' : 'var(--text-muted)',
            border: `1px solid ${filter === c ? 'rgba(0,212,255,0.3)' : 'var(--border-color)'}`, cursor: 'pointer', textTransform: 'capitalize',
          }}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '0.75rem' }}>
        {filtered.map((insight, i) => {
          const Icon = iconMap[insight.category] || Lightbulb;
          const color = colorMap[insight.severity] || '#00d4ff';

          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{insight.category}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{insight.severity}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{insight.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
