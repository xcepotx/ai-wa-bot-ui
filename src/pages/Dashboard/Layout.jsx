import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { authApi, shopApi } from '../../api/client';

export default function Layout() {
  const [user, setUser]   = useState(null);
  const [shop, setShop]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    authApi.me()
      .then(async r => {
        const currentUser = r.data.user;
        setUser(currentUser);

        if (currentUser?.shop_id) {
          try {
            const shopRes = await shopApi.get();
            setShop(shopRes.data.shop || null);
          } catch (_) {
            setShop(null);
          }
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} shop={shop} />
      <main style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        padding: '32px',
        minHeight: '100vh',
        maxWidth: 'calc(100vw - var(--sidebar-w))',
      }}>
        <Outlet context={{ user, setUser, shop, setShop }} />
      </main>
    </div>
  );
}
