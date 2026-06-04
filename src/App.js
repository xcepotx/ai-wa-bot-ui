import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { Login, Register } from './pages/Auth/Auth';
import Layout from './pages/Dashboard/Layout';
import Overview from './pages/Dashboard/Overview';
import Shop from './pages/Shop/Shop';
import Products from './pages/Products/Products';
import FAQs from './pages/FAQs/FAQs';
import BotSettings from './pages/BotSettings/BotSettings';
import Simulator from './pages/Simulator/Simulator';
import Connect from './pages/Connect/Connect';
import ConversationsInbox from './pages/Inbox/Inbox';
import ConversationDetail from './pages/Inbox/ConversationDetail';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminShops from './pages/Admin/AdminShops';
import AdminConversations from './pages/Admin/AdminConversations';
import AdminConversationDetail from './pages/Admin/AdminConversationDetail';
import ProviderReadiness from './pages/ProviderReadiness/ProviderReadiness';
import WebchatLeads from './pages/WebchatLeads/WebchatLeads';
import SpaceCraftProducts from './pages/SpaceCraftProducts/SpaceCraftProducts';

export default function App() {
  return (
    <HashRouter>
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/connect" element={<Connect />} />


        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="shops" element={<AdminShops />} />
          <Route path="conversations" element={<AdminConversations />} />
          <Route path="conversations/:sessionId" element={<AdminConversationDetail />} />
        </Route>

        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="shop" element={<Shop />} />
          <Route path="products" element={<Products />} />
            <Route path="spacecraft-products" element={<SpaceCraftProducts />} />
          <Route path="faqs" element={<FAQs />} />
          <Route path="bot" element={<BotSettings />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="provider-readiness" element={<ProviderReadiness />} />
            <Route path="webchat-leads" element={<WebchatLeads />} />
          <Route path="inbox" element={<ConversationsInbox />} />
          <Route path="inbox/:sessionId" element={<ConversationDetail />} />
        </Route>

        <Route path="/inbox" element={<Navigate to="/dashboard/inbox" replace />} />
        <Route path="/inbox/:sessionId" element={<Navigate to="/dashboard/inbox/:sessionId" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}
