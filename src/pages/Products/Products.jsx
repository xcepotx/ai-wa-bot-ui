import { useState, useEffect } from 'react';
import { shopApi } from '../../api/client';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Star, Tag } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({
    name: '', price: '', stock: '', description: '',
    category: '', is_active: true, is_available: true,
    is_recommended: false, promo_label: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    shopApi.listProducts()
      .then(r => setProducts(r.data.products))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setForm({ name:'', price:'', stock:'', description:'', category:'',
      is_active:true, is_available:true, is_recommended:false, promo_label:'' });
    setModal('create');
  };

  const openEdit = p => {
    setForm({ ...p, price: p.price || '', stock: p.stock || '' });
    setModal(p);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: parseInt(form.price) || 0, stock: parseInt(form.stock) || 0 };
    try {
      if (modal === 'create') {
        await shopApi.createProduct(payload);
        toast.success('Produk berhasil ditambahkan');
      } else {
        await shopApi.updateProduct(modal.product_id, payload);
        toast.success('Produk berhasil diupdate');
      }
      load();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async p => {
    if (!window.confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await shopApi.deleteProduct(p.product_id);
      toast.success('Produk dihapus');
      load();
    } catch {
      toast.error('Gagal menghapus produk');
    }
  };

  const formatRp = v => `Rp ${parseInt(v || 0).toLocaleString('id-ID')}`;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Produk</h1>
          <p>{products.length} produk — minimal 3 untuk readiness bot</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Tambah Produk
        </button>
      </div>

      {products.length < 3 && (
        <div className="alert alert-warning mb-4">
          ⚠ Tambahkan minimal {3 - products.length} produk lagi untuk meningkatkan readiness score
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>Belum ada produk</h3>
            <p>Tambahkan produk agar bot bisa menjawab pertanyaan menu dan harga</p>
            <button className="btn btn-primary mt-4" onClick={openCreate}>
              <Plus size={15} /> Tambah Produk Pertama
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama Produk</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Label</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.product_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && (
                        <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                          {p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatRp(p.price)}</td>
                    <td>{p.stock || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                        <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {!p.is_available && (
                          <span className="badge badge-red">Habis</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {p.is_recommended && <span className="badge badge-yellow"><Star size={10} /> Rekomendasi</span>}
                      {p.promo_label && <span className="badge badge-blue"><Tag size={10} /> {p.promo_label}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>{modal === 'create' ? 'Tambah Produk' : 'Edit Produk'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="field">
                  <label>Nama Produk *</label>
                  <input required placeholder="Nasi Goreng Spesial" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Kategori</label>
                  <input placeholder="Makanan, Minuman, dll" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Harga (Rp) *</label>
                  <input required type="number" min="0" placeholder="15000" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Stok</label>
                  <input type="number" min="0" placeholder="0" value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Deskripsi</label>
                <textarea rows={2} placeholder="Deskripsi singkat produk..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="field">
                <label>Promo Label</label>
                <input placeholder="Contoh: Diskon 10%, Best Seller" value={form.promo_label}
                  onChange={e => setForm(f => ({ ...f, promo_label: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {[
                  { key: 'is_active',      label: 'Produk Aktif' },
                  { key: 'is_available',   label: 'Tersedia/Ada Stok' },
                  { key: 'is_recommended', label: 'Rekomendasi' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontWeight: 400, fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      style={{ width: 'auto' }} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
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
