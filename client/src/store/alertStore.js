import { create } from 'zustand';

const useAlertStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,
  filter: 'all',

  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts],
    unreadCount: state.unreadCount + 1,
  })),

  markAsRead: (alertId) => set((state) => ({
    alerts: state.alerts.map((a) =>
      a._id === alertId ? { ...a, read: true } : a
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllAsRead: () => set((state) => ({
    alerts: state.alerts.map((a) => ({ ...a, read: true })),
    unreadCount: 0,
  })),

  dismissAlert: (alertId) => set((state) => ({
    alerts: state.alerts.filter((a) => a._id !== alertId),
  })),

  setFilter: (filter) => set({ filter }),

  getFilteredAlerts: () => {
    const { alerts, filter } = get();
    if (filter === 'all') return alerts;
    if (filter === 'unread') return alerts.filter((a) => !a.read);
    return alerts.filter((a) => a.severity === filter);
  },
}));

export default useAlertStore;
