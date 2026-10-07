import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useDashboardStore from '../store/dashboardStore';
import useAlertStore from '../store/alertStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const { addPacket, updateStats, addTrafficPoint, updateProtocols, setTopIPs } = useDashboardStore();
  const { addAlert } = useAlertStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });
    }

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to NetShield server');
    });

    // Real-time packet data (with ML predictions)
    socket.on('packet:new', (packet) => {
      addPacket(packet);
    });

    // Network stats (from real psutil/scapy data)
    socket.on('stats:update', (stats) => {
      updateStats(stats);
    });

    // Real alerts (from ML anomaly detection)
    socket.on('alert:new', (alert) => {
      addAlert(alert);
      // Browser notification for high-severity alerts
      if (Notification.permission === 'granted' && (alert.severity === 'critical' || alert.severity === 'high')) {
        new Notification(`⚠️ ${alert.threatName}`, {
          body: `Severity: ${alert.severity} | ${alert.recommendedAction}`,
          icon: '/shield-icon.png',
        });
      }
    });

    // Real traffic data points for live chart
    socket.on('traffic:update', (point) => {
      addTrafficPoint(point);
    });

    // Real protocol distribution
    socket.on('protocols:update', (protocols) => {
      updateProtocols(protocols);
    });

    // Real top IPs (from actual network connections)
    socket.on('topips:update', ({ sourceIPs, destIPs }) => {
      setTopIPs(sourceIPs, destIPs);
    });

    // ML detection events
    socket.on('detection:new', (detection) => {
      // Detections are also added as packets — no separate handling needed
      console.log(`🔍 Detection: ${detection.category} (${detection.confidence}% confidence)`);
    });

    // Training complete notification
    socket.on('training:complete', (data) => {
      console.log(`✅ Model ${data.model} training complete`, data.metrics);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from NetShield server');
    });

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('packet:new');
        socket.off('stats:update');
        socket.off('alert:new');
        socket.off('traffic:update');
        socket.off('protocols:update');
        socket.off('topips:update');
        socket.off('detection:new');
        socket.off('training:complete');
        socket.off('disconnect');
      }
    };
  }, [isAuthenticated, token]);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { socket: socketRef.current, emit };
}

export default useSocket;
