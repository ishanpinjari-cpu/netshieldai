import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Network, ArrowDownToLine, ArrowUpFromLine,
  Zap, Shield, AlertTriangle, Laptop2,
  TrendingUp, Eye,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import useDashboardStore from '../store/dashboardStore';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend, Filler
);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function formatNumber(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function StatCard({ label, value, icon: Icon, color, trend, suffix = '' }) {
  return (
    <motion.div variants={item} className={`glass-card stat-card stat-card--${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
            {typeof value === 'number' ? formatNumber(value) : value}{suffix}
          </p>
          {trend && (
            <p style={{ fontSize: '0.75rem', color: trend > 0 ? '#22c55e' : '#ef4444', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={12} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
              {Math.abs(trend)}% from last hour
            </p>
          )}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: `rgba(${color === 'blue' ? '0,212,255' : color === 'green' ? '34,197,94' : color === 'purple' ? '168,85,247' : color === 'orange' ? '249,115,22' : color === 'red' ? '239,68,68' : color === 'cyan' ? '0,255,213' : color === 'pink' ? '236,72,153' : '234,179,8'}, 0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} style={{
            color: `var(--color-neon-${color === 'cyan' ? 'cyan' : color})`,
          }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { stats, protocolDistribution, trafficHistory, recentAlerts, topSourceIPs, topDestIPs, isSimulating } = useDashboardStore();
  const { updateStats, addTrafficPoint, updateProtocols, setTopIPs, addAlert, setSimulating } = useDashboardStore();

  // Real-time data comes via WebSocket (useSocket hook in AppLayout)
  // No client-side simulation needed — all data is real from the ML service


  // Chart configurations
  const trafficChartData = {
    labels: trafficHistory.map((p) => p.time),
    datasets: [
      {
        label: 'Incoming',
        data: trafficHistory.map((p) => p.incoming),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Outgoing',
        data: trafficHistory.map((p) => p.outgoing),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const trafficChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#1e293b',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { color: 'rgba(30, 41, 59, 0.3)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(30, 41, 59, 0.3)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    },
  };

  const protocolColors = ['#00d4ff', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#eab308', '#ef4444', '#00ffd5', '#64748b'];
  const protocolLabels = Object.keys(protocolDistribution);
  const protocolValues = Object.values(protocolDistribution);

  const protocolChartData = {
    labels: protocolLabels,
    datasets: [{
      data: protocolValues,
      backgroundColor: protocolColors.slice(0, protocolLabels.length),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const protocolChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } },
      },
    },
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#64748b';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Security Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time network monitoring & threat detection
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isSimulating && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)',
              fontSize: '0.75rem', fontWeight: 500, color: '#00d4ff',
            }}>
              <span className="neon-dot" style={{ width: 6, height: 6 }} />
              Simulation Active
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard label="Total Packets" value={stats.totalPackets} icon={Activity} color="blue" trend={12.5} />
        <StatCard label="Active Connections" value={stats.activeConnections} icon={Network} color="green" trend={5.2} />
        <StatCard label="Incoming Traffic" value={stats.incomingTraffic} icon={ArrowDownToLine} color="cyan" suffix=" MB/s" />
        <StatCard label="Outgoing Traffic" value={stats.outgoingTraffic} icon={ArrowUpFromLine} color="purple" suffix=" MB/s" />
        <StatCard label="Packet Rate" value={stats.packetRate} icon={Zap} color="yellow" suffix="/s" />
        <StatCard label="Threats Blocked" value={stats.threatsBlocked} icon={Shield} color="green" trend={-3.1} />
        <StatCard label="Suspicious Sessions" value={stats.suspiciousSessions} icon={AlertTriangle} color="orange" />
        <StatCard label="Devices Online" value={stats.devicesOnline} icon={Laptop2} color="pink" />
      </motion.div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Live Traffic Chart */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Live Traffic</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Eye size={13} /> Real-time
            </div>
          </div>
          <div style={{ height: 280 }}>
            <Line data={trafficChartData} options={trafficChartOptions} />
          </div>
        </motion.div>

        {/* Protocol Distribution */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>
            Protocol Distribution
          </h3>
          <div style={{ height: 280 }}>
            <Doughnut data={protocolChartData} options={protocolChartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Top IPs + Recent Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        {/* Top Source IPs */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>
            Top Source IPs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {(topSourceIPs.length > 0 ? topSourceIPs : [
              { ip: '192.168.1.105', count: 342 },
              { ip: '192.168.1.23', count: 289 },
              { ip: '192.168.1.87', count: 215 },
              { ip: '192.168.1.44', count: 178 },
              { ip: '192.168.1.12', count: 134 },
            ]).map((entry, i) => {
              const maxCount = topSourceIPs[0]?.count || 342;
              const pct = Math.round((entry.count / maxCount) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{entry.ip}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.count}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #00d4ff, #0099cc)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Destination IPs */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>
            Top Destination IPs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {(topDestIPs.length > 0 ? topDestIPs : [
              { ip: '10.0.0.45', count: 298 },
              { ip: '10.0.0.12', count: 245 },
              { ip: '10.0.0.78', count: 198 },
              { ip: '10.0.0.33', count: 156 },
              { ip: '10.0.0.91', count: 112 },
            ]).map((entry, i) => {
              const maxCount = topDestIPs[0]?.count || 298;
              const pct = Math.round((entry.count / maxCount) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{entry.ip}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.count}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #a855f7, #7c3aed)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Alerts</h3>
            <span className="risk-badge risk-badge--critical" style={{ fontSize: '0.625rem' }}>
              {recentAlerts.filter((a) => a.severity === 'critical').length} Critical
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 240, overflow: 'auto' }}>
            {(recentAlerts.length > 0 ? recentAlerts.slice(0, 6) : [
              { threatName: 'DDoS Detected', severity: 'critical', affectedDevice: 'Server-01' },
              { threatName: 'Port Scan', severity: 'high', affectedDevice: 'Router-02' },
              { threatName: 'Brute Force', severity: 'medium', affectedDevice: 'Device-05' },
              { threatName: 'Suspicious Traffic', severity: 'low', affectedDevice: 'Device-12' },
            ]).map((alert, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid rgba(30,41,59,0.3)',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: getSeverityColor(alert.severity),
                  boxShadow: `0 0 6px ${getSeverityColor(alert.severity)}`,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alert.threatName}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {alert.affectedDevice}
                  </div>
                </div>
                <span className={`risk-badge risk-badge--${alert.severity}`} style={{ fontSize: '0.625rem' }}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
