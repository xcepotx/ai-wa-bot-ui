import { NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Store, Package, MessageSquare,
  Settings, Bot, LogOut, Zap, Inbox, CheckCircle2, ShieldCheck, UserPlus
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/shop',     icon: Store,           label: 'Profil Toko' },
  { to: '/dashboard/products', icon: Package,         label: 'Produk' },
  { to: '/dashboard/faqs',     icon: MessageSquare,   label: 'Knowledge Asisten' },
  { to: '/dashboard/bot',      icon: Bot,             label: 'Pengaturan Asisten' },
  { to: '/dashboard/simulator',icon: Zap,             label: 'Simulator' },
  { to: '/dashboard/provider-readiness', icon: CheckCircle2, label: 'Provider Checklist' },
  { to: '/dashboard/webchat-leads', icon: UserPlus,        label: 'Webchat Leads' },
  { to: '/dashboard/inbox',    icon: Inbox,           label: 'Inbox' },
];

export default function Sidebar({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('bot_token');
    navigate('/login');
    toast.success('Berhasil logout');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-sidebar)',
      height: '100vh',
      position: 'fixed',
      left: 0, top: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--brand)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1 }}>Lapakin Asisten</div>
            <div style={{ color: 'var(--text-sidebar)', fontSize: '0.7rem', marginTop: 2 }}>Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              marginBottom: 8,
              color: isActive ? '#fff' : 'var(--text-sidebar)',
              background: isActive ? '#2563eb' : 'rgba(37,99,235,0.12)',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
            })}
          >
            <ShieldCheck size={16} />
            Admin Monitor
          </NavLink>
        )}

        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              marginBottom: 2,
              color: isActive ? '#fff' : 'var(--text-sidebar)',
              background: isActive ? 'var(--brand)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--bg-sidebar-hover)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes('brand')) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          marginBottom: 6,
          background: 'rgba(255,255,255,0.04)',
        }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem', marginBottom: 2 }}>
            {user?.name || 'Owner'}
          </div>
          <div style={{ color: 'var(--text-sidebar)', fontSize: '0.72rem' }}>
            {user?.email}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px',
            background: 'transparent', border: 'none',
            color: 'var(--text-sidebar)', borderRadius: 8,
            cursor: 'pointer', fontSize: '0.82rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
