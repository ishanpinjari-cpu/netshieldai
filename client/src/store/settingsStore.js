import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      detectionSensitivity: 'medium',
      alertThreshold: 70,
      selectedModel: 'random_forest',
      emailNotifications: true,
      browserNotifications: true,
      dashboardNotifications: true,
      autoRefresh: true,
      refreshInterval: 5000,

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed,
      })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      updateSettings: (settings) => set((state) => ({
        ...state,
        ...settings,
      })),
    }),
    {
      name: 'netshield-settings',
    }
  )
);

export default useSettingsStore;
