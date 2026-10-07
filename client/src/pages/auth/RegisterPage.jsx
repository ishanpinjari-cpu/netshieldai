import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, setLoading, setError, isLoading, error } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-bg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 420, padding: '1.5rem', position: 'relative', zIndex: 1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <div
            style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
            }}
          >
            <ShieldCheck size={28} color="#0a0e1a" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Join NetShield AI Security Platform
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="glass"
          style={{ padding: '2rem' }}
        >
          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {[
            { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe' },
            { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'john@example.com' },
          ].map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <Icon size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={type} className="input" placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ paddingLeft: '2.5rem' }} required />
              </div>
            </div>
          ))}

          {['password', 'confirmPassword'].map((key) => (
            <div key={key} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                {key === 'password' ? 'Password' : 'Confirm Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} className="input" placeholder={key === 'password' ? 'Create a password' : 'Confirm your password'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }} required />
                {key === 'password' && (
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', height: '42px', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {isLoading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : (<>Create Account <ArrowRight size={16} /></>)}
          </button>
        </motion.form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-neon-blue)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
