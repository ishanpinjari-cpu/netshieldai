import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import useDashboardStore from '../store/dashboardStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function AnalyticsPage() {
  const { protocolDistribution, trafficHistory, recentAlerts } = useDashboardStore();
  const [attackFreq, setAttackFreq] = useState([]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/analytics/attack-frequency');
        if (res.data) setAttackFreq(res.data);
      } catch {}
    }
    fetchAnalytics();
  }, []);

  const trafficChartData = {
    labels: trafficHistory.length > 0 ? trafficHistory.map(p => p.time) : hours.slice(0, 10),
    datasets: [
      { label: 'Incoming (KB/s)', data: trafficHistory.length > 0 ? trafficHistory.map(p => p.incoming) : Array(10).fill(0), borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', fill: true, tension: 0.4, pointRadius: 2 },
      { label: 'Outgoing (KB/s)', data: trafficHistory.length > 0 ? trafficHistory.map(p => p.outgoing) : Array(10).fill(0), borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4, pointRadius: 2 },
    ],
  };

  const protocolLabels = Object.keys(protocolDistribution).length > 0 ? Object.keys(protocolDistribution) : ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS'];
  const protocolValues = Object.keys(protocolDistribution).length > 0 ? Object.values(protocolDistribution) : [10, 5, 8, 12, 4];

  const protocolData = {
    labels: protocolLabels,
    datasets: [{
      data: protocolValues,
      backgroundColor: ['#00d4ff', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#eab308', '#ef4444', '#00ffd5'],
      borderWidth: 0,
    }],
  };

  const attackFreqData = {
    labels: attackFreq.length > 0 ? attackFreq.map(a => a.type) : ['DDoS', 'Port Scan', 'Brute Force', 'Malware', 'Botnet'],
    datasets: [{
      label: 'Count',
      data: attackFreq.length > 0 ? attackFreq.map(a => a.count) : [0, 0, 0, 0, 0],
      backgroundColor: ['#ef4444', '#00d4ff', '#a855f7', '#f97316', '#ec4899'],
      borderRadius: 4,
    }],
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Analytics Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Comprehensive traffic & threat analytics from real packet capture</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Real-time Traffic Volume</h3>
          <div style={{ height: 260 }}>
            <Line data={trafficChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(30,41,59,0.3)' } }, y: { grid: { color: 'rgba(30,41,59,0.3)' } } } }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Protocol Breakdown</h3>
          <div style={{ height: 260 }}>
            <Doughnut data={protocolData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Detected Threat Frequency</h3>
        <div style={{ height: 220 }}>
          <Bar data={attackFreqData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </motion.div>
    </div>
  );
}
