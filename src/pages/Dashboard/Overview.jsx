import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { botApi, shopApi } from '../../api/client';
import { Bot, Zap, MessageSquare, ArrowRight, CheckCircle, Circle, AlertCircle } from 'lucide-react';

export default function Overview() {
  const { user } = useOutletContext();
  const [readiness, setReadiness] = useState(null);
  const [settings, setSettings]   = useState(null);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    if (!user?.shop_id) { setLoading(false); return; }
    Promise.all([
      botApi.getSettings(),
      botApi.getReadiness(),
    ]).then(([s, r]) => {
      setSettings(s.data.settings);
      setReadiness(r.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user?.shop_id) return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Selamat datang! 👋</h1>
          <p>Mulai setup Lapakin Asisten kamu</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 40 }}>
        <Bot size={48} color="var(--brand)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: 8 }}>Buat toko dulu</h2>
        <p style={{ marginBottom: 24 }}>Sebelum bisa pakai Lapakin Asisten, kamu perlu setup profil toko terlebih dahulu.</p>
        <Link to="/dashboard/shop" className="btn btn-primary btn-lg">
          Setup Toko <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  const score = readiness?.score || 0;
  const scoreColor = score >= 80 ? 'var(--brand)' : score >= 50 ? 'var(--accent)' : 'var(--danger)';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Overview</h1>
          <p>Status dan readiness Lapakin Asisten kamu</p>
        </div>
        <Link to="/dashboard/simulator" className="btn btn-primary">
          <Zap size={15} /> Coba Simulator
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-6">
        <StatCard
          icon={<Bot size={20} color="var(--brand)" />}
          label="Status Bot"
          value={settings?.enabled ? 'Aktif' : 'Nonaktif'}
          badge={settings?.enabled ? 'badge-green' : 'badge-gray'}
          sub={`Mode: ${settings?.mode || 'off'}`}
        />
        <StatCard
          icon={<MessageSquare size={20} color="var(--accent)" />}
          label="Quota Bulan Ini"
          value={`${settings?.quota_used || 0} / ${settings?.quota_monthly || 100}`}
          sub="pesan terpakai"
        />
        <StatCard
          icon={<Zap size={20} color={scoreColor} />}
          label="Readiness Score"
          value={`${score}/100`}
          badge={score >= 80 ? 'badge-green' : score >= 50 ? 'badge-yellow' : 'badge-red'}
          sub={readiness?.label || '-'}
        />
      </div>

      {/* Readiness Checklist */}
      {readiness && (
        <div className="card">
          <div className="card-title">
            <AlertCircle size={18} color="var(--brand)" />
            Checklist Readiness Bot
          </div>

          {/* Score bar */}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.entries(readiness.checklist || {}).map(([key, val]) => (
              <CheckItem
                key={key}
                label={CHECKLIST_LABELS[key] || key}
                ok={val.ok}
                points={val.points}
              />
            ))}
          </div>

          {!readiness.can_auto_reply && (
            <div className="alert alert-warning mt-4" style={{ margin: '16px 0 0' }}>
              <AlertCircle size={16} />
              <span>Lengkapi checklist di atas untuk mengaktifkan balas otomatis (minimal score 80)</span>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid-2 mt-4">
        <QuickAction
          to="/dashboard/products"
          icon={<MessageSquare size={20} />}
          title="Tambah Produk"
          desc="Lengkapi daftar produk agar bot bisa menjawab pertanyaan menu"
        />
        <QuickAction
          to="/dashboard/faqs"
          icon={<Bot size={20} />}
          title="Setup FAQ"
          desc="Buat minimal 5 FAQ untuk meningkatkan akurasi jawaban bot"
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, badge, sub }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40,
          background: 'var(--bg)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</span>
        {badge && <span className={`badge ${badge}`}>{value}</span>}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CheckItem({ label, ok, points }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
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
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, background: 'var(--brand-light)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--brand)',
          }}>{icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
          </div>
          <ArrowRight size={16} color="var(--text-light)" style={{ marginLeft: 'auto' }} />
        </div>
      </div>
    </Link>
  );
}

const CHECKLIST_LABELS = {
  nama_toko:        'Nama toko lengkap',
  deskripsi_toko:   'Deskripsi toko ada',
  whatsapp_ada:     'Nomor WhatsApp ada',
  produk_minimal_3: 'Minimal 3 produk',
  harga_lengkap:    'Semua produk ada harga',
  jam_buka_ada:     'Jam buka diisi',
  payment_ada:      'Info pembayaran ada',
  faq_minimal_5:    'Minimal 5 FAQ',
  handoff_keyword:  'Handoff keyword diatur',
  fallback_message: 'Fallback message diatur',
  sudah_simulasi:   'Sudah coba simulator',
};
