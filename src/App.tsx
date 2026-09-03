import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Maintenance from './pages/Maintenance';
import GanheDinheiro from './pages/GanheDinheiro';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Ecossistema from './pages/Ecossistema';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import AdminReports from './pages/AdminReports';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminFinancials from './pages/AdminFinancials';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AffiliateResellerDashboard from './pages/AffiliateResellerDashboard';
import AffiliateNetwork from './pages/AffiliateNetwork';
import AffiliateWallet from './pages/AffiliateWallet';
import AffiliateResellerFinancial from './pages/AffiliateResellerFinancial';
import AffiliateEcosystem from './pages/AffiliateEcosystem';
import AffiliateProfile from './pages/AffiliateProfile';
import AffiliateOrders from './pages/AffiliateOrders';
import AffiliateAdherenceTerm from './pages/AffiliateAdherenceTerm';
import AffiliatePolicy from './pages/AffiliatePolicy';
import AffiliateLuckyNumber from './pages/AffiliateLuckyNumber';
import AffiliateRenewals from './pages/AffiliateRenewals';
import AffiliateTelemedicina from './pages/AffiliateTelemedicina';
import AffiliateInvoice from './pages/AffiliateInvoice';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TermosPrivacidade from './pages/TermosPrivacidade';
import PoliticaCookies from './pages/PoliticaCookies';
import TermosUso from './pages/TermosUso';

import { ProtectedRoute } from './components/ProtectedRoute';
import { ReferralTracker } from './components/ReferralTracker';
import WhatsAppButton from './components/WhatsAppButton';

import { NotificationProvider } from './contexts/NotificationContext';

// Defina como true para ativar a tela de manutenção na home, ou false para desativar.
const IS_MAINTENANCE = false;

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <BrowserRouter>
          <ReferralTracker />
          <WhatsAppButton />
          <Routes>
            <Route path="/" element={IS_MAINTENANCE ? <Maintenance /> : <Home />} />
            <Route path="/invite/:referrerId" element={<ReferralTracker />} />
            <Route path="/ganhe-dinheiro" element={<GanheDinheiro />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/termos-privacidade" element={<TermosPrivacidade />} />
            <Route path="/politica-cookies" element={<PoliticaCookies />} />
            <Route path="/termos-uso" element={<TermosUso />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/ecossistema" element={<Ecossistema />} />
            <Route path="/checkout" element={<Checkout />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/produtos" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminProducts /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/pedidos" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/usuarios" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/configuracoes" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/relatorios" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/saques" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminWithdrawals /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/financeiro" 
              element={<ProtectedRoute allowedRoles={['admin']}><AdminFinancials /></ProtectedRoute>} 
            />

            {/* Affiliate / Virtual Office Routes */}
            <Route 
              path="/afiliado" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/dashboard" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/revendedor" 
              element={<ProtectedRoute allowedRoles={['regional_reseller']}><AffiliateResellerDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/rede" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateNetwork /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/financeiro" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateWallet /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/financeiro-revendedor" 
              element={<ProtectedRoute allowedRoles={['regional_reseller', 'owner', 'admin']}><AffiliateResellerFinancial /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/nota-fiscal" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateInvoice /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/ecossistema" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateEcosystem /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/perfil" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateProfile /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/pedidos" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateOrders /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/termo-adesao/:section?" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateAdherenceTerm /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/apolice" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliatePolicy /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/numero-sorte" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateLuckyNumber /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/renovacoes" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateRenewals /></ProtectedRoute>} 
            />
            <Route 
              path="/afiliado/telemedicina" 
              element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin', 'regional_reseller']}><AffiliateTelemedicina /></ProtectedRoute>} 
            />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

