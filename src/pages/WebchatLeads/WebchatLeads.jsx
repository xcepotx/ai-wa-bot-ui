import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { webchatLeadApi, spacecraftApi } from '../../api/client';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) {
    return value;
  }
}

function badge(status) {
  const map = {
    contact_requested: ['Minta Kontak', '#eff6ff', '#1d4ed8'],
    new: ['New', '#fef9c3', '#92400e'],
    notified: ['Notified', '#dcfce7', '#15803d'],
    followed_up: ['Followed Up', '#f1f5f9', '#475569'],
    closed: ['Closed', '#f1f5f9', '#475569'],
  };
  const [label, bg, color] = map[status] || [status || 'Unknown', '#f1f5f9', '#475569'];
  return <span style={{ ...styles.badge, background: bg, color }}>{label}</span>;
}

function SyncCard() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const res = await spacecraftApi.syncStatus();
      setStatus(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat status sync');
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

  useEffect(() => {
    load();
  }, []);

  const payload = status?.last_success?.payload || {};

  return (
    <div style={styles.syncCard}>
      <div>
        <p style={styles.eyebrow}>SpaceCraft Product Sync</p>
        <h2 style={styles.cardTitle}>Katalog SpaceCraft → Wabot</h2>
        <p style={styles.subtitle}>
          Auto sync tiap {status?.auto_sync_seconds || 1800} detik. Klik manual sync setelah update produk di SpaceCraft.
        </p>
      </div>

      <div style={styles.syncRight}>
        <button style={styles.primaryButton} onClick={syncNow} disabled={syncing}>
          {syncing ? 'Syncing...' : 'Sync Products'}
        </button>
        <div style={styles.syncMeta}>
          <strong>{status?.active_product_count ?? '-'}</strong> produk aktif · last sync {formatDate(status?.last_success?.created_at)}
          {payload.modified !== undefined ? ` · modified ${payload.modified}` : ''}
        </div>
        {error && <div style={styles.errorMini}>{error}</div>}
      </div>
    </div>
  );
}

export default function WebchatLeads() {
  const [items, setItems] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await webchatLeadApi.list({ status, q, limit: 100 });
      setItems(res.data.items || []);
      setStatusCounts(res.data.status_counts || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat webchat leads');
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(leadId) {
    setSelected(leadId);
    setDetail(null);
    try {
      const res = await webchatLeadApi.detail(leadId);
      setDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Gagal membuka detail lead');
      setSelected(null);
    }
  }

  async function markFollowedUp(leadId) {
    const note = window.prompt('Catatan follow up:', 'Sudah di-follow up via WhatsApp');
    if (note === null) return;

    try {
      await webchatLeadApi.markFollowedUp(leadId, note);
      toast.success('Lead ditandai followed up');
      setSelected(null);
      setDetail(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Gagal update lead');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const stats = useMemo(() => {
    const out = { total, contact_requested: 0, new: 0, notified: 0, followed_up: 0 };
    for (const row of statusCounts) out[row.status] = row.count;
    return out;
  }, [statusCounts, total]);

  function submitSearch(e) {
    e.preventDefault();
    setQ(queryInput.trim());
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>SpaceCraft Webchat</p>
          <h1 style={styles.title}>Webchat Leads</h1>
          <p style={styles.subtitle}>Lead dari Chat Assistant website yang butuh follow up admin.</p>
        </div>
        <button style={styles.refreshButton} onClick={load} disabled={loading}>
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      <SyncCard />

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><span>Total</span><strong>{stats.total}</strong></div>
        <div style={styles.statCard}><span>Minta Kontak</span><strong>{stats.contact_requested || 0}</strong></div>
        <div style={styles.statCard}><span>New</span><strong>{stats.new || 0}</strong></div>
        <div style={styles.statCard}><span>Notified</span><strong>{stats.notified || 0}</strong></div>
        <div style={styles.statCard}><span>Followed Up</span><strong>{stats.followed_up || 0}</strong></div>
      </div>

      <div style={styles.toolbar}>
        <form onSubmit={submitSearch} style={styles.searchForm}>
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Cari nama, nomor WA, kebutuhan..."
            style={styles.input}
          />
          <button type="submit" style={styles.primaryButton}>Cari</button>
        </form>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="">Semua Status</option>
          <option value="contact_requested">Contact Requested</option>
          <option value="new">New</option>
          <option value="notified">Notified</option>
          <option value="followed_up">Followed Up</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.empty}>Memuat leads...</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>Belum ada webchat lead.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Kebutuhan</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Intent</th>
                  <th style={styles.th}>Update</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.lead_id}
                    style={{ ...styles.tr, cursor: 'pointer' }}
                    onClick={() => openDetail(item.lead_id)}
                    title="Klik untuk membuka detail lead"
                  >
                    <td style={styles.td}>
                      <strong>{item.customer_name || 'Belum disebutkan'}</strong>
                      <div style={styles.muted}>{item.customer_phone || '-'}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.clip}>{item.need_summary || item.last_message || '-'}</div>
                      <div style={styles.muted}>{item.page_url || '-'}</div>
                    </td>
                    <td style={styles.td}>{badge(item.status)}</td>
                    <td style={styles.td}><code style={styles.code}>{item.intent || '-'}</code></td>
                    <td style={styles.td}>{formatDate(item.updated_at)}</td>
                    <td style={styles.td}>
                      <button
                        style={styles.linkButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(item.lead_id);
                        }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div style={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Lead Detail</h2>
              <button style={styles.refreshButton} onClick={() => setSelected(null)}>Tutup</button>
            </div>

            {!detail ? (
              <div style={styles.empty}>Memuat detail...</div>
            ) : (
              <>
                <div style={styles.detailGrid}>
                  <div><span>Nama</span><strong>{detail.lead?.customer_name || '-'}</strong></div>
                  <div><span>WA</span><strong>{detail.lead?.customer_phone || '-'}</strong></div>
                  <div><span>Status</span><strong>{detail.lead?.status || '-'}</strong></div>
                  <div><span>Session</span><strong>{detail.lead?.session_id || '-'}</strong></div>
                </div>

                <h3 style={styles.sectionTitle}>Kebutuhan</h3>
                <div style={styles.box}>{detail.lead?.need_summary || '-'}</div>

                <h3 style={styles.sectionTitle}>Ringkasan Percakapan</h3>
                <pre style={styles.pre}>{detail.lead?.conversation_summary || '-'}</pre>

                <h3 style={styles.sectionTitle}>Messages</h3>
                <div style={styles.messages}>
                  {(detail.messages || []).map((msg) => (
                    <div key={msg.message_id || `${msg.role}-${msg.created_at}`} style={styles.messageRow}>
                      <strong>{msg.role || '-'}</strong>
                      <p>{msg.text || '-'}</p>
                    </div>
                  ))}
                </div>

                {detail.lead?.status !== 'followed_up' && (
                  <button style={{ ...styles.primaryButton, marginTop: 16 }} onClick={() => markFollowedUp(detail.lead.lead_id)}>
                    Mark Followed Up
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 24, maxWidth: 1280, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { margin: 0, color: '#2563eb', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' },
  title: { margin: '4px 0', fontSize: 30, lineHeight: 1.2 },
  subtitle: { margin: 0, color: '#64748b' },
  refreshButton: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 },
  primaryButton: { border: 0, background: '#16a34a', color: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 800 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'grid', gap: 6 },
  toolbar: { display: 'flex', gap: 12, marginBottom: 16 },
  searchForm: { display: 'flex', gap: 8, flex: 1 },
  input: { flex: 1, border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 12px' },
  select: { border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 12px', minWidth: 220 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18 },
  syncCard: { background: '#fff', border: '1px solid #bbf7d0', borderRadius: 18, padding: 18, marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 16 },
  syncRight: { textAlign: 'right', display: 'grid', gap: 8, justifyItems: 'end' },
  syncMeta: { color: '#64748b', fontSize: 13 },
  errorMini: { color: '#991b1b', fontSize: 13 },
  cardTitle: { margin: '4px 0', fontSize: 20 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px', verticalAlign: 'top' },
  muted: { color: '#64748b', fontSize: 12, marginTop: 4 },
  clip: { maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badge: { display: 'inline-flex', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 800 },
  code: { background: '#f1f5f9', borderRadius: 8, padding: '3px 6px' },
  linkButton: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontWeight: 800, color: '#2563eb' },
  empty: { padding: 24, textAlign: 'center', color: '#64748b' },
  error: { background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12, marginBottom: 14 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { width: 'min(920px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 24px 80px rgba(15,23,42,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 14 },
  sectionTitle: { marginTop: 18, marginBottom: 8 },
  box: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 },
  pre: { whiteSpace: 'pre-wrap', background: '#0f172a', color: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 13 },
  messages: { display: 'grid', gap: 8 },
  messageRow: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 },
};
