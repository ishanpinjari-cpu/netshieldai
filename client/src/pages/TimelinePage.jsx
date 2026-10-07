import { motion } from 'framer-motion';
import { Clock, Shield, AlertTriangle, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';

const timelineEvents = [
  { id: 1, time: '18:15:42', event: 'DDoS attack detected from 192.168.1.105', prediction: 'DDoS Attack', riskScore: 95, status: 'active', severity: 'critical' },
  { id: 2, time: '18:12:18', event: 'Unusual outbound traffic spike on port 443', prediction: 'Data Exfiltration', riskScore: 78, status: 'investigating', severity: 'high' },
  { id: 3, time: '18:08:55', event: 'Multiple failed SSH login attempts', prediction: 'Brute Force', riskScore: 72, status: 'mitigated', severity: 'high' },
  { id: 4, time: '17:55:30', event: 'New device connected: IoT-Camera-02', prediction: 'Normal', riskScore: 15, status: 'resolved', severity: 'low' },
  { id: 5, time: '17:45:12', event: 'Port scan detected from external IP 45.33.22.11', prediction: 'Port Scanning', riskScore: 65, status: 'mitigated', severity: 'medium' },
  { id: 6, time: '17:30:44', event: 'Malware signature detected in HTTP payload', prediction: 'Malware Communication', riskScore: 88, status: 'resolved', severity: 'critical' },
  { id: 7, time: '17:20:08', event: 'ARP spoofing attempt detected on VLAN 10', prediction: 'Man-in-the-Middle', riskScore: 82, status: 'investigating', severity: 'critical' },
  { id: 8, time: '17:10:33', event: 'DNS query to known malicious domain', prediction: 'Botnet Activity', riskScore: 70, status: 'mitigated', severity: 'high' },
  { id: 9, time: '16:55:19', event: 'Firewall rule updated: Block port 445', prediction: 'Normal', riskScore: 5, status: 'resolved', severity: 'low' },
  { id: 10, time: '16:40:22', event: 'SSL certificate about to expire on web-server', prediction: 'Normal', riskScore: 25, status: 'active', severity: 'medium' },
  { id: 11, time: '16:25:44', event: 'Unusual ICMP flood detected', prediction: 'DDoS Attack', riskScore: 60, status: 'mitigated', severity: 'medium' },
  { id: 12, time: '16:10:15', event: 'User admin logged in from new location', prediction: 'Suspicious', riskScore: 45, status: 'resolved', severity: 'medium' },
];

const statusConfig = {
  active: { color: '#ef4444', icon: AlertTriangle, label: 'Active' },
  investigating: { color: '#f97316', icon: BrainCircuit, label: 'Investigating' },
  mitigated: { color: '#eab308', icon: Shield, label: 'Mitigated' },
  resolved: { color: '#22c55e', icon: CheckCircle, label: 'Resolved' },
};

const getRiskColor = (score) => score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#22c55e';

export default function TimelinePage() {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Attack Timeline</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chronological view of security events</p>
      </div>

      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Vertical Line */}
        <div style={{ position: 'absolute', left: '0.9375rem', top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--color-neon-blue), transparent)', borderRadius: 1 }} />

        {timelineEvents.map((evt, i) => {
          const StatusIcon = statusConfig[evt.status]?.icon || CheckCircle;
          const statusColor = statusConfig[evt.status]?.color || '#64748b';
          const statusLabel = statusConfig[evt.status]?.label || evt.status;

          return (
            <motion.div key={evt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ position: 'relative', marginBottom: '1rem' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-2rem', top: '1.25rem',
                width: 12, height: 12, borderRadius: '50%',
                background: statusColor, boxShadow: `0 0 8px ${statusColor}`,
                transform: 'translateX(-50%)', zIndex: 1,
                marginLeft: '0.9375rem',
              }} />

              <div className="glass-card" style={{ padding: '1rem 1.25rem', marginLeft: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{evt.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`risk-badge risk-badge--${evt.severity}`} style={{ fontSize: '0.5625rem' }}>{evt.severity}</span>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)',
                      background: `${statusColor}15`, color: statusColor, fontSize: '0.6875rem', fontWeight: 500,
                    }}>
                      <StatusIcon size={11} /> {statusLabel}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>{evt.event}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <BrainCircuit size={12} style={{ color: '#a855f7' }} />
                    <span style={{ color: 'var(--text-muted)' }}>AI:</span>
                    <span style={{ color: evt.prediction === 'Normal' ? '#22c55e' : '#f97316', fontWeight: 500 }}>{evt.prediction}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Risk:</span>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ width: `${evt.riskScore}%`, height: '100%', borderRadius: 2, background: getRiskColor(evt.riskScore) }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', color: getRiskColor(evt.riskScore), fontWeight: 600 }}>{evt.riskScore}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
