import { useState } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch, Filter, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import useDashboardStore from '../store/dashboardStore';

const protocols = ['All', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP', 'SSH', 'FTP'];

export default function PacketInspectionPage() {
  // Real packets come from WebSocket via dashboardStore
  const { recentPackets } = useDashboardStore();
  const packets = recentPackets;
  const [filter, setFilter] = useState({ protocol: 'All', search: '' });
  const [page, setPage] = useState(1);
  const perPage = 20;


  const filtered = packets.filter((p) => {
    if (filter.protocol !== 'All' && p.protocol !== filter.protocol) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const srcIP = p.src_ip || p.srcIP || '';
      const dstIP = p.dst_ip || p.dstIP || '';
      return srcIP.includes(q) || dstIP.includes(q) || (p.protocol || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const displayed = filtered.slice((page - 1) * perPage, page * perPage);

  const getRiskColor = (score) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Packet Inspection</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Deep packet analysis & filtering</p>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search by IP, protocol..." value={filter.search} onChange={(e) => { setFilter({ ...filter, search: e.target.value }); setPage(1); }} style={{ paddingLeft: '2.25rem', height: 36, fontSize: '0.8125rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {protocols.map((p) => (
            <button key={p} onClick={() => { setFilter({ ...filter, protocol: p }); setPage(1); }} style={{
              padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500,
              background: filter.protocol === p ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.03)',
              color: filter.protocol === p ? '#00d4ff' : 'var(--text-secondary)',
              border: `1px solid ${filter.protocol === p ? 'rgba(0,212,255,0.3)' : 'var(--border-color)'}`,
              cursor: 'pointer', transition: 'all 150ms',
            }}>
              {p}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filtered.length} packets</span>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Source IP</th>
                <th>Dest IP</th>
                <th>Src Port</th>
                <th>Dst Port</th>
                <th>Protocol</th>
                <th>Size</th>
                <th>TTL</th>
                <th>Flags</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Waiting for network data... Make sure ML service is running on port 8000
                  </td>
                </tr>
              ) : (
                displayed.map((pkt, i) => {
                  const srcIP = pkt.src_ip || pkt.srcIP || '—';
                  const dstIP = pkt.dst_ip || pkt.dstIP || '—';
                  const srcPort = pkt.src_port || pkt.srcPort || '—';
                  const dstPort = pkt.dst_port || pkt.dstPort || '—';
                  const riskScore = pkt.risk_score || pkt.riskScore || 0;
                  const category = pkt.category || pkt.prediction || 'Normal';
                  const riskLevel = pkt.risk_level || pkt.riskLevel || 'low';
                  return (
                    <motion.tr key={pkt.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{srcIP}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{dstIP}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{srcPort}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{dstPort}</td>
                      <td>
                        <span style={{
                          padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)',
                          fontSize: '0.6875rem', fontWeight: 600,
                          background: 'rgba(0,212,255,0.1)', color: '#00d4ff',
                          border: '1px solid rgba(0,212,255,0.2)',
                        }}>{pkt.protocol || '—'}</span>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{pkt.size || '—'} B</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{pkt.ttl || '—'}</td>
                      <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{pkt.flags || '—'}</td>
                      <td>
                        <span className={`risk-badge risk-badge--${riskLevel}`} style={{ fontSize: '0.625rem' }}>
                          {category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <div style={{ width: 24, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ width: `${riskScore}%`, height: '100%', background: getRiskColor(riskScore), borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: getRiskColor(riskScore), fontFamily: 'var(--font-mono)' }}>{riskScore}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {pkt.timestamp ? new Date(pkt.timestamp).toLocaleTimeString() : '—'}
                      </td>
                    </motion.tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn btn-ghost" style={{ padding: '0.375rem' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn btn-ghost" style={{ padding: '0.375rem' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
