import { create } from 'zustand';

const useDashboardStore = create((set, get) => ({
  stats: {
    totalPackets: 0,
    activeConnections: 0,
    incomingTraffic: 0,
    outgoingTraffic: 0,
    packetRate: 0,
    networkSpeed: 0,
    suspiciousSessions: 0,
    alertsCount: 0,
    threatsBlocked: 0,
    devicesOnline: 0,
  },
  
  protocolDistribution: {
    TCP: 0,
    UDP: 0,
    HTTP: 0,
    HTTPS: 0,
    DNS: 0,
    ICMP: 0,
    SSH: 0,
    FTP: 0,
    Other: 0,
  },

  topSourceIPs: [],
  topDestIPs: [],
  recentPackets: [],
  recentAlerts: [],
  trafficHistory: [],
  isSimulating: false,

  updateStats: (newStats) => set((state) => ({
    stats: { ...state.stats, ...newStats },
  })),

  updateProtocols: (protocols) => set({ protocolDistribution: protocols }),

  addPacket: (packet) => set((state) => ({
    recentPackets: [packet, ...state.recentPackets].slice(0, 100),
  })),

  addAlert: (alert) => set((state) => ({
    recentAlerts: [alert, ...state.recentAlerts].slice(0, 50),
  })),

  addTrafficPoint: (point) => set((state) => ({
    trafficHistory: [...state.trafficHistory, point].slice(-60),
  })),

  setTopIPs: (sourceIPs, destIPs) => set({
    topSourceIPs: sourceIPs,
    topDestIPs: destIPs,
  }),

  setSimulating: (isSimulating) => set({ isSimulating }),

  resetStats: () => set({
    stats: {
      totalPackets: 0,
      activeConnections: 0,
      incomingTraffic: 0,
      outgoingTraffic: 0,
      packetRate: 0,
      networkSpeed: 0,
      suspiciousSessions: 0,
      alertsCount: 0,
      threatsBlocked: 0,
      devicesOnline: 0,
    },
    recentPackets: [],
    recentAlerts: [],
    trafficHistory: [],
  }),
}));

export default useDashboardStore;
