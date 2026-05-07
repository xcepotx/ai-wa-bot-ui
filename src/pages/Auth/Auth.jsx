import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';
import { Bot, Eye, EyeOff } from 'lucide-react';

function AuthLayout({ children, title, sub }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--brand)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(22,163,74,0.4)',
          }}>
            <Bot size={28} color="#fff" />
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 6 }}>Lapakin Asisten</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{sub}</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{ marginBottom: 24, fontSize: '1.2rem' }}>{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authApi.login(form);
      localStorage.setItem('bot_token', r.data.access_token);
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Masuk ke akun" sub="Kelola Lapakin Asisten kamu">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input
            type="email" required
            placeholder="email@kamu.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'} required
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                padding: 0,
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? <span className="spinner" /> : 'Masuk'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem' }}>
        Belum punya akun?{' '}
        <Link to="/register" style={{ fontWeight: 600 }}>Daftar gratis</Link>
      </p>
    </AuthLayout>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '', name: '', business_name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authApi.register(form);
      localStorage.setItem('bot_token', r.data.access_token);
      toast.success('Akun berhasil dibuat!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Buat akun baru" sub="Mulai pakai Lapakin Asisten gratis">
      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="field">
            <label>Nama kamu</label>
            <input required placeholder="Nama" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Nama usaha</label>
            <input placeholder="Warung Bu Sari" value={form.business_name}
              onChange={e => setForm({ ...form, business_name: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required placeholder="email@kamu.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required placeholder="Minimal 6 karakter" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg"
          disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <span className="spinner" /> : 'Daftar Gratis'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem' }}>
        Sudah punya akun?{' '}
        <Link to="/login" style={{ fontWeight: 600 }}>Masuk</Link>
      </p>
    </AuthLayout>
  );
}
