import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { webchatLeadApi, spacecraftApi } from '../../api/client';

const STATUS_OPTIONS = [
  ['contact_requested', 'Minta Kontak'],
  ['new', 'New'],
  ['notified', 'Notified'],
  ['followed_up', 'Followed Up'],
  ['won', 'Won'],
  ['lost', 'Lost'],
  ['closed', 'Closed'],
];

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) {
    return value;
  }
}

function normalizeWaPhone(value) {
  if (!value) return '';
  let phone = String(value).replace(/[^\d+]/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  return phone;
}

function waLink(phone, leadOrNeed) {
  const clean = normalizeWaPhone(phone);
  if (!clean) return '';

  const message = (leadOrNeed && typeof leadOrNeed === 'object')
    ? buildFollowUpMessage(leadOrNeed)
    : `Halo kak, saya admin SpaceCraft. Saya mau follow up kebutuhan: ${leadOrNeed || 'custom 3D print'}`;

  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${text}`;
}

function cleanCustomSummary(value) {
  return String(value || '')
    .replace(/^Brief custom:\s*/i, '')
    .replace(/^Order ready stock:\s*/i, '')
    .trim();
}

function leadNeedForWa(lead) {
  if (!lead) return 'custom 3D print';
  return cleanCustomSummary(lead.ready_stock_order_summary || lead.custom_brief_summary || lead.need_summary || lead.last_message || 'custom 3D print');
}

function isCustomLead(lead) {
  if (!lead) return false;
  const text = `${lead.custom_brief_summary || ''} ${lead.need_summary || ''} ${lead.intent || ''}`.toLowerCase();
  return Boolean(lead.custom_brief_summary) || text.includes('brief custom') || text.includes('custom');
}

function briefLines(value) {
  return cleanCustomSummary(value)
    .split('\n')
    .map(line => line.trim().replace(/^-\s*/, ''))
    .filter(Boolean);
}

function CustomBriefCard({ lead }) {
  const summary = lead?.custom_brief_summary || (
    String(lead?.need_summary || '').toLowerCase().includes('brief custom')
      ? lead?.need_summary
      : ''
  );
  const lines = briefLines(summary);
  if (!lines.length) return null;

  return (
    <div style={styles.briefCard}>
      <div style={styles.briefHeader}>
        <span style={styles.customBadge}>Custom Lead</span>
        <strong>Brief Custom</strong>
      </div>
      <div style={styles.briefList}>
        {lines.map((line, idx) => (
          <div key={`${line}-${idx}`} style={styles.briefItem}>
            <span style={styles.briefDot}>✓</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isReadyStockLead(lead) {
  if (!lead) return false;
  const text = `${lead.ready_stock_order_summary || ''} ${lead.need_summary || ''} ${lead.lead_type || ''}`.toLowerCase();
  return Boolean(lead.ready_stock_order_summary) || lead.lead_type === 'ready_stock' || text.includes('order ready stock');
}

function ReadyStockOrderCard({ lead }) {
  const summary = lead?.ready_stock_order_summary || (
    String(lead?.need_summary || '').toLowerCase().includes('order ready stock')
      ? lead?.need_summary
      : ''
  );
  const lines = briefLines(summary);
  if (!lines.length) return null;

  return (
    <div style={styles.readyCard}>
      <div style={styles.briefHeader}>
        <span style={styles.readyBadge}>Ready Stock</span>
        <strong>Order Ready Stock</strong>
      </div>
      <div style={styles.briefList}>
        {lines.map((line, idx) => (
          <div key={`${line}-${idx}`} style={styles.briefItem}>
            <span style={styles.readyDot}>✓</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}



function fulfillmentLabel(value) {
  if (!value) return '-';
  const text = String(value).toLowerCase();
  if (text === 'delivery') return 'Dikirim';
  if (text === 'pickup') return 'Pickup / ambil sendiri';
  return value;
}

function hasOrderReadiness(lead) {
  return Boolean(
    lead?.order_readiness_summary ||
    lead?.delivery_area ||
    lead?.fulfillment_method ||
    lead?.order_readiness
  );
}

function OrderReadinessCard({ lead }) {
  if (!hasOrderReadiness(lead)) return null;

  const summary = lead?.order_readiness_summary || '';
  const lines = briefLines(summary);
  const method = lead?.fulfillment_method || lead?.order_readiness?.fulfillment_method;
  const area = lead?.delivery_area || lead?.order_readiness?.delivery_area;

  return (
    <div style={styles.orderCard}>
      <div style={styles.briefHeader}>
        <span style={styles.readinessBadge}>Order Readiness</span>
        <strong>Info Pengiriman</strong>
      </div>

      <div style={styles.readinessMeta}>
        <div style={styles.readinessMetaItem}>
          <span>Metode</span>
          <strong>{fulfillmentLabel(method)}</strong>
        </div>
        <div style={styles.readinessMetaItem}>
          <span>Area/Kota</span>
          <strong>{area || '-'}</strong>
        </div>
      </div>

      {lines.length > 0 && (
        <div style={styles.briefList}>
          {lines.map((line, idx) => (
            <div key={`${line}-${idx}`} style={styles.briefItem}>
              <span style={styles.readyDot}>✓</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function messageRoleLabel(role, source) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'customer') return 'Customer';
  if (normalized === 'assistant' || normalized === 'bot') {
    return source === 'lead_capture' ? 'Bot / Lead Capture' : 'Bot';
  }
  if (normalized === 'system') return 'System';
  return role || '-';
}

function messageRoleStyle(role, source) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'customer') return styles.timelineCustomer;
  if (normalized === 'assistant' || normalized === 'bot') {
    return source === 'lead_capture' ? styles.timelineLeadCapture : styles.timelineBot;
  }
  return styles.timelineSystem;
}

function visibleTimelineMessages(messages) {
  const rows = Array.isArray(messages) ? messages : [];
  const output = [];

  for (let i = 0; i < rows.length; i += 1) {
    const msg = rows[i];
    const role = String(msg?.role || '').toLowerCase();

    // Hide simulator/LLM bot draft if the next stored message is the actual webchat override.
    if (role === 'bot') {
      const next = rows[i + 1];
      const nextRole = String(next?.role || '').toLowerCase();
      const nextSource = String(next?.source || '').toLowerCase();
      if (nextRole === 'assistant' && nextSource === 'lead_capture') {
        continue;
      }
    }

    output.push(msg);
  }

  return output;
}

function ConversationTimeline({ messages }) {
  const rows = visibleTimelineMessages(messages);

  if (!rows.length) {
    return <div style={styles.emptyTimeline}>Belum ada riwayat pesan.</div>;
  }

  return (
    <div style={styles.timeline}>
      {rows.map((msg, idx) => {
        const role = String(msg?.role || '').toLowerCase();
        const isCustomer = role === 'customer';

        return (
          <div
            key={msg.message_id || `${msg.role}-${msg.created_at}-${idx}`}
            style={{
              ...styles.timelineRow,
              justifyContent: isCustomer ? 'flex-start' : 'flex-end',
            }}
          >
            <div style={{ ...styles.timelineBubble, ...messageRoleStyle(msg.role, msg.source) }}>
              <div style={styles.timelineMeta}>
                <strong>{messageRoleLabel(msg.role, msg.source)}</strong>
                <span>{formatDate(msg.created_at)}</span>
              </div>
              <div style={styles.timelineText}>{msg.text || '-'}</div>
              {(msg.intent || msg.source) && (
                <div style={styles.timelineTags}>
                  {msg.intent && <code style={styles.code}>{msg.intent}</code>}
                  {msg.source && <code style={styles.code}>{msg.source}</code>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function buildFollowUpMessage(lead) {
  const namePart = lead?.customer_name ? ` ${lead.customer_name}` : '';

  if (isReadyStockLead(lead)) {
    const summary = cleanCustomSummary(lead.order_readiness_summary || lead.ready_stock_order_summary || lead.need_summary || '');
    return (
      `Halo kak${namePart}, saya admin SpaceCraft mau follow up order ready stock kak.\n\n` +
      `Saya rangkum pesanan awalnya:\n${summary || leadNeedForWa(lead)}\n\n` +
      `Kami bantu konfirmasi stok, ongkir, dan proses pemesanannya ya.`
    );
  }

  if (isCustomLead(lead)) {
    const summary = cleanCustomSummary(lead.custom_brief_summary || lead.need_summary || '');
    return (
      `Halo kak${namePart}, saya admin SpaceCraft mau follow up request custom kak.\n\n` +
      `Saya rangkum brief awalnya:\n${summary || leadNeedForWa(lead)}\n\n` +
      `Admin akan bantu cek estimasi harga dan waktu pengerjaan ya.`
    );
  }

  return `Halo kak${namePart}, saya admin SpaceCraft. Saya mau follow up kebutuhan kakak: ${leadNeedForWa(lead)}`;
}


function defaultLeadActionNote(lead, action) {
  if (isReadyStockLead(lead)) {
    if (action === 'followed_up') return 'Ready stock lead sudah di-follow up via WhatsApp untuk konfirmasi stok, ongkir, dan proses order.';
    if (action === 'won') return 'Ready stock order berhasil lanjut/closing.';
    if (action === 'lost') return 'Ready stock lead tidak lanjut atau batal order.';
    if (action === 'closed') return 'Ready stock lead ditutup setelah proses follow-up.';
  }

  if (isCustomLead(lead)) {
    if (action === 'followed_up') return 'Custom lead sudah di-follow up via WhatsApp untuk cek brief, estimasi harga, dan waktu pengerjaan.';
    if (action === 'won') return 'Custom order berhasil lanjut/closing.';
    if (action === 'lost') return 'Custom lead tidak lanjut atau batal request.';
    if (action === 'closed') return 'Custom lead ditutup setelah proses follow-up.';
  }

  if (action === 'followed_up') return 'Lead sudah di-follow up via WhatsApp.';
  if (action === 'won') return 'Lead berhasil closing / order lanjut.';
  if (action === 'lost') return 'Lead tidak lanjut / batal.';
  if (action === 'closed') return 'Lead ditutup.';

  return 'Update status lead.';
}


function badge(status) {
  const map = {
    contact_requested: ['Minta Kontak', '#eff6ff', '#1d4ed8'],
    new: ['New', '#fef9c3', '#92400e'],
    notified: ['Notified', '#dcfce7', '#15803d'],
    followed_up: ['Followed Up', '#f1f5f9', '#475569'],
    won: ['Won', '#dcfce7', '#15803d'],
    lost: ['Lost', '#fee2e2', '#b91c1c'],
    closed: ['Closed', '#e2e8f0', '#334155'],
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
  const [typeCounts, setTypeCounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [leadType, setLeadType] = useState('');
  const [q, setQ] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await webchatLeadApi.list({ status, lead_type: leadType, q, limit: 100 });
      setItems(res.data.items || []);
      setStatusCounts(res.data.status_counts || []);
      setTypeCounts(res.data.type_counts || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat leads');
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(leadId) {
    setSelected(leadId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await webchatLeadApi.detail(leadId);
      setDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Gagal membuka detail lead');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateLeadStatus(leadId, nextStatus, label, defaultNote) {
    const note = window.prompt(`Catatan untuk status ${label}:`, defaultNote || `Lead ditandai ${label}`);
    if (note === null) return;

    try {
      await webchatLeadApi.updateStatus(leadId, nextStatus, note);
      toast.success(`Lead ditandai ${label}`);
      await load();
      if (selected === leadId) {
        await openDetail(leadId);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Gagal update status lead');
    }
  }

  function markFollowedUp(lead) {
    if (!lead?.lead_id) return;
    updateLeadStatus(lead.lead_id, 'followed_up', 'Followed Up', defaultLeadActionNote(lead, 'followed_up'));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, leadType]);

  const stats = useMemo(() => {
    const out = {
      total,
      contact_requested: 0,
      new: 0,
      notified: 0,
      followed_up: 0,
      won: 0,
      lost: 0,
      closed: 0,
      ready_stock: 0,
      custom: 0,
      general: 0,
    };
    for (const row of statusCounts) out[row.status] = row.count;
    for (const row of typeCounts) out[row.lead_type || 'general'] = row.count;
    return out;
  }, [statusCounts, typeCounts, total]);

  function submitSearch(e) {
    e.preventDefault();
    setQ(queryInput.trim());
  }

  const activeLead = detail?.lead;
  const activeWaUrl = activeLead?.customer_phone ? waLink(activeLead.customer_phone, activeLead) : '';

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Sales Leads</p>
          <h1 style={styles.title}>Leads</h1>
          <p style={styles.subtitle}>Lead dari webchat yang butuh follow up admin.</p>
        </div>
        <button style={styles.refreshButton} onClick={load} disabled={loading}>
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      <SyncCard />

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><span>Total</span><strong>{stats.total}</strong></div>
        <div style={styles.statCard}><span>Ready Stock</span><strong>{stats.ready_stock || 0}</strong></div>
        <div style={styles.statCard}><span>Custom</span><strong>{stats.custom || 0}</strong></div>
        <div style={styles.statCard}><span>Minta Kontak</span><strong>{stats.contact_requested || 0}</strong></div>
        <div style={styles.statCard}><span>Followed Up</span><strong>{stats.followed_up || 0}</strong></div>
        <div style={styles.statCard}><span>Won</span><strong>{stats.won || 0}</strong></div>
        <div style={styles.statCard}><span>Lost</span><strong>{stats.lost || 0}</strong></div>
      </div>

      <div style={styles.toolbar}>
        <form onSubmit={submitSearch} style={styles.searchForm}>
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Cari nama, nomor WA, kebutuhan, session..."
            style={styles.input}
          />
          <button type="submit" style={styles.primaryButton}>Cari</button>
        </form>
        <select value={leadType} onChange={(e) => setLeadType(e.target.value)} style={styles.select}>
          <option value="">Semua Tipe</option>
          <option value="ready_stock">Ready Stock</option>
          <option value="custom">Custom</option>
          <option value="general">General</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.empty}>Memuat leads...</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>Belum ada lead.</div>
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
                {items.map((item) => {
                  const itemWaUrl = item.customer_phone ? waLink(item.customer_phone, item) : '';
                  return (
                    <tr
                      key={item.lead_id}
                      style={{ ...styles.tr, cursor: 'pointer' }}
                      onClick={() => openDetail(item.lead_id)}
                      title="Klik untuk membuka detail lead"
                    >
                      <td style={styles.td}>
                        <strong>{item.customer_name || 'Belum disebutkan'}</strong>
                        <div style={styles.muted}>{item.customer_phone || '-'}</div>
                        {(isCustomLead(item) || isReadyStockLead(item)) && (
                          <div style={styles.badgeRow}>
                            {isCustomLead(item) && <span style={styles.customBadge}>Custom Lead</span>}
                            {isReadyStockLead(item) && <span style={styles.readyBadge}>Ready Stock</span>}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.clip}>{cleanCustomSummary(item.ready_stock_order_summary || item.custom_brief_summary || item.need_summary || item.last_message || '-')}</div>
                        <div style={styles.muted}>{item.page_url || '-'}</div>
                      </td>
                      <td style={styles.td}>{badge(item.status)}</td>
                      <td style={styles.td}><code style={styles.code}>{item.intent || '-'}</code></td>
                      <td style={styles.td}>{formatDate(item.updated_at)}</td>
                      <td style={styles.td}>
                        <div style={styles.rowActions}>
                          <button
                            style={styles.linkButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(item.lead_id);
                            }}
                          >
                            Detail
                          </button>
                          {itemWaUrl && (
                            <a
                              href={itemWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.waButtonSmall}
                              onClick={(e) => e.stopPropagation()}
                            >
                              WA
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div style={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>Lead Detail</h2>
                  {activeLead && (
                    <div style={styles.modalMetaLine}>
                      {badge(activeLead.status)}
                      {isCustomLead(activeLead) && <span style={styles.customBadge}>Custom Lead</span>}
                        {isReadyStockLead(activeLead) && <span style={styles.readyBadge}>Ready Stock</span>}
                      <span>Updated {formatDate(activeLead.updated_at)}</span>
                    </div>
                  )}
              </div>
              <button style={styles.refreshButton} onClick={() => setSelected(null)}>Tutup</button>
            </div>

            {detailLoading || !detail ? (
              <div style={styles.empty}>Memuat detail...</div>
            ) : (
              <>
                <div style={styles.detailGrid}>
                  <div><span>Nama</span><strong>{activeLead?.customer_name || '-'}</strong></div>
                  <div><span>WA</span><strong>{activeLead?.customer_phone || '-'}</strong></div>
                  <div><span>Intent</span><strong>{activeLead?.intent || '-'}</strong></div>
                  <div><span>Session</span><strong>{activeLead?.session_id || '-'}</strong></div>
                </div>

                <div style={styles.modalActions}>
                  {activeWaUrl && (
                    <a href={activeWaUrl} target="_blank" rel="noopener noreferrer" style={styles.waButton}>
                      Chat WhatsApp
                    </a>
                  )}
                  {activeLead?.status !== 'followed_up' && (
                    <button style={styles.secondaryButton} onClick={() => markFollowedUp(activeLead)}>
                      Mark Followed Up
                    </button>
                  )}
                  {activeLead?.status !== 'won' && (
                    <button style={styles.primaryButton} onClick={() => updateLeadStatus(activeLead.lead_id, 'won', 'Won', defaultLeadActionNote(activeLead, 'won'))}>
                      Mark Won
                    </button>
                  )}
                  {activeLead?.status !== 'lost' && (
                    <button style={styles.dangerButton} onClick={() => updateLeadStatus(activeLead.lead_id, 'lost', 'Lost', defaultLeadActionNote(activeLead, 'lost'))}>
                      Mark Lost
                    </button>
                  )}
                  {activeLead?.status !== 'closed' && (
                    <button style={styles.darkButton} onClick={() => updateLeadStatus(activeLead.lead_id, 'closed', 'Closed', defaultLeadActionNote(activeLead, 'closed'))}>
                      Close
                    </button>
                  )}
                </div>

                <h3 style={styles.sectionTitle}>Kebutuhan</h3>
                    {isCustomLead(activeLead) ? (
                      <>
                        <CustomBriefCard lead={activeLead} />
                        <div style={styles.boxMuted}>{cleanCustomSummary(activeLead?.need_summary || '-')}</div>
                      </>
                    ) : isReadyStockLead(activeLead) ? (
                      <>
                        <ReadyStockOrderCard lead={activeLead} />
                        <OrderReadinessCard lead={activeLead} />
                        <div style={styles.boxMuted}>{cleanCustomSummary(activeLead?.need_summary || '-')}</div>
                      </>
                    ) : (
                      <div style={styles.box}>{activeLead?.need_summary || '-'}</div>
                    )}

                {(activeLead?.follow_up_note || activeLead?.status_note) && (
                  <>
                    <h3 style={styles.sectionTitle}>Catatan Follow-up</h3>
                    <div style={styles.noteBox}>{activeLead?.follow_up_note || activeLead?.status_note}</div>
                  </>
                )}

                <h3 style={styles.sectionTitle}>Conversation Timeline</h3>
                <ConversationTimeline messages={detail.messages || []} />
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
  primaryButton: { border: 0, background: '#16a34a', color: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  secondaryButton: { border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 800 },
  dangerButton: { border: 0, background: '#ef4444', color: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 800 },
  darkButton: { border: 0, background: '#334155', color: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontWeight: 800 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 },
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
    badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    customBadge: { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 900, background: '#ede9fe', color: '#6d28d9' },
    readyBadge: { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 900, background: '#dcfce7', color: '#15803d' },
  code: { background: '#f1f5f9', borderRadius: 8, padding: '3px 6px' },
  rowActions: { display: 'flex', gap: 6, alignItems: 'center' },
  linkButton: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontWeight: 800, color: '#2563eb' },
  waButtonSmall: { background: '#dcfce7', color: '#15803d', borderRadius: 10, padding: '8px 10px', fontWeight: 900, textDecoration: 'none' },
  waButton: { background: '#16a34a', color: '#fff', borderRadius: 12, padding: '10px 14px', fontWeight: 900, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  empty: { padding: 24, textAlign: 'center', color: '#64748b' },
  error: { background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12, marginBottom: 14 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { width: 'min(960px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 24px 80px rgba(15,23,42,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    modalMetaLine: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12, marginTop: 6 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 14 },
  modalActions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  sectionTitle: { marginTop: 18, marginBottom: 8 },
  box: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 },
    boxMuted: { background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 12, marginTop: 10, color: '#64748b', fontSize: 13, whiteSpace: 'pre-wrap' },
    briefCard: { background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)', border: '1px solid #ddd6fe', borderRadius: 16, padding: 14 },
    readyCard: { background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '1px solid #bbf7d0', borderRadius: 16, padding: 14 },
    orderCard: { background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', border: '1px solid #bfdbfe', borderRadius: 16, padding: 14, marginTop: 10 },
    readinessBadge: { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 900, background: '#dbeafe', color: '#1d4ed8' },
    readinessMeta: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 },
    readinessMetaItem: { background: '#fff', border: '1px solid #dbeafe', borderRadius: 12, padding: 10, display: 'grid', gap: 4 },
    briefHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
    briefList: { display: 'grid', gap: 8 },
    briefItem: { display: 'flex', gap: 8, alignItems: 'flex-start', color: '#334155', fontSize: 14, lineHeight: 1.45 },
    briefDot: { flex: '0 0 auto', width: 20, height: 20, borderRadius: 999, background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 },
    readyDot: { flex: '0 0 auto', width: 20, height: 20, borderRadius: 999, background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 },
  noteBox: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 12 },
  pre: { whiteSpace: 'pre-wrap', background: '#0f172a', color: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 13 },
  messages: { display: 'grid', gap: 8 },
    emptyTimeline: { background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 14, padding: 14, color: '#64748b' },
    timeline: { display: 'grid', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 14 },
    timelineRow: { display: 'flex' },
    timelineBubble: { width: 'min(720px, 92%)', borderRadius: 16, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 22px rgba(15,23,42,0.04)' },
    timelineCustomer: { background: '#fff', borderColor: '#cbd5e1' },
    timelineBot: { background: '#ecfdf5', borderColor: '#bbf7d0' },
    timelineLeadCapture: { background: '#eff6ff', borderColor: '#bfdbfe' },
    timelineSystem: { background: '#f1f5f9', borderColor: '#cbd5e1' },
    timelineMeta: { display: 'flex', justifyContent: 'space-between', gap: 10, color: '#64748b', fontSize: 12, marginBottom: 8 },
    timelineText: { whiteSpace: 'pre-wrap', color: '#0f172a', lineHeight: 1.5, fontSize: 14 },
    timelineTags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  messageRow: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 },
};
