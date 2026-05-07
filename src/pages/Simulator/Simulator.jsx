import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bot, Send, RotateCcw, Inbox, User, AlertTriangle } from 'lucide-react';
import { botApi, shopApi } from '../../api/client';

function formatTime(date = new Date()) {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status) {
  const map = {
    bot_replied: 'Dijawab Bot',
    handoff: 'Perlu Handoff',
    resolved: 'Resolved',
    failed: 'Failed',
    open: 'Open',
  };
  return map[status] || status || '-';
}

export default function Simulator() {
  const [shop, setShop] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [customerName, setCustomerName] = useState('Budi');
  const [customerPhone, setCustomerPhone] = useState('+6281111111111');
  const [messages, setMessages] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    shopApi.get()
      .then((res) => setShop(res.data.shop || res.data))
      .catch(() => toast.error('Gagal memuat toko'))
      .finally(() => setLoadingShop(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  function startNewSession() {
    setSessionId('');
    setMessages([]);
    setLastResult(null);
    setMessage('');
    toast.success('Session simulator baru dibuat');
  }

  async function submit(e) {
    e.preventDefault();

    const text = message.trim();
    if (!text) return;

    if (!shop?.shop_id) {
      toast.error('Shop ID tidak ditemukan');
      return;
    }

    const now = new Date();

    setMessages((prev) => [
      ...prev,
      {
        id: `local_customer_${Date.now()}`,
        role: 'customer',
        text,
        created_at: now.toISOString(),
      },
    ]);

    setMessage('');
    setSending(true);

    try {
      const payload = {
        shop_id: shop.shop_id,
        customer_message: text,
        customer_name: customerName || 'Pelanggan',
        customer_phone: customerPhone || undefined,
      };

      if (sessionId) {
        payload.session_id = sessionId;
      }

      const res = await botApi.simulate(payload);
      const data = res.data;

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      setLastResult(data);

      setMessages((prev) => [
        ...prev,
        {
          id: `local_bot_${Date.now()}`,
          role: 'bot',
          text: data.bot_reply || '-',
          created_at: new Date().toISOString(),
          intent: data.intent,
          confidence: data.confidence,
          source: data.source,
          status: data.status,
          handoff_required: data.handoff_required,
          response_ms: data.response_ms,
        },
      ]);

      try {
        await botApi.simulatePing();
      } catch (_) {
        // not critical
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Simulasi gagal';
      toast.error(msg);

      setMessages((prev) => [
        ...prev,
        {
          id: `local_error_${Date.now()}`,
          role: 'system',
          text: msg,
          created_at: new Date().toISOString(),
          status: 'failed',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const quickPrompts = [
    'Produk apa aja yang tersedia?',
    'Bakso urat ada?',
    'Kalau 2 berapa?',
    'Bisa bayar QRIS?',
    'Saya mau bicara sama owner',
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Simulator AI WA Bot</h1>
          <p>Test multi-turn conversation sebelum bot dipakai di WhatsApp real.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/dashboard/inbox" className="btn btn-secondary">
            <Inbox size={16} />
            Buka Inbox
          </Link>
          <button className="btn btn-secondary" onClick={startNewSession}>
            <RotateCcw size={16} />
            Session Baru
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: 16,
        alignItems: 'start',
      }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: 18,
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                {loadingShop ? 'Memuat toko...' : shop?.name || 'Toko'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 3 }}>
                Session: {sessionId || 'Belum mulai'}
              </div>
            </div>

            {lastResult?.status && (
              <span style={{
                background: lastResult.status === 'handoff' ? '#ffedd5' : '#dbeafe',
                color: lastResult.status === 'handoff' ? '#9a3412' : '#075985',
                padding: '6px 10px',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: '0.75rem',
              }}>
                {statusLabel(lastResult.status)}
              </span>
            )}
          </div>

          <div style={{
            minHeight: 460,
            maxHeight: 560,
            overflowY: 'auto',
            padding: 18,
            background: '#f8fafc',
          }}>
            {messages.length === 0 ? (
              <div style={{
                minHeight: 420,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                <div>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: '#dcfce7',
                    color: '#16a34a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <Bot size={26} />
                  </div>
                  <h3 style={{ margin: '0 0 6px' }}>Mulai simulasi chat</h3>
                  <p style={{ margin: 0 }}>
                    Kirim pesan pertama, lalu lanjutkan pesan kedua dalam session yang sama.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.role === 'customer';
                const isBot = msg.role === 'bot';
                const isSystem = msg.role === 'system';

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isCustomer ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{
                      maxWidth: '76%',
                      borderRadius: 16,
                      padding: '12px 14px',
                      background: isCustomer ? '#16a34a' : isSystem ? '#fef3c7' : '#fff',
                      color: isCustomer ? '#fff' : 'var(--text)',
                      border: isCustomer ? 'none' : '1px solid var(--border)',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        marginBottom: 6,
                      }}>
                        {isCustomer ? <User size={13} /> : isBot ? <Bot size={13} /> : <AlertTriangle size={13} />}
                        <strong>{isCustomer ? customerName || 'Pelanggan' : isBot ? 'AI WA Bot' : 'System'}</strong>
                        <span>·</span>
                        <span>{formatTime(msg.created_at)}</span>
                      </div>

                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {msg.text}
                      </div>

                      {(msg.intent || msg.confidence || msg.source || msg.response_ms) && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginTop: 10,
                          fontSize: '0.72rem',
                          color: isCustomer ? 'rgba(255,255,255,0.86)' : 'var(--text-muted)',
                        }}>
                          {msg.intent && <span>Intent: {msg.intent}</span>}
                          {msg.confidence && <span>Confidence: {msg.confidence}</span>}
                          {msg.source && <span>Source: {msg.source}</span>}
                          {msg.response_ms && <span>{msg.response_ms}ms</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  color: 'var(--text-muted)',
                }}>
                  Bot sedang mengetik...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={submit}
            style={{
              display: 'flex',
              gap: 10,
              padding: 14,
              borderTop: '1px solid var(--border)',
              background: '#fff',
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan pelanggan..."
              disabled={sending || loadingShop}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: '0.92rem',
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || loadingShop || !message.trim()}
            >
              <Send size={16} />
              Kirim
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Data Simulasi</h3>

            <label className="form-label">Nama Customer</label>
            <input
              className="form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Budi"
            />

            <div style={{ height: 10 }} />

            <label className="form-label">Nomor Customer</label>
            <input
              className="form-input"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+628..."
            />

            <div style={{ height: 14 }} />

            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 12,
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}>
              <div><strong>Shop ID:</strong> {shop?.shop_id || '-'}</div>
              <div style={{ marginTop: 4 }}><strong>Session:</strong> {sessionId || '-'}</div>
              <div style={{ marginTop: 4 }}><strong>Pesan:</strong> {messages.length}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Quick Test</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setMessage(prompt)}
                  style={{
                    textAlign: 'left',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    color: 'var(--text)',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Catatan</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 0 }}>
              Semua pesan simulator sekarang tersimpan sebagai conversation session.
              Setelah kirim pesan, buka Inbox untuk melihat riwayat dan melakukan handoff/resolve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
