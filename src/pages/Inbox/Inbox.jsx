import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listConversations } from "../../api/conversations";

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

function statusLabel(status) {
  const map = {
    open: "Open",
    bot_replied: "Dijawab Asisten",
    handoff: "Perlu Owner",
    resolved: "Resolved",
    failed: "Failed",
  };
  return map[status] || status || "-";
}

function statusStyle(status) {
  if (status === "resolved") {
    return { background: "#dcfce7", color: "#166534" };
  }
  if (status === "handoff") {
    return { background: "#ffedd5", color: "#9a3412" };
  }
  if (status === "failed") {
    return { background: "#fee2e2", color: "#991b1b" };
  }
  return { background: "#e0f2fe", color: "#075985" };
}

export default function Inbox() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await listConversations({
        status,
        q,
        limit: 50,
      });

      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Gagal memuat inbox");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const stats = useMemo(() => {
    return {
      handoff: items.filter((x) => x.status === "handoff").length,
      resolved: items.filter((x) => x.status === "resolved").length,
      active: items.filter((x) => x.status !== "resolved").length,
    };
  }, [items]);

  function submitSearch(e) {
    e.preventDefault();
    setQ(queryInput.trim());
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Lapakin Asisten</p>
          <h1 style={styles.title}>Inbox Percakapan</h1>
          <p style={styles.subtitle}>
            Pantau hasil simulator, status handoff, dan riwayat chat pelanggan.
          </p>
        </div>

        <button style={styles.refreshButton} onClick={load} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total</div>
          <div style={styles.statValue}>{total}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Aktif</div>
          <div style={styles.statValue}>{stats.active}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Handoff</div>
          <div style={styles.statValue}>{stats.handoff}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Resolved</div>
          <div style={styles.statValue}>{stats.resolved}</div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <form onSubmit={submitSearch} style={styles.searchForm}>
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Cari nama, nomor, atau pesan..."
            style={styles.input}
          />
          <button type="submit" style={styles.primaryButton}>
            Cari
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={styles.select}
        >
          <option value="">Semua Status</option>
          <option value="bot_replied">Dijawab Asisten</option>
          <option value="handoff">Perlu Owner</option>
          <option value="resolved">Resolved</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.empty}>Memuat inbox...</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>
            Belum ada percakapan. Jalankan simulator dulu untuk membuat session.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Pesan Terakhir</th>
                  <th style={styles.th}>Balasan Asisten</th>
                  <th style={styles.th}>Intent</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Update</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.session_id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.customerName}>
                        {item.customer_name || "Pelanggan"}
                      </div>
                      <div style={styles.customerPhone}>
                        {item.customer_phone || item.source || "-"}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.clip}>{item.last_message || "-"}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.clip}>{item.last_reply || "-"}</div>
                    </td>
                    <td style={styles.td}>
                      <code style={styles.code}>{item.last_intent || "-"}</code>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...statusStyle(item.status) }}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(item.updated_at)}</td>
                    <td style={styles.td}>
                      <Link to={`/dashboard/inbox/${item.session_id}`} style={styles.linkButton}>
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1280px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "20px",
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
    fontSize: "30px",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
  },
  refreshButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  statLabel: {
    color: "#64748b",
    fontSize: "13px",
  },
  statValue: {
    fontSize: "26px",
    fontWeight: 800,
    marginTop: "4px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
  },
  searchForm: {
    display: "flex",
    gap: "8px",
    flex: 1,
  },
  input: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 12px",
    background: "#fff",
  },
  primaryButton: {
    border: 0,
    background: "#2563eb",
    color: "#fff",
    borderRadius: "12px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f8fafc",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "14px",
    verticalAlign: "top",
  },
  customerName: {
    fontWeight: 800,
  },
  customerPhone: {
    color: "#64748b",
    fontSize: "12px",
    marginTop: "3px",
  },
  clip: {
    maxWidth: "280px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    color: "#334155",
  },
  code: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "12px",
  },
  badge: {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  linkButton: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: 700,
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
