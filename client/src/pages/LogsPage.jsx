import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Download, Search, Filter } from 'lucide-react';

const logTypes = ['all', 'packet', 'user', 'login', 'prediction', 'alert'];

function generateLogs(count) {
  const types = ['packet', 'user', 'login', 'prediction', 'alert'];
  const messages = {
    packet: ['TCP packet captured from 192.168.1.x', 'UDP packet routed to 10.0.0.x', 'DNS query resolved for domain.com', 'ICMP echo request detected'],
    user: ['Settings updated', 'Dashboard accessed', 'Alert dismissed', 'Report exported'],
    login: ['Admin login successful', 'Failed login attempt', 'Session expired', 'Password changed'],
    prediction: ['Random Forest: Normal traffic (98.2%)', 'XGBoost: DDoS detected (94.5%)', 'Isolation Forest: Anomaly found', 'Autoencoder: Reconstruction error high'],
    alert: ['Critical alert generated', 'Alert resolved', 'Alert escalated', 'Alert auto-dismissed'],
  };
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const msgs = messages[type];
    return {
      id: i + 1,
      type,
      message: msgs[Math.floor(Math.random() * msgs.length)].replace('x', Math.floor(Math.random() * 254) + 1),
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      user: type === 'login' || type === 'user' ? 'admin@netshield.ai' : null,
      ip: `192.168.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 254) + 1}`,
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

const typeColors = {
  packet: '#00d4ff', user: '#a855f7', login: '#22c55e', prediction: '#f97316', alert: '#ef4444',
};

export default function LogsPage() {
  const [logs] = useState(() => generateLogs(100));
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = logs.filter((l) => {
    if (filter !== 'all' && l.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.message.toLowerCase().includes(q) || l.ip.includes(q);
    }
    return true;
  });

  const handleExport = (format) => {
    alert(`Exporting ${filtered.length} logs as ${format.toUpperCase()}`);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>System Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{filtered.length} log entries</p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {['csv', 'pdf', 'excel'].map((f) => (
            <button key={f} onClick={() => handleExport(f)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
              <Download size={13} /> {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', height: 36, fontSize: '0.8125rem' }} />
        </div>
        {logTypes.map((t) => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500,
            background: filter === t ? `${typeColors[t] || '#00d4ff'}15` : 'transparent',
            color: filter === t ? (typeColors[t] || '#00d4ff') : 'var(--text-muted)',
            border: `1px solid ${filter === t ? `${typeColors[t] || '#00d4ff'}40` : 'transparent'}`,
            cursor: 'pointer', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Type</th><th>Message</th><th>IP</th><th>User</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((log, i) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.id}</td>
                  <td>
                    <span style={{
                      padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)',
                      fontSize: '0.6875rem', fontWeight: 600,
                      background: `${typeColors[log.type]}15`, color: typeColors[log.type],
                    }}>{log.type}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{log.ip}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{log.user || '-'}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
