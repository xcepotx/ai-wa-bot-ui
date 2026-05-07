import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { shopApi } from '../../api/client';
import toast from 'react-hot-toast';
import { Save, Store, CreditCard } from 'lucide-react';

export default function Shop() {
  const { user } = useOutletContext();
  const [tab, setTab]       = useState('profile');
  const [shopForm, setShopForm] = useState({
    name: '', description: '', business_type: '',
    whatsapp: '', address: '', hours: '', about: '', is_active: true,
  });
  const [payForm, setPayForm] = useState({
    qris_available: false, qris_image_url: '',
    bank_accounts: [], cod_available: false,
    payment_notes: '', instruction: '',
  });
  const [botProfileForm, setBotProfileForm] = useState({
    order_methods: [], service_area: '', min_order: '',
    preorder_policy: '', store_notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [isNew, setIsNew]     = useState(false);

  useEffect(() => {
    if (!user?.shop_id) {
      setIsNew(true);
      setLoading(false);
      return;
    }
    Promise.all([
      shopApi.get(),
      shopApi.getPayment(),
      shopApi.getBotProfile(),
    ]).then(([s, p, bp]) => {
      const shop = s.data.shop;
      setShopForm({
        name:          shop.name || '',
        description:   shop.description || '',
        business_type: shop.business_type || '',
        whatsapp:      shop.whatsapp || '',
        address:       shop.address || '',
        hours:         shop.hours || '',
        about:         shop.about || '',
        is_active:     shop.is_active ?? true,
      });
      const pay = p.data.payment;
      setPayForm({
        qris_available: pay.qris_available || false,
        qris_image_url: pay.qris_image_url || '',
        bank_accounts:  pay.bank_accounts || [],
        cod_available:  pay.cod_available || false,
        payment_notes:  pay.payment_notes || '',
        instruction:    pay.instruction || '',
      });
      const bpp = bp.data.profile;
      setBotProfileForm({
        order_methods:  bpp.order_methods || [],
        service_area:   bpp.service_area || '',
        min_order:      bpp.min_order || '',
        preorder_policy: bpp.preorder_policy || '',
        store_notes:    bpp.store_notes || '',
      });
    }).finally(() => setLoading(false));
  }, [user]);

  const saveShop = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await shopApi.create(shopForm);
        toast.success('Toko berhasil dibuat! Refresh halaman ya.');
        window.location.reload();
      } else {
        await shopApi.update(shopForm);
        toast.success('Profil toko berhasil disimpan');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await shopApi.updatePayment(payForm);
      toast.success('Info pembayaran disimpan');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const saveBotProfile = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await shopApi.updateBotProfile({
        ...botProfileForm,
        min_order: botProfileForm.min_order ? parseInt(botProfileForm.min_order) : null,
      });
      toast.success('Data operasional disimpan');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const toggleOrderMethod = method => {
    setBotProfileForm(f => ({
      ...f,
      order_methods: f.order_methods.includes(method)
        ? f.order_methods.filter(m => m !== method)
        : [...f.order_methods, method],
    }));
  };

  if (loading) return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
    </div>
  );

  const TABS = [
    { key: 'profile', label: '🏪 Profil Toko' },
    { key: 'payment', label: '💳 Pembayaran' },
    { key: 'operational', label: '🚚 Operasional' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{isNew ? 'Setup Toko' : 'Profil Toko'}</h1>
          <p>{isNew ? 'Isi informasi dasar toko kamu' : 'Kelola informasi toko yang ditampilkan ke pelanggan'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className="btn btn-ghost"
            onClick={() => setTab(t.key)}
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: tab === t.key ? '2px solid var(--brand)' : '2px solid transparent',
              color: tab === t.key ? 'var(--brand)' : 'var(--text-muted)',
              fontWeight: tab === t.key ? 700 : 400,
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title"><Store size={16} /> Informasi Toko</div>
          <form onSubmit={saveShop}>
            <div className="grid-2">
              <div className="field">
                <label>Nama Toko *</label>
                <input required placeholder="Warung Bu Sari" value={shopForm.name}
                  onChange={e => setShopForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="field">
                <label>Jenis Usaha</label>
                <select value={shopForm.business_type}
                  onChange={e => setShopForm(f => ({ ...f, business_type: e.target.value }))}>
                  <option value="">Pilih jenis usaha</option>
                  {['Kuliner','Fashion','Jasa','Elektronik','Kecantikan','Kesehatan','Pendidikan','Lainnya']
                    .map(v => <option key={v} value={v.toLowerCase()}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Deskripsi Toko</label>
              <textarea rows={3} placeholder="Ceritakan tentang toko kamu..."
                value={shopForm.description}
                onChange={e => setShopForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Nomor WhatsApp</label>
                <input placeholder="628123456789" value={shopForm.whatsapp}
                  onChange={e => setShopForm(f => ({ ...f, whatsapp: e.target.value }))} />
                <div className="field-hint">Format: 628xxx (tanpa +)</div>
              </div>
              <div className="field">
                <label>Jam Operasional</label>
                <input placeholder="Senin-Sabtu 08:00-21:00" value={shopForm.hours}
                  onChange={e => setShopForm(f => ({ ...f, hours: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Alamat</label>
              <input placeholder="Jl. Contoh No. 1, Kota" value={shopForm.address}
                onChange={e => setShopForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="field">
              <label>About Toko</label>
              <textarea rows={2} placeholder="Info singkat untuk bot..."
                value={shopForm.about}
                onChange={e => setShopForm(f => ({ ...f, about: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <><Save size={15} /> {isNew ? 'Buat Toko' : 'Simpan'}</>}
            </button>
          </form>
        </div>
      )}

      {/* Payment Tab */}
      {tab === 'payment' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title"><CreditCard size={16} /> Info Pembayaran</div>
          <form onSubmit={savePayment}>
            <div className="field">
              <label>Instruksi Pembayaran</label>
              <textarea rows={3} placeholder="Contoh: Transfer ke BCA 1234567890 a.n. Bu Sari, lalu konfirmasi via WA"
                value={payForm.instruction}
                onChange={e => setPayForm(f => ({ ...f, instruction: e.target.value }))} />
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {[
                { key: 'qris_available', label: 'QRIS tersedia' },
                { key: 'cod_available',  label: 'COD tersedia' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0, fontWeight: 400 }}>
                  <input type="checkbox" checked={payForm[key]}
                    onChange={e => setPayForm(f => ({ ...f, [key]: e.target.checked }))}
                    style={{ width: 'auto' }} />
                  {label}
                </label>
              ))}
            </div>

            <div className="field">
              <label>Catatan Pembayaran</label>
              <textarea rows={2} placeholder="Konfirmasi transfer via WA setelah bayar ya kak"
                value={payForm.payment_notes}
                onChange={e => setPayForm(f => ({ ...f, payment_notes: e.target.value }))} />
            </div>

            {/* Bank accounts */}
            <div className="field">
              <label>Rekening Bank</label>
              {payForm.bank_accounts.map((acc, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input placeholder="Bank" value={acc.bank} style={{ width: 80 }}
                    onChange={e => {
                      const accs = [...payForm.bank_accounts];
                      accs[i] = { ...accs[i], bank: e.target.value };
                      setPayForm(f => ({ ...f, bank_accounts: accs }));
                    }} />
                  <input placeholder="No. Rekening" value={acc.number}
                    onChange={e => {
                      const accs = [...payForm.bank_accounts];
                      accs[i] = { ...accs[i], number: e.target.value };
                      setPayForm(f => ({ ...f, bank_accounts: accs }));
                    }} />
                  <input placeholder="Nama" value={acc.name}
                    onChange={e => {
                      const accs = [...payForm.bank_accounts];
                      accs[i] = { ...accs[i], name: e.target.value };
                      setPayForm(f => ({ ...f, bank_accounts: accs }));
                    }} />
                  <button type="button" className="btn btn-danger btn-sm"
                    onClick={() => setPayForm(f => ({ ...f, bank_accounts: f.bank_accounts.filter((_, j) => j !== i) }))}>
                    Hapus
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => setPayForm(f => ({ ...f, bank_accounts: [...f.bank_accounts, { bank: '', number: '', name: '' }] }))}>
                + Tambah Rekening
              </button>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <><Save size={15} /> Simpan</>}
            </button>
          </form>
        </div>
      )}

      {/* Operational Tab */}
      {tab === 'operational' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title">🚚 Data Operasional Toko</div>
          <form onSubmit={saveBotProfile}>
            <div className="field">
              <label>Metode Order</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['pickup', 'delivery', 'cod'].map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontWeight: 400 }}>
                    <input type="checkbox"
                      checked={botProfileForm.order_methods.includes(m)}
                      onChange={() => toggleOrderMethod(m)}
                      style={{ width: 'auto' }} />
                    {m}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Area Layanan</label>
                <input placeholder="Contoh: Buah Batu, Bandung"
                  value={botProfileForm.service_area}
                  onChange={e => setBotProfileForm(f => ({ ...f, service_area: e.target.value }))} />
              </div>
              <div className="field">
                <label>Minimum Order (Rp)</label>
                <input type="number" placeholder="20000"
                  value={botProfileForm.min_order}
                  onChange={e => setBotProfileForm(f => ({ ...f, min_order: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Kebijakan Preorder</label>
              <input placeholder="PO dibuka setiap Senin-Jumat"
                value={botProfileForm.preorder_policy}
                onChange={e => setBotProfileForm(f => ({ ...f, preorder_policy: e.target.value }))} />
            </div>
            <div className="field">
              <label>Catatan Toko</label>
              <textarea rows={3} placeholder="Info penting lain yang perlu diketahui bot..."
                value={botProfileForm.store_notes}
                onChange={e => setBotProfileForm(f => ({ ...f, store_notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <><Save size={15} /> Simpan</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
