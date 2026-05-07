import { useState, useEffect } from 'react';
import { faqApi } from '../../api/client';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, MessageSquare, X, Check } from 'lucide-react';

const CATEGORIES = [
  'produk','harga','payment','jam_buka','lokasi',
  'delivery','pickup','promo','preorder','komplain','lainnya'
];

export default function FAQs() {
  const [faqs, setFaqs]       = useState([]);
  const [loading, setLoading]  = useState(true);
  const [modal, setModal]      = useState(null); // null | 'create' | faq object
  const [form, setForm]        = useState({ question: '', answer: '', category: 'lainnya' });
  const [saving, setSaving]    = useState(false);

  const load = () => {
    faqApi.list()
      .then(r => setFaqs(r.data.faqs))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setForm({ question: '', answer: '', category: 'lainnya' });
    setModal('create');
  };

  const openEdit = faq => {
    setForm({ question: faq.question, answer: faq.answer, category: faq.category });
    setModal(faq);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await faqApi.create(form);
        toast.success('FAQ berhasil ditambahkan');
      } else {
        await faqApi.update(modal.faq_id, form);
        toast.success('FAQ berhasil diupdate');
      }
      load();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async faq => {
    if (!window.confirm(`Hapus FAQ "${faq.question}"?`)) return;
    try {
      await faqApi.delete(faq.faq_id);
      toast.success('FAQ dihapus');
      load();
    } catch {
      toast.error('Gagal menghapus FAQ');
    }
  };

  const toggleActive = async faq => {
    try {
      await faqApi.update(faq.faq_id, { ...faq, is_active: !faq.is_active });
      load();
    } catch {
      toast.error('Gagal update FAQ');
    }
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = faqs.filter(f => f.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Knowledge Asisten</h1>
          <p>{faqs.length} FAQ terdaftar — minimal 5 untuk skor readiness penuh</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Tambah FAQ
        </button>
      </div>

      {faqs.length < 5 && (
        <div className="alert alert-warning mb-4">
          ⚠ Tambahkan minimal {5 - faqs.length} FAQ lagi untuk meningkatkan readiness score
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : faqs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>Belum ada FAQ</h3>
            <p>Tambahkan FAQ agar bot bisa menjawab pertanyaan umum pelanggan dengan akurat</p>
            <button className="btn btn-primary mt-4" onClick={openCreate}>
              <Plus size={15} /> Tambah FAQ Pertama
            </button>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="card mb-4">
            <div className="card-title">
              <MessageSquare size={16} />
              {cat.replace('_', ' ').toUpperCase()}
              <span className="badge badge-gray" style={{ marginLeft: 4 }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(faq => (
                <div key={faq.faq_id} style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: `1.5px solid ${faq.is_active ? 'var(--border)' : '#fecaca'}`,
                  background: faq.is_active ? 'var(--bg)' : '#fef2f2',
                  opacity: faq.is_active ? 1 : 0.7,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
                        Q: {faq.question}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        A: {faq.answer}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => toggleActive(faq)}
                        title={faq.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {faq.is_active ? <Check size={14} color="var(--brand)" /> : <X size={14} color="var(--danger)" />}
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(faq)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(faq)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{modal === 'create' ? 'Tambah FAQ' : 'Edit FAQ'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Pertanyaan pelanggan</label>
                <input required placeholder="Contoh: Apakah bisa delivery?" value={form.question}
                  onChange={e => setForm({ ...form, question: e.target.value })} />
              </div>
              <div className="field">
                <label>Jawaban bot</label>
                <textarea required rows={4} placeholder="Jawaban yang akan diberikan bot..."
                  value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} />
              </div>
              <div className="field">
                <label>Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
