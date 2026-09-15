import { useEffect } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';

export function ReferralTracker() {
  const [searchParams] = useSearchParams();
  const { referrerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('indicador');

    // 1. Se tem indicação em query param em qualquer página, registra no sessionStorage
    if (ref) {
      try {
        sessionStorage.setItem('urba_referral', ref);
      } catch (e) {}
    }

    // 2. Se a rota atual for explicitamente a rota de convite (/invite/:referrerId), redireciona para o cadastro
    if (referrerId || location.pathname.startsWith('/invite/')) {
      const targetRef = referrerId || location.pathname.replace('/invite/', '').trim();
      if (targetRef) {
        try {
          sessionStorage.setItem('urba_referral', targetRef);
        } catch (e) {}
        navigate(`/cadastro?ref=${targetRef}`, { replace: true });
      }
    }
  }, [searchParams, referrerId, navigate, location.pathname]);

  return null;
}
