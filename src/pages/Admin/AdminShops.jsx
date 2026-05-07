import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminShops() {
  const [items, setItems] = useState([]);
  const [source, setSource] = useState('');
  const [q, setQ] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const res = await adminApi.shops({ source, q, limit: 100 });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat shops');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, q]);

  function submit(e) {
    e.preventDefault();
    setQ(queryInput.trim());
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin Monitor</p>
          <h1 style={styles.title}>Shops</h1>
          <p style={styles.subtitle}>Pantau status bot, source toko, dan activity conversation.</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>

      <div style={styles.toolbar}>
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input className="form-input" value={queryInput} onChange={(e) => setQueryInput(e.target.value)} placeholder="Cari shop, WhatsApp, email..." />
          <button className="btn btn-primary" type="submit">Cari</button>
        </form>
        <select className="form-input" value={source} onChange={(e) => setSource(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Semua Source</option>
          <option value="lapakin">Lapakin</option>
          <option value="standalone">Standalone</option>
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        <div style={styles.count}>Total: {total}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Shop</th>
                <th>Source</th>
                <th>Bot</th>
                <th>Mode</th>
                <th>Conversations</th>
                <th>Handoff</th>
                <th>Last Conversation</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.shop_id}>
                  <td>
                    <strong>{x.name || x.shop_id}</strong>
                    <div style={styles.muted}>{x.shop_id}</div>
                    <div style={styles.muted}>{x.whatsapp || x.owner_email || '-'}</div>
                  </td>
                  <td>{x.source || '-'}</td>
                  <td>{x.bot?.enabled ? 'Enabled' : 'Off'}</td>
                  <td><code>{x.bot?.mode || 'off'}</code></td>
                  <td>{x.stats?.conversation_count || 0}</td>
                  <td>{x.stats?.handoff_count || 0}</td>
                  <td>{formatDate(x.stats?.last_conversation_at)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="7" style={styles.empty}>Tidak ada shop.</td></tr>
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
  toolbar: { display: 'flex', gap: 12, marginBottom: 16 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18 },
  count: { color: '#64748b', marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  muted: { color: '#64748b', fontSize: 12, marginTop: 3 },
  error: { background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12, marginBottom: 14 },
  empty: { padding: 20, color: '#64748b', textAlign: 'center' },
};
