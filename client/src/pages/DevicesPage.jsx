import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Laptop2, Shield, Search, Monitor, Smartphone, Router, Server, RefreshCcw } from 'lucide-react';
import api from '../services/api';

const getDeviceIcon = (type) => {
  switch (type) {
    case 'server': return Server;
    case 'desktop': return Monitor;
    case 'mobile': return Smartphone;
    case 'router': return Router;
    default: return Laptop2;
  }
};

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/devices');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDevices(res.data);
      } else {
        // Fallback default host device
        setDevices([
          { _id: 'local-pc', name: 'Host-Machine (Local PC)', ip: '127.0.0.1', type: 'desktop', online: true, connections: 1, lastSeen: new Date().toISOString() },
        ]);
      }
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = devices.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.name || d.ip || '').toLowerCase().includes(q) || (d.ip || '').includes(q);
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Active Network Devices</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{devices.length} active network endpoint connection(s) detected via psutil</p>
        </div>
        <button onClick={fetchDevices} disabled={loading} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <RefreshCcw size={14} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search devices by IP..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', height: 36, fontSize: '0.8125rem' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            No active devices detected yet. Make sure ML service is running on port 8000.
          </div>
        ) : (
          filtered.map((d, i) => {
            const Icon = getDeviceIcon(d.type);
            return (
              <motion.div key={d._id || i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(0,212,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4ff',
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || d.ip}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.ip}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span>Connections: <strong>{d.connections || 1}</strong></span>
                  <span style={{ color: '#22c55e', fontWeight: 500 }}>Active</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
