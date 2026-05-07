import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminConversations() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const res = await adminApi.conversations({ status, q, limit: 100 });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat conversations');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const stats = useMemo(() => ({
    handoff: items.filter((x) => x.status === 'handoff' || x.handoff_required).length,
    resolved: items.filter((x) => x.status === 'resolved').length,
    active: items.filter((x) => x.status !== 'resolved').length,
  }), [items]);

  function submit(e) {
    e.preventDefault();
    setQ(queryInput.trim());
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin Monitor</p>
          <h1 style={styles.title}>Conversations</h1>
          <p style={styles.subtitle}>Pantau semua conversation lintas toko.</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><span>Total</span><strong>{total}</strong></div>
        <div style={styles.statCard}><span>Aktif</span><strong>{stats.active}</strong></div>
        <div style={styles.statCard}><span>Handoff</span><strong>{stats.handoff}</strong></div>
        <div style={styles.statCard}><span>Resolved</span><strong>{stats.resolved}</strong></div>
      </div>

      <div style={styles.toolbar}>
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input className="form-input" value={queryInput} onChange={(e) => setQueryInput(e.target.value)} placeholder="Cari customer, shop, pesan..." />
          <button className="btn btn-primary" type="submit">Cari</button>
        </form>
        <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Semua Status</option>
          <option value="bot_replied">Dijawab Bot</option>
          <option value="handoff">Handoff</option>
          <option value="resolved">Resolved</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Shop</th>
                <th>Customer</th>
                <th>Last Message</th>
                <th>Intent</th>
                <th>Status</th>
                <th>Update</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.session_id}>
                  <td>
                    <strong>{x.shop_name || x.shop_id}</strong>
                    <div style={styles.muted}>{x.shop_source || '-'} · {x.shop_id}</div>
                  </td>
                  <td>
                    <strong>{x.customer_name || '-'}</strong>
                    <div style={styles.muted}>{x.customer_phone || '-'}</div>
                  </td>
                  <td>{x.last_message || '-'}</td>
                  <td><code>{x.last_intent || '-'}</code></td>
                  <td>{x.status}</td>
                  <td>{formatDate(x.updated_at)}</td>
                  <td><Link className="btn btn-secondary" to={`/admin/conversations/${x.session_id}`}>Buka</Link></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="7" style={styles.empty}>Tidak ada conversation.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 },
  eyebrow: { margin: 0, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13 },
  title: { margin: '4px 0', fontSize: 30 },
  subtitle: { margin: 0, color: '#64748b' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'grid', gap: 6 },
  toolbar: { display: 'flex', gap: 12, marginBottom: 16 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  muted: { color: '#64748b', fontSize: 12, marginTop: 3 },
  error: { background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12, marginBottom: 14 },
  empty: { padding: 20, color: '#64748b', textAlign: 'center' },
};
