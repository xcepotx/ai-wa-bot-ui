import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../../api/client';
import { Bot, CheckCircle, AlertCircle } from 'lucide-react';

export default function Connect() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token tidak ditemukan. Kembali ke Lapakin dan coba lagi.');
      return;
    }

    client.get(`/connect?token=${token}`)
      .then(r => {
        const { access_token } = r.data;
        localStorage.setItem('bot_token', access_token);
        setStatus('success');
        setMessage('Akun Lapakin berhasil terhubung!');
        setTimeout(() => navigate('/dashboard'), 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(
          err.response?.data?.detail ||
          'Gagal menghubungkan akun. Token mungkin sudah expired. Coba lagi dari Lapakin.'
        );
      });
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 48,
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{
          width: 64, height: 64,
          background: 'var(--brand)',
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(22,163,74,0.3)',
        }}>
          <Bot size={32} color="#fff" />
        </div>

        {status === 'loading' && (
          <>
            <div className="spinner spinner-dark" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
            <h2 style={{ marginBottom: 8 }}>Menghubungkan akun...</h2>
            <p>Sedang memverifikasi akun Lapakin kamu</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} color="var(--brand)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8, color: 'var(--brand)' }}>Berhasil! 🎉</h2>
            <p>{message}</p>
            <p style={{ marginTop: 8, fontSize: '0.82rem' }}>Mengalihkan ke dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8, color: 'var(--danger)' }}>Gagal Terhubung</h2>
            <p>{message}</p>
            <a
              href="https://dev.lapakin.my.id/dashboard"
              className="btn btn-primary btn-lg"
              style={{ marginTop: 24, display: 'inline-flex' }}
            >
              Kembali ke Lapakin
            </a>
          </>
        )}
      </div>
    </div>
  );
}
