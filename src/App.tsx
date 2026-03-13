import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GanheDinheiro from './pages/GanheDinheiro';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import Ecossistema from './pages/Ecossistema';
import Loja from './pages/Loja';
import MerchantLogin from './pages/MerchantLogin';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantProducts from './pages/MerchantProducts';
import MerchantOrders from './pages/MerchantOrders';
import MerchantFinancials from './pages/MerchantFinancials';
import MerchantCustomers from './pages/MerchantCustomers';
import MerchantReports from './pages/MerchantReports';
import MerchantSettings from './pages/MerchantSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ganhe-dinheiro" element={<GanheDinheiro />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/ecossistema" element={<Ecossistema />} />
        <Route path="/loja" element={<Loja />} />
        <Route path="/lojista/login" element={<MerchantLogin />} />
        <Route path="/lojista/dashboard" element={<MerchantDashboard />} />
        <Route path="/lojista/produtos" element={<MerchantProducts />} />
        <Route path="/lojista/pedidos" element={<MerchantOrders />} />
        <Route path="/lojista/financeiro" element={<MerchantFinancials />} />
        <Route path="/lojista/clientes" element={<MerchantCustomers />} />
        <Route path="/lojista/relatorios" element={<MerchantReports />} />
        <Route path="/lojista/configuracoes" element={<MerchantSettings />} />
      </Routes>
    </BrowserRouter>
  );
}
