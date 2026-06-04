import { useState, useEffect } from 'react';
import { botApi } from '../../api/client';
import toast from 'react-hot-toast';
import { Bot, Save, Plus, X } from 'lucide-react';

const TONES = [
  { value: 'ramah',       label: '😊 Ramah',       desc: 'Hangat dan penuh empati, sapa dengan "Kak"' },
  { value: 'santai',      label: '😎 Santai',       desc: 'Friendly dan kasual, boleh pakai emoji' },
  { value: 'profesional', label: '👔 Profesional',  desc: 'Formal dan terstruktur, hindari singkatan' },
  { value: 'singkat',     label: '⚡ Singkat',       desc: 'To the point, maksimal 2-3 kalimat' },
  { value: 'ceria',       label: '🎉 Ceria',         desc: 'Antusias dan energik, banyak emoji' },
];

const MODES = [
  { value: 'off',                   label: 'Off',               desc: 'Bot tidak aktif', color: 'var(--text-muted)' },
  { value: 'simulator_only',        label: 'Simulator Only',    desc: 'Hanya bisa test di simulator', color: 'var(--accent)' },
  { value: 'draft_only',            label: 'Draft Mode',        desc: 'Bot buat draft balasan (tidak auto-kirim)', color: 'var(--brand)' },
  { value: 'auto_reply',            label: 'Balas Otomatis',        desc: 'Bot balas otomatis ke WA pelanggan', color: 'var(--brand)' },
];

export default function BotSettings() {
  const [form, setForm]     = useState({
    tone: 'ramah', mode: 'simulator_only', bot_name: '',
    outside_hours_message: '', fallback_message: '',
    handoff_keywords: [], enabled: false,
  });
  const [kwInput, setKwInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    botApi.getSettings().then(r => {
      const s = r.data.settings;
      setForm({
        tone:                  s.tone || 'ramah',
        mode:                  s.mode || 'simulator_only',
        bot_name:              s.bot_name || '',
        outside_hours_message: s.outside_hours_message || '',
        fallback_message:      s.fallback_message || '',
        handoff_keywords:      s.handoff_keywords || [],
        enabled:               s.enabled || false,
      });
      setReadiness(r.data.readiness);
    }).finally(() => setLoading(false));
  }, []);

  const addKeyword = () => {
    const kw = kwInput.trim().toLowerCase();
    if (!kw || form.handoff_keywords.includes(kw)) return;
    setForm(f => ({ ...f, handoff_keywords: [...f.handoff_keywords, kw] }));
    setKwInput('');
  };

  const removeKeyword = kw => {
    setForm(f => ({ ...f, handoff_keywords: f.handoff_keywords.filter(k => k !== kw) }));
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await botApi.updateSettings(form);
      toast.success('Pengaturan Asisten berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Pengaturan Asisten</h1>
          <p>Konfigurasi persona, mode, dan perilaku bot</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : <><Save size={15} /> Simpan</>}
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Status */}
            <div className="card">
              <div className="card-title"><Bot size={16} /> Status Bot</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Aktifkan Bot</div>
                  <div className="text-sm text-muted">Bot akan memproses pesan masuk</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.enabled}
                  onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                  title={form.enabled ? 'Bot aktif' : 'Bot nonaktif'}
                  style={{
                    position: 'relative',
                    width: 48,
                    height: 26,
                    border: 0,
                    padding: 0,
                    borderRadius: 99,
                    cursor: 'pointer',
                    background: form.enabled ? 'var(--brand)' : 'var(--border)',
                    transition: 'background 0.2s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: form.enabled ? 25 : 3,
                      width: 20,
                      height: 20,
                      background: '#fff',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              <div className="field">
                <label>Nama Bot</label>
                <input placeholder="Contoh: Sari, Hana, Admin"
                  value={form.bot_name}
                  onChange={e => setForm(f => ({ ...f, bot_name: e.target.value }))} />
                <div className="field-hint">Nama ini yang akan muncul saat bot memperkenalkan diri</div>
              </div>
            </div>

            {/* Mode */}
            <div className="card">
              <div className="card-title">Mode Bot</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MODES.map(m => (
                  <div
                    key={m.value}
                    onClick={() => setForm(f => ({ ...f, mode: m.value }))}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `2px solid ${form.mode === m.value ? m.color : 'var(--border)'}`,
                      background: form.mode === m.value ? 'var(--brand-light)' : 'var(--bg)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  </div>
                ))}
              </div>
              {readiness && !readiness.can_auto_reply && form.mode === 'auto_reply' && (
                <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
                  ⚠ Readiness score {readiness.score}/100. Minimal 80 untuk balas otomatis.
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tone */}
            <div className="card">
              <div className="card-title">Gaya Bahasa Bot</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TONES.map(t => (
                  <div
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `2px solid ${form.tone === t.value ? 'var(--brand)' : 'var(--border)'}`,
                      background: form.tone === t.value ? 'var(--brand-light)' : 'var(--bg)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="card">
              <div className="card-title">Pesan Otomatis</div>
              <div className="field">
                <label>Pesan di luar jam operasional</label>
                <textarea rows={3}
                  placeholder="Halo kak! Saat ini kami sedang tutup. Kami akan balas segera saat buka ya 🙏"
                  value={form.outside_hours_message}
                  onChange={e => setForm(f => ({ ...f, outside_hours_message: e.target.value }))} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Fallback message</label>
                <textarea rows={3}
                  placeholder="Maaf kak, untuk pertanyaan ini silakan hubungi admin kami ya 🙏"
                  value={form.fallback_message}
                  onChange={e => setForm(f => ({ ...f, fallback_message: e.target.value }))} />
                <div className="field-hint">Pesan ini muncul saat bot tidak bisa menjawab</div>
              </div>
            </div>

            {/* Handoff Keywords */}
            <div className="card">
              <div className="card-title">Kata Kunci Oper ke Admin <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>(Opsional)</span></div>
              <p style={{ fontSize: '0.82rem', marginBottom: 12 }}>
                Opsional. Jika pelanggan menyebut kata-kata ini, bot akan lebih cepat mengarahkan percakapan ke admin manusia. Tidak wajib untuk mengaktifkan balas otomatis.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {form.handoff_keywords.map(kw => (
                  <span key={kw} className="badge badge-red" style={{ padding: '5px 10px' }}>
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {form.handoff_keywords.length === 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    Belum ada keyword
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Tambah keyword..."
                  value={kwInput}
                  onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addKeyword}>
                  <Plus size={14} /> Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
