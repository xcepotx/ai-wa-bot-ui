import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { Login, Register } from './pages/Auth/Auth';
import Layout    from './pages/Dashboard/Layout';
import Overview  from './pages/Dashboard/Overview';
import Shop      from './pages/Shop/Shop';
import Products  from './pages/Products/Products';
import FAQs      from './pages/FAQs/FAQs';
import BotSettings from './pages/BotSettings/BotSettings';
import Simulator from './pages/Simulator/Simulator';

function Inbox() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inbox</h1>
          <p>Riwayat percakapan bot dengan pelanggan</p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📬</div>
          <h3>Inbox akan tersedia</h3>
          <p>Setelah bot terhubung ke WhatsApp, riwayat chat akan muncul di sini</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '0.875rem',
            borderRadius: 10,
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Layout />}>
          <Route index          element={<Overview />} />
          <Route path="shop"    element={<Shop />} />
          <Route path="products" element={<Products />} />
          <Route path="faqs"    element={<FAQs />} />
          <Route path="bot"     element={<BotSettings />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="inbox"   element={<Inbox />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
