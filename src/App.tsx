import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GanheDinheiro from './pages/GanheDinheiro';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import Ecossistema from './pages/Ecossistema';

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
      </Routes>
    </BrowserRouter>
  );
}
