import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, XCircle, AlertTriangle, Filter, Download } from 'lucide-react';
import useAlertStore from '../store/alertStore';

const severities = ['all', 'critical', 'high', 'medium', 'low'];

export default function AlertsPage() {
  const { alerts, markAsRead, dismissAlert } = useAlertStore();
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Alerts come from real WebSocket data via useSocket hook — no fake data needed


  const filtered = alerts.filter((a) => {
    if (filter !== 'all' && a.severity !== filter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts.forEach((a) => { if (sevCounts[a.severity] !== undefined) sevCounts[a.severity]++; });

  const getSevColor = (s) => ({ critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[s] || '#64748b');
  const getSevBg = (s) => ({ critical: 'rgba(239,68,68,0.1)', high: 'rgba(249,115,22,0.1)', medium: 'rgba(234,179,8,0.1)', low: 'rgba(34,197,94,0.1)' }[s] || 'rgba(100,116,139,0.1)');

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Smart Alerts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI-generated security notifications</p>
        </div>
        <button className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <Download size={15} /> Export
        </button>
      </div>

      {/* Severity Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {Object.entries(sevCounts).map(([sev, count]) => (
          <motion.div key={sev} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '1rem', textAlign: 'center', borderTop: `3px solid ${getSevColor(sev)}` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: getSevColor(sev) }}>{count}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>{sev}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {severities.map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500,
            background: filter === s ? getSevBg(s) : 'transparent', color: filter === s ? getSevColor(s) : 'var(--text-muted)',
            border: `1px solid ${filter === s ? getSevColor(s) + '40' : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize',
          }}>{s}</button>
        ))}
        <div style={{ flex: 1 }} />
        {['all', 'active', 'resolved'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500,
            background: statusFilter === s ? 'rgba(0,212,255,0.1)' : 'transparent', color: statusFilter === s ? '#00d4ff' : 'var(--text-muted)',
            border: `1px solid ${statusFilter === s ? 'rgba(0,212,255,0.3)' : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>

      {/* Alert List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map((alert, i) => (
          <motion.div key={alert._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: !alert.read ? 'rgba(0,212,255,0.02)' : 'var(--bg-card)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: getSevColor(alert.severity), boxShadow: `0 0 8px ${getSevColor(alert.severity)}`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{alert.threatName}</span>
                <span className={`risk-badge risk-badge--${alert.severity}`} style={{ fontSize: '0.5625rem' }}>{alert.severity}</span>
                {alert.status === 'resolved' && (
                  <span style={{ fontSize: '0.625rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={10} /> Resolved
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <strong>Device:</strong> {alert.affectedDevice} &nbsp;|&nbsp; <strong>Action:</strong> {alert.recommendedAction}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(alert.time).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
              {!alert.read && (
                <button onClick={() => markAsRead(alert._id)} className="btn btn-ghost" style={{ padding: '0.375rem', fontSize: '0.75rem' }}>
                  <CheckCircle size={14} />
                </button>
              )}
              <button onClick={() => dismissAlert(alert._id)} className="btn btn-ghost" style={{ padding: '0.375rem', color: '#ef4444' }}>
                <XCircle size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
