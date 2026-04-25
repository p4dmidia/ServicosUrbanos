import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import GanheDinheiro from './pages/GanheDinheiro';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import Ecossistema from './pages/Ecossistema';
import Loja from './pages/Loja';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import MerchantLogin from './pages/MerchantLogin';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantProducts from './pages/MerchantProducts';
import MerchantOrders from './pages/MerchantOrders';
import MerchantFinancials from './pages/MerchantFinancials';
import MerchantCustomers from './pages/MerchantCustomers';
import MerchantReports from './pages/MerchantReports';
import MerchantSettings from './pages/MerchantSettings';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPlatforms from './pages/AdminPlatforms';
import AdminUsers from './pages/AdminUsers';
import AdminMarketplace from './pages/AdminMarketplace';
import AdminSettings from './pages/AdminSettings';
import AdminReports from './pages/AdminReports';
import AdminWaitlist from './pages/AdminWaitlist';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminCategories from './pages/AdminCategories';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AffiliateNetwork from './pages/AffiliateNetwork';
import AffiliateWallet from './pages/AffiliateWallet';
import AffiliateEcosystem from './pages/AffiliateEcosystem';
import AffiliateProfile from './pages/AffiliateProfile';
import AffiliateOrders from './pages/AffiliateOrders';

import { ProtectedRoute } from './components/ProtectedRoute';
import { ReferralTracker } from './components/ReferralTracker';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <ReferralTracker />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invite/:referrerId" element={<ReferralTracker />} />
          <Route path="/ganhe-dinheiro" element={<GanheDinheiro />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/ecossistema" element={<Ecossistema />} />
          <Route path="/loja" element={<Loja />} />
          <Route path="/produto/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/lojista/login" element={<MerchantLogin />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} 
          />

          <Route 
            path="/admin/plataformas" 
            element={<ProtectedRoute allowedRoles={['admin']}><AdminPlatforms /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/usuarios" 
            element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/marketplace" 
            element={<ProtectedRoute allowedRoles={['admin']}><AdminMarketplace /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/lista-espera" 
            element={<ProtectedRoute allowedRoles={['admin']}><AdminWaitlist /></ProtectedRoute>} 
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
            path="/admin/categorias" 
            element={<ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute>} 
          />

          {/* Affiliate / Virtual Office Routes */}
          <Route 
            path="/afiliado" 
            element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin']}><AffiliateDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/afiliado/dashboard" 
            element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin']}><AffiliateDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/afiliado/rede" 
            element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin']}><AffiliateNetwork /></ProtectedRoute>} 
          />
          <Route 
            path="/afiliado/financeiro" 
            element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin']}><AffiliateWallet /></ProtectedRoute>} 
          />
          <Route 
            path="/afiliado/ecossistema" 
            element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin']}><AffiliateEcosystem /></ProtectedRoute>} 
          />
          <Route 
            path="/afiliado/perfil" 
            element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin']}><AffiliateProfile /></ProtectedRoute>} 
          />
          <Route 
            path="/afiliado/pedidos" 
            element={<ProtectedRoute allowedRoles={['affiliate', 'owner', 'manager', 'admin']}><AffiliateOrders /></ProtectedRoute>} 
          />

          {/* Merchant Routes */}
          <Route 
            path="/lojista/dashboard" 
            element={<ProtectedRoute allowedRoles={['manager', 'owner', 'affiliate']}><MerchantDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/lojista/produtos" 
            element={<ProtectedRoute allowedRoles={['manager', 'owner', 'affiliate']}><MerchantProducts /></ProtectedRoute>} 
          />
          <Route 
            path="/lojista/pedidos" 
            element={<ProtectedRoute allowedRoles={['manager', 'owner', 'affiliate']}><MerchantOrders /></ProtectedRoute>} 
          />
          <Route 
            path="/lojista/financeiro" 
            element={<ProtectedRoute allowedRoles={['manager', 'owner', 'affiliate']}><MerchantFinancials /></ProtectedRoute>} 
          />
          <Route 
            path="/lojista/clientes" 
            element={<ProtectedRoute allowedRoles={['manager', 'owner', 'affiliate']}><MerchantCustomers /></ProtectedRoute>} 
          />
          <Route 
            path="/lojista/relatorios" 
            element={<ProtectedRoute allowedRoles={['manager', 'owner', 'affiliate']}><MerchantReports /></ProtectedRoute>} 
          />
          <Route 
            path="/lojista/configuracoes" 
            element={<ProtectedRoute allowedRoles={['manager', 'owner', 'affiliate']}><MerchantSettings /></ProtectedRoute>} 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
