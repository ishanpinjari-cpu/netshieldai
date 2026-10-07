import express from 'express';
import { protect } from '../middleware/auth.js';
import config from '../config/env.js';

const ML_URL = config.mlServiceUrl || 'http://localhost:8000';

// Helper to proxy requests to ML service
async function proxyToML(path, options = {}) {
  try {
    const res = await fetch(`${ML_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return await res.json();
  } catch {
    return null;
  }
}

// === Packets Router ===
export const packetsRouter = express.Router();
packetsRouter.use(protect);

packetsRouter.get('/', async (req, res) => {
  // Packets come via WebSocket in real-time, but we can also get current connections
  try {
    const data = await proxyToML('/network/connections');
    if (data) {
      return res.json({ packets: data.connections || [], total: data.count || 0, page: 1, pages: 1 });
    }
  } catch {}
  res.json({ packets: [], total: 0, page: 1, pages: 0 });
});

packetsRouter.get('/stats', async (req, res) => {
  try {
    const data = await proxyToML('/network/stats');
    if (data) {
      return res.json({ total: data.total_packets || 0, suspicious: 0 });
    }
  } catch {}
  res.json({ total: 0, suspicious: 0 });
});

// === Alerts Router ===
export const alertsRouter = express.Router();
alertsRouter.use(protect);

// In-memory alert storage (since we may not have MongoDB)
let alertStore = [];

alertsRouter.get('/', (req, res) => {
  const { severity, status, page = 1, limit = 50 } = req.query;
  let filtered = [...alertStore];
  if (severity) filtered = filtered.filter(a => a.severity === severity);
  if (status === 'active') filtered = filtered.filter(a => !a.resolved);
  if (status === 'resolved') filtered = filtered.filter(a => a.resolved);

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  res.json({ alerts: paginated, total: filtered.length });
});

alertsRouter.get('/stats', (req, res) => {
  const stats = {};
  alertStore.forEach(a => {
    stats[a.severity] = (stats[a.severity] || 0) + 1;
  });
  res.json(Object.entries(stats).map(([_id, count]) => ({ _id, count })));
});

alertsRouter.put('/:id', (req, res) => {
  const idx = alertStore.findIndex(a => a._id === req.params.id);
  if (idx !== -1) {
    alertStore[idx] = { ...alertStore[idx], ...req.body };
    return res.json(alertStore[idx]);
  }
  res.status(404).json({ message: 'Alert not found' });
});

alertsRouter.delete('/:id', (req, res) => {
  alertStore = alertStore.filter(a => a._id !== req.params.id);
  res.json({ message: 'Alert deleted' });
});

// Function to add alerts from WebSocket relay
export function addAlert(alert) {
  alertStore.unshift(alert);
  if (alertStore.length > 500) alertStore = alertStore.slice(0, 500);
}

// === Devices Router ===
export const devicesRouter = express.Router();
devicesRouter.use(protect);

devicesRouter.get('/', async (req, res) => {
  try {
    const data = await proxyToML('/network/connections');
    if (data && data.connections) {
      // Group connections by destination IP as "devices"
      const deviceMap = {};
      data.connections.forEach(conn => {
        const key = conn.dst_ip;
        if (!deviceMap[key]) {
          deviceMap[key] = {
            _id: key,
            name: key,
            ip: key,
            type: 'endpoint',
            online: true,
            lastSeen: conn.timestamp,
            connections: 0,
          };
        }
        deviceMap[key].connections++;
      });
      return res.json(Object.values(deviceMap));
    }
  } catch {}
  res.json([]);
});

devicesRouter.get('/stats', async (req, res) => {
  try {
    const data = await proxyToML('/network/stats');
    if (data) {
      return res.json({
        total: data.unique_dst_ips || 0,
        online: data.active_connections || 0,
      });
    }
  } catch {}
  res.json({ total: 0, online: 0 });
});

// === Threats Router ===
export const threatsRouter = express.Router();
threatsRouter.use(protect);

threatsRouter.get('/', (req, res) => {
  // Return detected threat categories from alerts
  const threatMap = {};
  alertStore.forEach(a => {
    if (!threatMap[a.threatName]) {
      threatMap[a.threatName] = {
        _id: a.threatName,
        name: a.threatName,
        category: a.threatName,
        severity: a.severity,
        count: 0,
        lastSeen: a.time,
        description: `${a.threatName} detected from network traffic analysis`,
      };
    }
    threatMap[a.threatName].count++;
  });
  res.json(Object.values(threatMap));
});

threatsRouter.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const results = alertStore.filter(a =>
    a.threatName?.toLowerCase().includes(q.toLowerCase()) ||
    a.srcIP?.includes(q) || a.dstIP?.includes(q)
  );
  res.json(results);
});

// === Logs Router ===
export const logsRouter = express.Router();
logsRouter.use(protect);

let logStore = [];

export function addLog(log) {
  logStore.unshift(log);
  if (logStore.length > 1000) logStore = logStore.slice(0, 1000);
}

logsRouter.get('/', (req, res) => {
  const { type, page = 1, limit = 100 } = req.query;
  let filtered = [...logStore];
  if (type) filtered = filtered.filter(l => l.type === type);

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  res.json({ logs: paginated, total: filtered.length });
});

logsRouter.get('/export/:format', (req, res) => {
  const { format } = req.params;
  if (format === 'csv') {
    const csv = [
      'Type,Message,IP,Timestamp',
      ...logStore.map(l => `${l.type},"${l.message}",${l.ip || ''},${l.timestamp || ''}`)
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=netshield-logs.csv');
    return res.send(csv);
  }
  res.json(logStore);
});

// === Analytics Router ===
export const analyticsRouter = express.Router();
analyticsRouter.use(protect);

analyticsRouter.get('/traffic', async (req, res) => {
  try {
    const data = await proxyToML('/network/stats');
    if (data) {
      // Generate hourly data from current stats
      const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        incoming: Math.max(0, data.bytes_recv_per_sec ? Math.round(data.bytes_recv_per_sec / 1024) : 0),
        outgoing: Math.max(0, data.bytes_sent_per_sec ? Math.round(data.bytes_sent_per_sec / 1024) : 0),
      }));
      return res.json(hours);
    }
  } catch {}
  res.json([]);
});

analyticsRouter.get('/protocol-distribution', async (req, res) => {
  try {
    const data = await proxyToML('/network/stats');
    if (data && data.protocol_distribution) {
      const dist = Object.entries(data.protocol_distribution).map(([_id, count]) => ({ _id, count }));
      return res.json(dist);
    }
  } catch {}
  res.json([]);
});

analyticsRouter.get('/heatmap', (req, res) => {
  // Real heatmap would need historical data storage
  const data = Array.from({ length: 168 }, () => 0);
  res.json(data);
});

analyticsRouter.get('/attack-frequency', (req, res) => {
  // Count from real alerts
  const freq = {};
  alertStore.forEach(a => {
    const type = a.threatName || 'Unknown';
    freq[type] = (freq[type] || 0) + 1;
  });
  const result = Object.entries(freq)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  res.json(result);
});

// === Settings Router ===
export const settingsRouter = express.Router();
settingsRouter.use(protect);

let settingsStore = {};

settingsRouter.get('/', (req, res) => {
  res.json(settingsStore);
});

settingsRouter.put('/', (req, res) => {
  settingsStore = { ...settingsStore, ...req.body };
  res.json(settingsStore);
});

// === ML Router (proxies to Python ML service) ===
export const mlRouter = express.Router();
mlRouter.use(protect);

mlRouter.post('/predict', async (req, res) => {
  const data = await proxyToML('/predict', {
    method: 'POST',
    body: JSON.stringify(req.body),
  });
  if (data) return res.json(data);
  res.status(503).json({ error: 'ML service unavailable' });
});

mlRouter.get('/models', async (req, res) => {
  const data = await proxyToML('/models');
  if (data) return res.json(data);
  res.status(503).json({ error: 'ML service unavailable' });
});

mlRouter.get('/insights', async (req, res) => {
  const data = await proxyToML('/insights');
  if (data) return res.json(data);
  res.json([]);
});

mlRouter.post('/simulate', async (req, res) => {
  const data = await proxyToML('/simulate', {
    method: 'POST',
    body: JSON.stringify(req.body),
  });
  if (data) return res.json(data);
  res.status(503).json({ error: 'ML service unavailable' });
});

mlRouter.post('/train', async (req, res) => {
  const data = await proxyToML('/train', {
    method: 'POST',
    body: JSON.stringify(req.body),
  });
  if (data) return res.json(data);
  res.status(503).json({ error: 'ML service unavailable' });
});

mlRouter.get('/metrics/:model', async (req, res) => {
  const data = await proxyToML(`/metrics/${req.params.model}`);
  if (data) return res.json(data);
  res.status(503).json({ error: 'ML service unavailable' });
});

mlRouter.get('/train/progress/:model', async (req, res) => {
  const data = await proxyToML(`/train/progress/${req.params.model}`);
  if (data) return res.json(data);
  res.json({ status: 'unknown', progress: 0 });
});
