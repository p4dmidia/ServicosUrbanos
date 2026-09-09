import { useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';

export function ReferralTracker() {
  const [searchParams] = useSearchParams();
  const { referrerId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('indicador');
    const rev = searchParams.get('rev') || searchParams.get('reseller') || searchParams.get('revendedor');

    // 1. Revendedor Regional
    if (rev) {
      console.log('Regional reseller detected via query:', rev);
      localStorage.setItem('urba_reseller', rev);
    }

    // 2. Patrocinador MMN
    if (ref) {
      console.log('Referral sponsor detected via query:', ref);
      localStorage.setItem('urba_referral', ref);
    }

    // 3. Check for route-based referral (from /invite/:referrerId)
    if (referrerId) {
      console.log('Referral detected via invite route:', referrerId);
      localStorage.setItem('urba_referral', referrerId);
      // Redirect to cadastro preserving query parameter
      navigate(`/cadastro?ref=${referrerId}`, { replace: true });
    }
  }, [searchParams, referrerId, navigate]);

  return null;
}
