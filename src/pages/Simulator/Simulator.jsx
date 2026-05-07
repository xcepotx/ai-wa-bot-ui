import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { botApi } from '../../api/client';
import toast from 'react-hot-toast';
import { Send, Bot, User, Zap, RefreshCw, Info } from 'lucide-react';

export default function Simulator() {
  const { user } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const QUICK_TESTS = [
    'Menu apa aja yang tersedia?',
    'Berapa harga produk terlaris?',
    'Bisa delivery tidak?',
    'Cara pembayarannya gimana?',
    'Jam buka sampai jam berapa?',
    'Saya mau komplain pesanan',
  ];

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const shopId = user?.shop_id;
    if (!shopId) {
      toast.error('Buat toko dulu sebelum mencoba simulator');
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const r = await botApi.simulate({
        shop_id: shopId,
        customer_message: msg,
        session_id: sessionId,
      });

      const d = r.data;
      if (!sessionId) setSessionId(d.session_id);

      setMessages(prev => [...prev, {
        role: 'bot',
        text: d.bot_reply,
        meta: {
          intent:   d.intent,
          source:   d.source,
          ms:       d.response_ms,
          handoff:  d.handoff_required,
          confidence: d.confidence,
        },
      }]);

      // Tandai sudah simulasi
      botApi.simulatePing().catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengirim pesan');
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '❌ Terjadi error. Coba lagi.',
        meta: { source: 'error' },
      }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setSessionId(null);
    toast.success('Sesi simulator direset');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Simulator Bot</h1>
          <p>Test respons bot sebelum aktifkan di WhatsApp</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={reset}>
          <RefreshCw size={14} /> Reset Sesi
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Chat Window */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI WA Bot</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--brand)' }}>● Online — Simulator Mode</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            height: 460, overflowY: 'auto',
            padding: '20px',
            background: '#f0f4f8',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Bot size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Kirim pesan untuk test respons bot
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: 8, alignItems: 'flex-end',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--brand)' : '#fff',
                  border: '1.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'user'
                    ? <User size={14} color="#fff" />
                    : <Bot size={14} color="var(--brand)" />
                  }
                </div>

                <div style={{ maxWidth: '72%' }}>
                  {/* Bubble */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? 'var(--brand)' : '#fff',
                    color: msg.role === 'user' ? '#fff' : 'var(--text)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    boxShadow: 'var(--shadow-sm)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>

                  {/* Meta */}
                  {msg.meta && msg.role === 'bot' && (
                    <div style={{
                      display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap',
                    }}>
                      <span className="badge badge-gray">{msg.meta.source}</span>
                      {msg.meta.intent && <span className="badge badge-blue">{msg.meta.intent}</span>}
                      {msg.meta.handoff && <span className="badge badge-red">handoff</span>}
                      {msg.meta.ms && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', alignSelf: 'center' }}>
                          {msg.meta.ms}ms
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#fff', border: '1.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={14} color="var(--brand)" />
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#fff', borderRadius: '18px 18px 18px 4px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--brand)',
                        animation: 'bounce 1.2s ease infinite',
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10,
            background: '#fff',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ketik pesan pelanggan..."
              style={{ flex: 1, borderRadius: 99 }}
              disabled={loading}
            />
            <button
              className="btn btn-primary btn-icon"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ borderRadius: '50%', width: 42, height: 42, padding: 0, justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Quick test panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">
              <Zap size={16} color="var(--accent)" /> Quick Test
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_TESTS.map(q => (
                <button
                  key={q}
                  className="btn btn-secondary btn-sm"
                  style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.78rem' }}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <Info size={16} color="var(--brand)" /> Keterangan
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 8 }}>
                <span className="badge badge-gray">faq</span> — Jawaban dari FAQ toko
              </div>
              <div style={{ marginBottom: 8 }}>
                <span className="badge badge-blue">llm</span> — Jawaban dari AI
              </div>
              <div style={{ marginBottom: 8 }}>
                <span className="badge badge-red">handoff</span> — Perlu admin manusia
              </div>
              <div>
                <span className="badge badge-gray">keyword_match</span> — Terdeteksi keyword
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
