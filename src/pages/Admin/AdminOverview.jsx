import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client';

function StatCard({ label, value, helper }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value ?? 0}</div>
      {helper && <div style={styles.statHelper}>{helper}</div>}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');

    try {
      const res = await adminApi.overview();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat admin overview');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const s = data?.summary || {};

  return (
    <div>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin Monitor</p>
          <h1 style={styles.title}>AI WA Bot Overview</h1>
          <p style={styles.subtitle}>Pantau toko, conversation, handoff, dan activity bot lintas tenant.</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {loading && <div style={styles.empty}>Memuat data admin...</div>}

      {!loading && (
        <>
          <div style={styles.grid}>
            <StatCard label="Users" value={s.total_users} />
            <StatCard label="Shops" value={s.total_shops} helper={`${s.lapakin_shops || 0} Lapakin · ${s.standalone_shops || 0} standalone`} />
            <StatCard label="Bot Enabled" value={s.bot_enabled} />
            <StatCard label="Auto Reply" value={s.auto_reply_active} />
            <StatCard label="Draft Only" value={s.draft_only} />
            <StatCard label="Total Sessions" value={s.total_sessions} />
            <StatCard label="Sessions Today" value={s.sessions_today} />
            <StatCard label="Messages Today" value={s.messages_today} />
            <StatCard label="Handoff Pending" value={s.handoff_pending} />
            <StatCard label="Failed" value={s.failed_conversations} />
          </div>

          <div style={styles.twoCols}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2>Recent Conversations</h2>
                <Link to="/admin/conversations">Lihat semua</Link>
              </div>

              {(data?.recent_conversations || []).length === 0 ? (
                <div style={styles.empty}>Belum ada conversation.</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recent_conversations || []).map((x) => (
                      <tr key={x.session_id}>
                        <td>{x.shop_name || x.shop_id}</td>
                        <td>{x.customer_name || x.customer_phone || '-'}</td>
                        <td>{x.status}</td>
                        <td>{formatDate(x.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2>Top Shops</h2>
                <Link to="/admin/shops">Lihat shops</Link>
              </div>

              {(data?.top_shops || []).length === 0 ? (
                <div style={styles.empty}>Belum ada data toko.</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Conversations</th>
                      <th>Messages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.top_shops || []).map((x) => (
                      <tr key={x.shop_id}>
                        <td>{x.shop_name || x.shop_id}</td>
                        <td>{x.conversation_count}</td>
                        <td>{x.message_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 },
  eyebrow: { margin: 0, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13 },
  title: { margin: '4px 0', fontSize: 30 },
  subtitle: { margin: 0, color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 18 },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 },
  statLabel: { color: '#64748b', fontSize: 13 },
  statValue: { fontSize: 28, fontWeight: 900, marginTop: 5 },
  statHelper: { color: '#64748b', fontSize: 12, marginTop: 4 },
  twoCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  error: { background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12, marginBottom: 14 },
  empty: { padding: 18, color: '#64748b' },
};
