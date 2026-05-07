import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Store, MessageSquare, LayoutDashboard, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/client';

const NAV = [
  { to: '/admin', icon: BarChart3, label: 'Admin Overview', end: true },
  { to: '/admin/shops', icon: Store, label: 'Shops' },
  { to: '/admin/conversations', icon: MessageSquare, label: 'Conversations' },
];

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authApi.me()
      .then((res) => {
        const u = res.data.user;
        setUser(u);
        if (u?.role !== 'admin') {
          setDenied(true);
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function logout() {
    try {
      await authApi.logout();
    } catch (_) {}
    localStorage.removeItem('bot_token');
    navigate('/login');
    toast.success('Berhasil logout');
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <div className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (denied) {
    return (
      <div style={styles.center}>
        <div style={styles.deniedCard}>
          <h1>Admin only</h1>
          <p>Akun ini belum memiliki role admin.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navItems = user?.shop_id
    ? [
        ...NAV,
        {
          to: '/dashboard',
          icon: LayoutDashboard,
          label: 'My Shop Dashboard',
        },
      ]
    : NAV;

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>⚙️</div>
          <div>
            <div style={styles.brandTitle}>AI WA Bot</div>
            <div style={styles.brandSub}>Admin Monitor</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                ...styles.navLink,
                background: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#fff' : '#cbd5e1',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.userBox}>
          <div style={styles.userName}>{user?.name || 'Admin'}</div>
          <div style={styles.userEmail}>{user?.email}</div>
          <button style={styles.logoutButton} onClick={logout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
  },
  sidebar: {
    width: 248,
    background: '#0f172a',
    color: '#fff',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  brand: {
    padding: 20,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontWeight: 900,
    lineHeight: 1,
  },
  brandSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },
  nav: {
    flex: 1,
    padding: 12,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    textDecoration: 'none',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 700,
  },
  userBox: {
    padding: 14,
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  userName: {
    fontWeight: 800,
    fontSize: 14,
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 10,
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    border: 0,
    background: 'rgba(255,255,255,0.06)',
    color: '#cbd5e1',
    borderRadius: 10,
    padding: '9px 10px',
    cursor: 'pointer',
  },
  main: {
    marginLeft: 248,
    flex: 1,
    padding: 28,
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 28,
    textAlign: 'center',
  },
};
