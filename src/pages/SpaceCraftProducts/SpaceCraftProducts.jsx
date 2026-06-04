import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { spacecraftApi } from '../../api/client';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) {
    return value;
  }
}

function moneyLabel(product) {
  if (product.price_label) return product.price_label;
  if (product.price) return `Rp ${Number(product.price).toLocaleString('id-ID')}`;
  return 'Harga konfirmasi admin';
}

function statusBadge(status) {
  const isActive = status === 'active';
  return (
    <span style={{
      ...styles.badge,
      background: isActive ? '#dcfce7' : '#f1f5f9',
      color: isActive ? '#15803d' : '#475569',
    }}>
      {status || 'unknown'}
    </span>
  );
}

function eventLabel(type) {
  const map = {
    'spacecraft.products_synced': 'Sync Success',
    'spacecraft.products_sync_failed': 'Sync Failed',
    'owner.spacecraft.products_sync_triggered': 'Manual Trigger',
  };
  return map[type] || type;
}

export default function SpaceCraftProducts() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('active');
  const [priceFilter, setPriceFilter] = useState('all');
  const [q, setQ] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [productsRes, historyRes] = await Promise.all([
        spacecraftApi.products({ status, price_filter: priceFilter, q, limit: 200 }),
        spacecraftApi.syncHistory({ limit: 20 }),
      ]);
      setItems(productsRes.data.items || []);
      setSummary(productsRes.data.summary || {});
      setHistory(historyRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat produk sync');
    } finally {
      setLoading(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setError('');
    try {
      const res = await spacecraftApi.syncProducts();
      toast.success(`Sync sukses: ${res.data?.seen || 0} produk`);
      await load();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Sync gagal';
      setError(msg);
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  }

  function submitSearch(e) {
    e.preventDefault();
    setQ(queryInput.trim());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priceFilter, q]);

  const latestEvent = history[0];
  const activeRatio = useMemo(() => {
    const total = summary.total_products || 0;
    if (!total) return '-';
    return `${summary.active_products || 0}/${total}`;
  }, [summary]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>SpaceCraft Catalog</p>
          <h1 style={styles.title}>Synced Products</h1>
          <p style={styles.subtitle}>Produk SpaceCraft yang sedang dibaca Wabot untuk menjawab chat pelanggan.</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshButton} onClick={load} disabled={loading}>
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
          <button style={styles.primaryButton} onClick={syncNow} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Products'}
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><span>Total Produk</span><strong>{summary.total_products ?? '-'}</strong></div>
        <div style={styles.statCard}><span>Aktif</span><strong>{activeRatio}</strong></div>
        <div style={styles.statCard}><span>Harga Numeric</span><strong>{summary.numeric_price_products ?? '-'}</strong></div>
        <div style={styles.statCard}><span>Harga Konfirmasi</span><strong>{summary.quote_price_products ?? '-'}</strong></div>
        <div style={styles.statCard}><span>Tanpa Gambar</span><strong>{summary.no_image_products ?? '-'}</strong></div>
      </div>

      <div style={styles.syncCard}>
        <div>
          <p style={styles.eyebrow}>Sync History</p>
          <h2 style={styles.cardTitle}>{latestEvent ? eventLabel(latestEvent.type) : 'Belum ada event sync'}</h2>
          <p style={styles.subtitle}>
            Last: {formatDate(latestEvent?.created_at)} · seen {latestEvent?.payload?.seen ?? '-'} · modified {latestEvent?.payload?.modified ?? '-'}
          </p>
        </div>
        <div style={styles.historyList}>
          {history.slice(0, 5).map((event) => (
            <div key={event.event_id} style={styles.historyItem}>
              <strong>{eventLabel(event.type)}</strong>
              <span>{formatDate(event.created_at)}</span>
              <span>
                seen {event.payload?.seen ?? event.payload?.result?.seen ?? '-'} · modified {event.payload?.modified ?? event.payload?.result?.modified ?? '-'} · skipped {event.payload?.skipped ?? event.payload?.result?.skipped ?? '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.toolbar}>
        <form onSubmit={submitSearch} style={styles.searchForm}>
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Cari nama produk, kategori, SKU, keyword..."
            style={styles.input}
          />
          <button type="submit" style={styles.primaryButton}>Cari</button>
        </form>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="active">Aktif</option>
          <option value="inactive">Inactive</option>
          <option value="all">Semua Status</option>
        </select>

        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} style={styles.select}>
          <option value="all">Semua Harga</option>
          <option value="numeric_price">Harga Numeric</option>
          <option value="quote_price">Harga Konfirmasi</option>
          <option value="no_image">Tanpa Gambar</option>
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.empty}>Memuat produk...</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>Tidak ada produk sesuai filter.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produk</th>
                  <th style={styles.th}>Kategori</th>
                  <th style={styles.th}>Harga</th>
                  <th style={styles.th}>Tipe</th>
                  <th style={styles.th}>MOQ</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Update</th>
                  <th style={styles.th}>Link</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} style={styles.productImage} />
                        ) : (
                          <div style={styles.noImage}>No Img</div>
                        )}
                        <div>
                          <strong>{item.name}</strong>
                          <div style={styles.muted}>{item.slug || item.product_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{item.category_name || item.category || '-'}</td>
                    <td style={styles.td}>
                      <strong>{moneyLabel(item)}</strong>
                      <div style={styles.muted}>{item.price_mode || '-'}</div>
                    </td>
                    <td style={styles.td}><code style={styles.code}>{item.product_type || '-'}</code></td>
                    <td style={styles.td}>{item.minimum_order_quantity || '-'}</td>
                    <td style={styles.td}>{statusBadge(item.status)}</td>
                    <td style={styles.td}>
                      <div>{formatDate(item.updated_at)}</div>
                      <div style={styles.muted}>SC: {formatDate(item.spacecraft_updated_at)}</div>
                    </td>
                    <td style={styles.td}>
                      {item.product_url ? (
                        <a href={item.product_url} target="_blank" rel="noopener noreferrer" style={styles.linkButton}>
                          Open
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24, maxWidth: 1320, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 },
  headerActions: { display: 'flex', gap: 8, alignItems: 'center' },
  eyebrow: { margin: 0, color: '#2563eb', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' },
  title: { margin: '4px 0', fontSize: 30, lineHeight: 1.2 },
  subtitle: { margin: 0, color: '#64748b' },
  refreshButton: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 },
  primaryButton: { border: 0, background: '#16a34a', color: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 800 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'grid', gap: 6 },
  syncCard: { background: '#fff', border: '1px solid #dbeafe', borderRadius: 16, padding: 14, marginBottom: 14, display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 14, alignItems: 'start' },
  cardTitle: { margin: '3px 0', fontSize: 18 },
  historyList: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, maxHeight: 178, overflowY: 'auto', paddingRight: 2 },
  historyItem: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', display: 'grid', gap: 2, fontSize: 11, color: '#475569', minHeight: 68 },
  toolbar: { display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 180px 220px', gap: 10, marginBottom: 14, alignItems: 'center' },
  searchForm: { display: 'flex', gap: 8, flex: 1 },
  input: { flex: 1, border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 12px' },
  select: { border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 12px', width: '100%' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px', verticalAlign: 'top' },
  productCell: { display: 'flex', gap: 10, alignItems: 'center', minWidth: 260 },
  productImage: { width: 48, height: 48, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' },
  noImage: { width: 48, height: 48, borderRadius: 12, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 11, display: 'grid', placeItems: 'center' },
  muted: { color: '#64748b', fontSize: 12, marginTop: 4 },
  badge: { display: 'inline-flex', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 800 },
  code: { background: '#f1f5f9', borderRadius: 8, padding: '3px 6px' },
  linkButton: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontWeight: 800, color: '#2563eb', textDecoration: 'none' },
  empty: { padding: 24, textAlign: 'center', color: '#64748b' },
  error: { background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12, marginBottom: 14 },
};
