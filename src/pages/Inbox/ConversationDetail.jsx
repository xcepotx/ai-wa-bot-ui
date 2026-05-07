import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getConversation,
  markConversationHandoff,
  resolveConversation,
} from "../../api/conversations";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (_) {
    return value;
  }
}

function roleLabel(role) {
  if (role === "customer") return "Pelanggan";
  if (role === "bot") return "Bot";
  if (role === "owner") return "Owner";
  if (role === "system") return "System";
  return role || "-";
}

function statusLabel(status) {
  const map = {
    open: "Open",
    bot_replied: "Dijawab Bot",
    handoff: "Perlu Handoff",
    resolved: "Resolved",
    failed: "Failed",
  };
  return map[status] || status || "-";
}

export default function ConversationDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await getConversation(sessionId);
      setSession(data.session || null);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || "Gagal memuat conversation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function markHandoff() {
    const note = window.prompt("Catatan handoff:", "Perlu ditangani owner.");
    if (note === null) return;

    setBusy(true);
    setError("");

    try {
      await markConversationHandoff(sessionId, note);
      await load();
    } catch (err) {
      setError(err.message || "Gagal mark handoff");
    } finally {
      setBusy(false);
    }
  }

  async function resolve() {
    const note = window.prompt("Catatan resolve:", "Sudah selesai ditangani.");
    if (note === null) return;

    setBusy(true);
    setError("");

    try {
      await resolveConversation(sessionId, note);
      await load();
    } catch (err) {
      setError(err.message || "Gagal resolve conversation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={() => navigate("/dashboard/inbox")}>
          ← Kembali
        </button>

        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={markHandoff} disabled={busy}>
            Mark Handoff
          </button>
          <button style={styles.primaryButton} onClick={resolve} disabled={busy}>
            Mark Resolved
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.empty}>Memuat conversation...</div>
      ) : !session ? (
        <div style={styles.empty}>Conversation tidak ditemukan.</div>
      ) : (
        <>
          <div style={styles.headerCard}>
            <div>
              <p style={styles.eyebrow}>Conversation</p>
              <h1 style={styles.title}>{session.customer_name || "Pelanggan"}</h1>
              <p style={styles.subtitle}>
                {session.customer_phone || "-"} · {session.source || "-"}
              </p>
            </div>

            <div style={styles.metaGrid}>
              <div style={styles.metaItem}>
                <span>Status</span>
                <strong>{statusLabel(session.status)}</strong>
              </div>
              <div style={styles.metaItem}>
                <span>Intent</span>
                <strong>{session.last_intent || "-"}</strong>
              </div>
              <div style={styles.metaItem}>
                <span>Messages</span>
                <strong>{session.message_count || messages.length}</strong>
              </div>
              <div style={styles.metaItem}>
                <span>Update</span>
                <strong>{formatDate(session.updated_at)}</strong>
              </div>
            </div>
          </div>

          <div style={styles.chatCard}>
            {messages.length === 0 ? (
              <div style={styles.empty}>Belum ada message.</div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.role === "customer";
                const isBot = msg.role === "bot";
                const isSystem = msg.role === "system";

                return (
                  <div
                    key={msg.message_id}
                    style={{
                      ...styles.messageRow,
                      justifyContent: isCustomer ? "flex-start" : "flex-end",
                    }}
                  >
                    <div
                      style={{
                        ...styles.bubble,
                        ...(isCustomer ? styles.customerBubble : {}),
                        ...(isBot ? styles.botBubble : {}),
                        ...(isSystem ? styles.systemBubble : {}),
                      }}
                    >
                      <div style={styles.bubbleHeader}>
                        <strong>{roleLabel(msg.role)}</strong>
                        <span>{formatDate(msg.created_at)}</span>
                      </div>

                      <div style={styles.messageText}>{msg.text}</div>

                      {(msg.intent || msg.confidence || msg.source) && (
                        <div style={styles.messageMeta}>
                          {msg.intent && <span>Intent: {msg.intent}</span>}
                          {msg.confidence && <span>Confidence: {msg.confidence}</span>}
                          {msg.source && <span>Source: {msg.source}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={styles.footerLinks}>
            <Link to="/dashboard/simulator" style={styles.footerLink}>
              Buka Simulator
            </Link>
            <Link to="/dashboard/inbox" style={styles.footerLink}>
              Kembali ke Inbox
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "16px",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  backButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryButton: {
    border: 0,
    background: "#2563eb",
    color: "#fff",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
  },
  headerCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "16px",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  eyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0",
    fontSize: "28px",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
    gap: "10px",
    minWidth: "360px",
  },
  metaItem: {
    background: "#f8fafc",
    borderRadius: "14px",
    padding: "12px",
  },
  chatCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    minHeight: "420px",
  },
  messageRow: {
    display: "flex",
    marginBottom: "12px",
  },
  bubble: {
    maxWidth: "72%",
    borderRadius: "16px",
    padding: "12px 14px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  customerBubble: {
    background: "#fff",
  },
  botBubble: {
    background: "#dbeafe",
    borderColor: "#bfdbfe",
  },
  systemBubble: {
    background: "#fef3c7",
    borderColor: "#fde68a",
    maxWidth: "90%",
  },
  bubbleHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "12px",
    color: "#475569",
    marginBottom: "8px",
  },
  messageText: {
    whiteSpace: "pre-wrap",
    color: "#0f172a",
    lineHeight: 1.5,
  },
  messageMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
    color: "#475569",
    fontSize: "12px",
  },
  footerLinks: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },
  footerLink: {
    textDecoration: "none",
    color: "#2563eb",
    fontWeight: 800,
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "16px",
  },
  empty: {
    padding: "28px",
    textAlign: "center",
    color: "#64748b",
  },
};
