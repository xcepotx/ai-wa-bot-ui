import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { providerApi } from '../../api/client';

function statusMeta(status) {
  if (status === 'ready') {
    return {
      label: 'Siap Connect Provider',
      color: '#166534',
      bg: '#dcfce7',
      icon: CheckCircle2,
    };
  }

  if (status === 'blocked') {
    return {
      label: 'Terblokir',
      color: '#991b1b',
      bg: '#fee2e2',
      icon: XCircle,
    };
  }

  return {
    label: 'Perlu Setup',
    color: '#92400e',
    bg: '#fef3c7',
    icon: AlertCircle,
  };
}

export default function ProviderReadiness() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');

    try {
      const res = await providerApi.readiness();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat provider readiness');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const meta = statusMeta(data?.status);
  const Icon = meta.icon;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Provider Readiness</h1>
          <p>Checklist kesiapan sebelum Lapakin Asisten dihubungkan ke WhatsApp real.</p>
        </div>

        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div className="card">Memuat checklist...</div>
      ) : data ? (
        <>
          <div style={styles.hero}>
            <div>
              <p style={styles.eyebrow}>Lapakin Asisten</p>
              <h2 style={styles.heroTitle}>{data.shop_name || data.shop_id}</h2>
              <p style={styles.subtitle}>
                Minimum score untuk connect provider: {data.minimum_score}/100
              </p>
            </div>

            <div style={styles.scoreBox}>
              <div style={styles.score}>{data.score}<span>/100</span></div>
              <div style={{ ...styles.statusBadge, color: meta.color, background: meta.bg }}>
                <Icon size={16} />
                {meta.label}
              </div>
            </div>
          </div>

          <div style={styles.progressWrap}>
            <div style={styles.progressTop}>
              <strong>Progress</strong>
              <span>{data.percentage}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressBar, width: `${Math.min(data.percentage || 0, 100)}%` }} />
            </div>
          </div>

          {data.blockers?.length > 0 && (
            <div style={styles.blockerBox}>
              <strong>Blocking issues:</strong>
              <ul>
                {data.blockers.map((item) => (
                  <li key={item.key}>{item.label}: {item.detail}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.grid}>
            {(data.checks || []).map((check) => (
              <div
                key={check.key}
                style={{
                  ...styles.checkCard,
                  ...(check.passed ? styles.checkPassed : check.blocking ? styles.checkBlocking : {}),
                }}
              >
                <div style={styles.checkHeader}>
                  {check.passed ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : check.blocking ? (
                    <XCircle size={18} color="#dc2626" />
                  ) : (
                    <AlertCircle size={18} color="#f59e0b" />
                  )}

                  <div style={{ flex: 1 }}>
                    <strong>{check.label}</strong>
                    <p>{check.detail || '-'}</p>
                  </div>

                  <span style={styles.points}>
                    {check.earned}/{check.points}
                  </span>
                </div>

                {!check.passed && check.action_url && (
                  <Link to={check.action_url} style={styles.fixLink}>
                    Lengkapi →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div style={styles.note}>
            <strong>Catatan:</strong> Checklist ini belum menghubungkan WhatsApp real.
            Ini hanya memastikan toko aman dan siap sebelum masuk proses provider adapter.
          </div>
        </>
      ) : null}
    </div>
  );
}

const styles = {
  hero: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 20,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 16,
  },
  eyebrow: {
    margin: 0,
    color: '#2563eb',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: 13,
  },
  heroTitle: {
    margin: '4px 0',
    fontSize: 28,
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
  },
  scoreBox: {
    textAlign: 'right',
  },
  score: {
    fontSize: 40,
    fontWeight: 900,
    lineHeight: 1,
  },
  statusBadge: {
    marginTop: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    padding: '7px 12px',
    fontWeight: 900,
    fontSize: 13,
  },
  progressWrap: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  progressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTrack: {
    height: 10,
    background: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: '#16a34a',
    borderRadius: 999,
  },
  blockerBox: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  checkCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 14,
  },
  checkPassed: {
    background: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  checkBlocking: {
    background: '#fef2f2',
    borderColor: '#fecaca',
  },
  checkHeader: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  points: {
    fontWeight: 900,
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  fixLink: {
    display: 'inline-flex',
    marginTop: 10,
    color: '#2563eb',
    fontWeight: 900,
    textDecoration: 'none',
  },
  note: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 16,
    color: '#475569',
    marginTop: 16,
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
};
