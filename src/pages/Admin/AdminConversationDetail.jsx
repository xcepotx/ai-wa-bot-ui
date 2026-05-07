import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminConversationDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [shop, setShop] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setError('');
    try {
      const res = await adminApi.conversationDetail(sessionId);
      setSession(res.data.session);
      setMessages(res.data.messages || []);
      setShop(res.data.shop || null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat detail');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handoff() {
    const note = window.prompt('Catatan handoff:', 'Admin menandai perlu handoff.');
    if (note === null) return;
    setBusy(true);
    try {
      await adminApi.markHandoff(sessionId, note);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function resolve() {
    const note = window.prompt('Catatan resolve:', 'Admin menandai conversation selesai.');
    if (note === null) return;
    setBusy(true);
    try {
      await adminApi.resolve(sessionId, note);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={styles.topbar}>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/conversations')}>← Kembali</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" disabled={busy} onClick={handoff}>Mark Handoff</button>
          <button className="btn btn-primary" disabled={busy} onClick={resolve}>Mark Resolved</button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {session && (
        <div style={styles.headerCard}>
          <div>
            <p style={styles.eyebrow}>Conversation Detail</p>
            <h1 style={styles.title}>{session.customer_name || session.customer_phone || session.session_id}</h1>
            <p style={styles.subtitle}>{shop?.name || session.shop_id} · {session.status} · {session.last_intent || '-'}</p>
          </div>
          <div style={styles.metaBox}>
            <div><strong>Session:</strong> {session.session_id}</div>
            <div><strong>Shop:</strong> {session.shop_id}</div>
            <div><strong>Updated:</strong> {formatDate(session.updated_at)}</div>
          </div>
        </div>
      )}

      <div style={styles.chatCard}>
        {messages.map((msg) => {
          const isCustomer = msg.role === 'customer';
          const isBot = msg.role === 'bot';

          return (
            <div key={msg.message_id} style={{ ...styles.row, justifyContent: isCustomer ? 'flex-start' : 'flex-end' }}>
              <div style={{
                ...styles.bubble,
                background: isCustomer ? '#fff' : isBot ? '#dbeafe' : '#fef3c7',
              }}>
                <div style={styles.bubbleMeta}>
                  <strong>{msg.role}</strong>
                  <span>{formatDate(msg.created_at)}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{msg.text}</div>
                <div style={styles.smallMeta}>
                  {msg.intent && <span>Intent: {msg.intent}</span>}
                  {msg.confidence && <span>Confidence: {msg.confidence}</span>}
                  {msg.source && <span>Source: {msg.source}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && <div style={styles.empty}>Belum ada message.</div>}
      </div>
    </div>
  );
}

const styles = {
  topbar: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 },
  headerCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  eyebrow: { margin: 0, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13 },
  title: { margin: '4px 0', fontSize: 28 },
  subtitle: { margin: 0, color: '#64748b' },
  metaBox: { background: '#f8fafc', borderRadius: 14, padding: 12, fontSize: 13, color: '#334155' },
  chatCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, minHeight: 420 },
  row: { display: 'flex', marginBottom: 12 },
  bubble: { maxWidth: '74%', border: '1px solid #e2e8f0', borderRadius: 16, padding: 13 },
  bubbleMeta: { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: '#64748b', marginBottom: 8 },
  smallMeta: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, fontSize: 12, color: '#64748b' },
  error: { background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12, marginBottom: 14 },
  empty: { padding: 20, color: '#64748b', textAlign: 'center' },
};
