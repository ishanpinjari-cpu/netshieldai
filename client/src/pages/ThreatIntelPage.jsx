import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, ExternalLink, BookOpen } from 'lucide-react';

const threatDB = [
  { id: 1, type: 'DDoS Attack', description: 'Distributed Denial of Service attack overwhelms target with traffic from multiple sources.', mitre: 'T1498 - Network Denial of Service', mitigation: 'Implement rate limiting, use CDN/DDoS protection services, configure firewall rules.', prevention: 'Deploy traffic scrubbing, implement anycast routing, use load balancers.', severity: 'critical' },
  { id: 2, type: 'Port Scanning', description: 'Systematic scanning of network ports to identify open services and potential vulnerabilities.', mitre: 'T1046 - Network Service Discovery', mitigation: 'Monitor for scan patterns, implement port knocking, use IDS/IPS systems.', prevention: 'Close unnecessary ports, use firewalls, implement network segmentation.', severity: 'medium' },
  { id: 3, type: 'Brute Force', description: 'Automated attempts to guess credentials through exhaustive trial of possible combinations.', mitre: 'T1110 - Brute Force', mitigation: 'Implement account lockout policies, use CAPTCHA, enable MFA.', prevention: 'Enforce strong password policies, use key-based auth, implement rate limiting.', severity: 'high' },
  { id: 4, type: 'Malware Communication', description: 'Detected traffic patterns matching known malware command and control (C2) communication.', mitre: 'T1071 - Application Layer Protocol', mitigation: 'Block known C2 IPs/domains, isolate infected systems, run AV scans.', prevention: 'Keep systems updated, use endpoint protection, implement DNS filtering.', severity: 'critical' },
  { id: 5, type: 'Data Exfiltration', description: 'Unauthorized transfer of data from internal network to external destination.', mitre: 'T1041 - Exfiltration Over C2 Channel', mitigation: 'Monitor outbound traffic, implement DLP solutions, block suspicious transfers.', prevention: 'Classify sensitive data, restrict access, encrypt data at rest.', severity: 'critical' },
  { id: 6, type: 'Botnet Activity', description: 'Compromised devices participating in a botnet for coordinated malicious activities.', mitre: 'T1583.005 - Botnet', mitigation: 'Identify and isolate compromised hosts, clean infected systems.', prevention: 'Update firmware/software, segment IoT devices, monitor for anomalies.', severity: 'high' },
  { id: 7, type: 'SQL Injection', description: 'Attempt to inject malicious SQL queries through application input fields.', mitre: 'T1190 - Exploit Public-Facing Application', mitigation: 'Use parameterized queries, input validation, WAF deployment.', prevention: 'Code reviews, security testing, prepared statements.', severity: 'high' },
  { id: 8, type: 'Man-in-the-Middle', description: 'Interception of communication between two parties to eavesdrop or modify data.', mitre: 'T1557 - Adversary-in-the-Middle', mitigation: 'Use encrypted protocols (TLS/SSL), implement certificate pinning.', prevention: 'Deploy HSTS, use VPNs, implement mutual TLS authentication.', severity: 'critical' },
  { id: 9, type: 'Phishing', description: 'Social engineering attack using deceptive communications to steal credentials or deploy malware.', mitre: 'T1566 - Phishing', mitigation: 'User awareness training, email filtering, suspicious URL blocking.', prevention: 'Email authentication (DMARC/SPF), MFA, security awareness programs.', severity: 'high' },
  { id: 10, type: 'Privilege Escalation', description: 'Exploitation of vulnerabilities to gain elevated access privileges on a system.', mitre: 'T1068 - Exploitation for Privilege Escalation', mitigation: 'Patch systems, monitor for anomalous privilege changes, audit access logs.', prevention: 'Principle of least privilege, regular patching, endpoint detection.', severity: 'critical' },
];

export default function ThreatIntelPage() {
  const [search, setSearch] = useState('');
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = threatDB.filter((t) => {
    if (severityFilter !== 'all' && t.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.type.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.mitre.toLowerCase().includes(q);
    }
    return true;
  });

  const getSevColor = (s) => ({ critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[s]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Threat Intelligence</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>MITRE ATT&CK mapped threat database</p>
      </div>

      {/* Search + Filters */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search threats, MITRE techniques..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', height: 36, fontSize: '0.8125rem' }} />
        </div>
        {['all', 'critical', 'high', 'medium'].map((s) => (
          <button key={s} onClick={() => setSeverityFilter(s)} style={{
            padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500,
            background: severityFilter === s ? (s === 'all' ? 'rgba(0,212,255,0.1)' : `${getSevColor(s)}20`) : 'transparent',
            color: severityFilter === s ? (s === 'all' ? '#00d4ff' : getSevColor(s)) : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedThreat ? '1fr 1fr' : '1fr', gap: '1rem' }}>
        {/* Threat List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((threat, i) => (
            <motion.div key={threat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedThreat(threat)} className="glass-card" style={{
                padding: '1rem', cursor: 'pointer',
                borderColor: selectedThreat?.id === threat.id ? getSevColor(threat.severity) : 'var(--border-color)',
                boxShadow: selectedThreat?.id === threat.id ? `0 0 12px ${getSevColor(threat.severity)}30` : 'none',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Shield size={18} style={{ color: getSevColor(threat.severity), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{threat.type}</span>
                    <span className={`risk-badge risk-badge--${threat.severity}`} style={{ fontSize: '0.5625rem' }}>{threat.severity}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{threat.mitre}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedThreat && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '1.5rem', alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: `${getSevColor(selectedThreat.severity)}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={20} style={{ color: getSevColor(selectedThreat.severity) }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{selectedThreat.type}</h3>
                <span className={`risk-badge risk-badge--${selectedThreat.severity}`} style={{ fontSize: '0.625rem' }}>{selectedThreat.severity}</span>
              </div>
            </div>

            {[
              { label: 'Description', content: selectedThreat.description },
              { label: 'MITRE ATT&CK', content: selectedThreat.mitre },
              { label: 'Mitigation', content: selectedThreat.mitigation },
              { label: 'Prevention', content: selectedThreat.prevention },
            ].map(({ label, content }) => (
              <div key={label} style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{label}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{content}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
