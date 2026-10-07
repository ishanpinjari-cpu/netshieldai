import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useSettingsStore from '../../store/settingsStore';
import useSocket from '../../hooks/useSocket';

export default function AppLayout() {
  const { sidebarCollapsed } = useSettingsStore();

  // Initialize socket connection
  useSocket();

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Animated Cyber Background */}
      <div className="cyber-bg" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <motion.main
        animate={{
          marginLeft: sidebarCollapsed ? 72 : 260,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar />
        <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
