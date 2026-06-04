import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { botApi, spacecraftApi } from '../../api/client';
import {
  Bot,
  Zap,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Circle,
  AlertCircle,
  Package,
  Users,
  RefreshCw,
  Inbox,
  Settings,
  Activity,
  Clock,
} from 'lucide-react';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (_) {
    return value;
  }
}

function eventLabel(type) {
  const map = {
    'spacecraft.products_synced': 'Produk tersinkron',
    'spacecraft.products_sync_failed': 'Sync produk gagal',
    'owner.spacecraft.products_sync_triggered': 'Manual sync dijalankan',
  };
  return map[type] || type || 'Event';
}

function warningColor(level) {
  if (level === 'high') return { bg: '#fee2e2', border: '#fecaca', color: '#991b1b' };
  if (level === 'medium') return { bg: '#fef3c7', border: '#fde68a', color: '#92400e' };
  return { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' };
}

export default function Overview() {
  const { user } = useOutletContext();
  const [readiness, setReadiness] = useState(null);
  const [settings, setSettings] = useState(null);
  const [command, setCommand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.shop_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [settingsRes, readinessRes, commandRes] = await Promise.all([
        botApi.getSettings(),
        botApi.getReadiness(),
        spacecraftApi.commandCenter(),
      ]);

      setSettings(settingsRes.data.settings);
      setReadiness(readinessRes.data);
      setCommand(commandRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat command center');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function syncProducts() {
    setSyncing(true);
    try {
      const res = await spacecraftApi.syncProducts();
      toast.success(`Sync sukses: ${res.data?.seen || 0} produk`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Sync produk gagal');
    } finally {
      setSyncing(false);
    }
  }

  if (!user?.shop_id) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1>Selamat datang! 👋</h1>
            <p>Mulai setup Wabot Assistant kamu</p>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 40 }}>
          <Bot size={48} color="var(--brand)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: 8 }}>Buat toko dulu</h2>
          <p style={{ marginBottom: 24 }}>Sebelum bisa pakai Wabot Assistant, kamu perlu setup profil toko terlebih dahulu.</p>
          <Link to="/dashboard/shop" className="btn btn-primary btn-lg">
            Setup Toko <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const score = readiness?.score || 0;
  const summary = command?.summary || {};
  const warnings = command?.warnings || [];
  const recent = command?.recent || {};
  const scoreColor = score >= 80 ? 'var(--brand)' : score >= 50 ? 'var(--accent)' : 'var(--danger)';
  const botEnabled = settings?.enabled || summary.bot_enabled;
  const botMode = settings?.mode || summary.bot_mode || 'off';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>SpaceCraft Command Center</h1>
          <p>Ringkasan operasional webchat, produk, lead, sync, dan kesiapan bot.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={syncProducts} disabled={syncing}>
            <RefreshCw size={15} /> {syncing ? 'Syncing...' : 'Sync Produk'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          Memuat command center...
        </div>
      ) : (
        <>
          <div className="grid-3 mb-4">
            <MetricCard
              icon={<Users size={20} color="var(--brand)" />}
              label="Leads 7 Hari"
              value={formatNumber(summary.leads_7d)}
              sub={`Hari ini ${formatNumber(summary.leads_today)} · Follow-up ${formatNumber(summary.leads_need_follow_up)}`}
            />
            <MetricCard
              icon={<Package size={20} color="var(--brand)" />}
              label="Produk SpaceCraft"
              value={`${formatNumber(summary.products_active)} aktif`}
              sub={`${formatNumber(summary.products_no_price)} perlu info harga · ${formatNumber(summary.products_no_image)} tanpa gambar`}
            />
            <MetricCard
              icon={<Bot size={20} color={botEnabled ? 'var(--brand)' : 'var(--danger)'} />}
              label="Bot Status"
              value={botEnabled ? 'Aktif' : 'Nonaktif'}
              sub={`Mode: ${botMode} · Score ${score}/100`}
            />
          </div>

          <div className="grid-3 mb-4">
            <MetricCard
              icon={<Inbox size={20} color="var(--accent)" />}
              label="Conversations"
              value={formatNumber(summary.sessions_total)}
              sub={`${formatNumber(summary.messages_total)} pesan tersimpan`}
            />
            <MetricCard
              icon={<CheckCircle size={20} color="var(--brand)" />}
              label="Leads Progress"
              value={`${formatNumber(summary.leads_followed_up)} follow-up`}
              sub={`Won ${formatNumber(summary.leads_won)} · Lost ${formatNumber(summary.leads_lost)}`}
            />
            <MetricCard
              icon={<Clock size={20} color="var(--accent)" />}
              label="Last Product Sync"
              value={summary.last_sync_age_minutes == null ? '-' : `${summary.last_sync_age_minutes} menit lalu`}
              sub={formatDate(summary.last_sync_at)}
            />
          </div>

          <div style={styles.commandGrid}>
            <div className="card">
              <div className="card-title">
                <AlertCircle size={18} color="var(--brand)" />
                Action Warnings
              </div>

              {warnings.length === 0 ? (
                <div style={styles.emptyState}>
                  <CheckCircle size={22} color="var(--brand)" />
                  Semua indikator utama aman.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {warnings.map((warning) => (
                    <WarningCard key={warning.type} warning={warning} />
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">
                <Zap size={18} color="var(--brand)" />
                Quick Actions
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <QuickAction to="/dashboard/webchat-leads" icon={<Users size={18} />} title="Buka Leads" desc="Lihat calon pembeli dari webchat dan status follow-up." />
                <QuickAction to="/dashboard/spacecraft-products" icon={<Package size={18} />} title="Produk SpaceCraft" desc="Cek produk hasil sync, harga, gambar, dan riwayat sync." />
                <QuickAction to="/dashboard/inbox" icon={<Inbox size={18} />} title="Conversations" desc="Pantau percakapan webchat dan WhatsApp." />
                <QuickAction to="/dashboard/bot" icon={<Settings size={18} />} title="Pengaturan Bot" desc="Atur auto reply, mode bot, tone, dan pesan otomatis." />
                <QuickAction to="/dashboard/simulator" icon={<Zap size={18} />} title="Simulator" desc="Tes jawaban bot sebelum dipakai pelanggan." />
              </div>
            </div>
          </div>

          <div style={styles.recentGrid}>
            <div className="card">
              <div className="card-title">
                <Users size={18} color="var(--brand)" />
                Latest Leads
              </div>

              {(recent.leads || []).length === 0 ? (
                <div style={styles.emptyState}>Belum ada lead webchat.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {(recent.leads || []).map((lead) => (
                    <LeadRow key={lead.lead_id} lead={lead} />
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">
                <Activity size={18} color="var(--brand)" />
                Recent Activity
              </div>

              {(recent.events || []).length === 0 ? (
                <div style={styles.emptyState}>Belum ada activity.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {(recent.events || []).slice(0, 6).map((event) => (
                    <EventRow key={event.event_id || `${event.type}-${event.created_at}`} event={event} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {readiness && (
            <div className="card mt-4">
              <div className="card-title">
                <AlertCircle size={18} color="var(--brand)" />
                Checklist Readiness Bot
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="text-sm text-muted">Progress</span>
                  <span className="text-sm font-bold" style={{ color: scoreColor }}>{score}/100</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 99 }}>
                  <div style={{
                    height: '100%',
                    width: `${score}%`,
                    background: scoreColor,
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
                {Object.entries(readiness.checklist || {}).map(([key, val]) => (
                  <CheckItem
                    key={key}
                    label={CHECKLIST_LABELS[key] || key}
                    ok={val.ok}
                    points={val.points}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub }) {
  return (
    <div className="card">
      <div style={styles.metricHeader}>
        <div style={styles.iconBox}>{icon}</div>
      </div>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
      {sub && <div style={styles.metricSub}>{sub}</div>}
    </div>
  );
}

function WarningCard({ warning }) {
  const colors = warningColor(warning.level);

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AlertCircle size={16} color={colors.color} style={{ marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: colors.color, marginBottom: 3 }}>{warning.title}</div>
          <div style={{ fontSize: '0.82rem', color: colors.color, opacity: 0.9 }}>{warning.message}</div>
          {warning.action_to && (
            <Link to={warning.action_to} style={styles.warningLink}>
              {warning.action_label || 'Buka'} <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadRow({ lead }) {
  return (
    <Link to="/dashboard/webchat-leads" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={styles.rowCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800 }}>{lead.customer_name || 'Calon Pembeli'}</div>
            <div style={styles.muted}>{lead.customer_phone || lead.session_id || '-'}</div>
          </div>
          <span className="badge badge-gray">{lead.status || '-'}</span>
        </div>
        <div style={styles.rowSummary}>{lead.need_summary || lead.last_message || '-'}</div>
        <div style={styles.muted}>{formatDate(lead.updated_at || lead.created_at)}</div>
      </div>
    </Link>
  );
}

function EventRow({ event }) {
  const payload = event.payload || {};
  const seen = payload.seen ?? payload.result?.seen;
  const modified = payload.modified ?? payload.result?.modified;

  return (
    <div style={styles.eventRow}>
      <div style={{ fontWeight: 800 }}>{eventLabel(event.type)}</div>
      <div style={styles.muted}>
        {formatDate(event.created_at)}
        {seen != null ? ` · seen ${seen}` : ''}
        {modified != null ? ` · modified ${modified}` : ''}
      </div>
    </div>
  );
}

function CheckItem({ label, ok, points }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      borderRadius: 8,
      background: ok ? 'var(--brand-light)' : 'var(--bg)',
      border: `1px solid ${ok ? 'var(--brand-dim)' : 'var(--border)'}`,
    }}>
      {ok
        ? <CheckCircle size={16} color="var(--brand)" />
        : <Circle size={16} color="var(--text-light)" />
      }
      <span style={{ fontSize: '0.82rem', flex: 1, color: ok ? 'var(--brand-dark)' : 'var(--text-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ok ? 'var(--brand)' : 'var(--text-light)' }}>
        +{points}
      </span>
    </div>
  );
}

function QuickAction({ to, icon, title, desc }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={styles.quickAction}>
        <div style={styles.quickIcon}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
        </div>
        <ArrowRight size={16} color="var(--text-light)" />
      </div>
    </Link>
  );
}

const styles = {
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
    gap: 16,
    marginBottom: 16,
  },
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: 16,
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    background: 'var(--bg)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: '1.45rem',
    fontWeight: 900,
  },
  metricSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  emptyState: {
    padding: 18,
    border: '1px dashed var(--border)',
    borderRadius: 12,
    color: 'var(--text-muted)',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  warningLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    fontWeight: 800,
    fontSize: '0.8rem',
    color: 'inherit',
    textDecoration: 'none',
  },
  rowCard: {
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 12,
    background: 'var(--bg)',
  },
  rowSummary: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: '0.84rem',
    color: 'var(--text)',
    lineHeight: 1.45,
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: '0.76rem',
  },
  eventRow: {
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '9px 11px',
    background: 'var(--bg)',
  },
  quickAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 12,
    background: 'var(--bg)',
  },
  quickIcon: {
    width: 36,
    height: 36,
    background: 'var(--brand-light)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--brand)',
  },
};

const CHECKLIST_LABELS = {
  nama_toko: 'Nama toko lengkap',
  deskripsi_toko: 'Deskripsi toko ada',
  whatsapp_ada: 'Nomor WhatsApp ada',
  produk_minimal_3: 'Minimal 3 produk',
  harga_lengkap: 'Semua produk ada harga',
  jam_buka_ada: 'Jam buka diisi',
  payment_ada: 'Info pembayaran ada',
  faq_minimal_5: 'Minimal 5 FAQ',
  handoff_keyword: 'Handoff keyword diatur',
  fallback_message: 'Fallback message diatur',
  sudah_simulasi: 'Sudah coba simulator',
};
