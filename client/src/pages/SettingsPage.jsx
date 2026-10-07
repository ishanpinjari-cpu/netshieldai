import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Cpu, Palette, Save } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import useTheme from '../hooks/useTheme';

export default function SettingsPage() {
  const { detectionSensitivity, alertThreshold, selectedModel, emailNotifications, browserNotifications, dashboardNotifications, updateSettings } = useSettingsStore();
  const { theme, setTheme, isDark } = useTheme();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ icon: Icon, title, children }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Icon size={18} style={{ color: '#00d4ff' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(30,41,59,0.3)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 2,
        background: checked ? 'linear-gradient(135deg, #00d4ff, #0099cc)' : 'rgba(100,116,139,0.3)',
        transition: 'all 200ms ease', position: 'relative',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          transition: 'transform 200ms ease',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Configure your NetShield AI platform</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
          <Save size={15} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <Section icon={Shield} title="Detection Settings">
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', display: 'block' }}>Detection Sensitivity</label>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {['low', 'medium', 'high'].map((s) => (
              <button key={s} onClick={() => updateSettings({ detectionSensitivity: s })} style={{
                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 500,
                background: detectionSensitivity === s ? 'rgba(0,212,255,0.15)' : 'rgba(0,0,0,0.2)',
                color: detectionSensitivity === s ? '#00d4ff' : 'var(--text-muted)',
                border: `1px solid ${detectionSensitivity === s ? 'rgba(0,212,255,0.3)' : 'var(--border-color)'}`,
                cursor: 'pointer', textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', display: 'block' }}>Alert Threshold (Risk Score: {alertThreshold})</label>
          <input type="range" min="10" max="100" value={alertThreshold} onChange={(e) => updateSettings({ alertThreshold: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#00d4ff' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            <span>More Alerts (10)</span><span>Fewer Alerts (100)</span>
          </div>
        </div>
      </Section>

      <Section icon={Cpu} title="AI Model">
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { id: 'isolation_forest', name: 'Isolation Forest' },
            { id: 'random_forest', name: 'Random Forest' },
            { id: 'xgboost', name: 'XGBoost' },
            { id: 'autoencoder', name: 'Autoencoder' },
          ].map((m) => (
            <button key={m.id} onClick={() => updateSettings({ selectedModel: m.id })} style={{
              flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 500,
              background: selectedModel === m.id ? 'rgba(0,212,255,0.15)' : 'rgba(0,0,0,0.2)',
              color: selectedModel === m.id ? '#00d4ff' : 'var(--text-muted)',
              border: `1px solid ${selectedModel === m.id ? 'rgba(0,212,255,0.3)' : 'var(--border-color)'}`,
              cursor: 'pointer', minWidth: 120,
            }}>{m.name}</button>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications">
        <Toggle label="Dashboard Notifications" desc="Show alerts in the dashboard" checked={dashboardNotifications} onChange={(v) => updateSettings({ dashboardNotifications: v })} />
        <Toggle label="Email Alerts" desc="Send critical alerts to your email" checked={emailNotifications} onChange={(v) => updateSettings({ emailNotifications: v })} />
        <Toggle label="Browser Notifications" desc="Push notifications in browser" checked={browserNotifications} onChange={(v) => updateSettings({ browserNotifications: v })} />
      </Section>

      <Section icon={Palette} title="Appearance">
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['dark', 'light'].map((t) => (
            <button key={t} onClick={() => setTheme(t)} style={{
              flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 500,
              background: theme === t ? 'rgba(0,212,255,0.15)' : 'rgba(0,0,0,0.2)',
              color: theme === t ? '#00d4ff' : 'var(--text-muted)',
              border: `1px solid ${theme === t ? 'rgba(0,212,255,0.3)' : 'var(--border-color)'}`,
              cursor: 'pointer', textTransform: 'capitalize',
            }}>{t === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</button>
          ))}
        </div>
      </Section>
    </div>
  );
}
