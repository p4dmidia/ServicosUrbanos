import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'owner' | 'manager' | 'affiliate' | 'customer')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="size-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Redireciona para o login correto baseado na rota
    if (location.pathname.startsWith('/lojista')) {
      return <Navigate to="/lojista/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Se logado mas sem permissão de cargo, redireciona para a home ou dashboard padrão
    // Administradores tentado acessar área de admin sem permissão podem ir para login admin
    if (location.pathname.startsWith('/admin')) {
        return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
