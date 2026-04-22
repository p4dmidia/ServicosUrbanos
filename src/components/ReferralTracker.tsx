import { useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';

export function ReferralTracker() {
  const [searchParams] = useSearchParams();
  const { referrerId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check for ?ref= parameter
    const ref = searchParams.get('ref');
    if (ref) {
      console.log('Referral detected via query:', ref);
      localStorage.setItem('urba_referral', ref);
    }

    // 2. Check for route-based referral (from /invite/:referrerId)
    if (referrerId) {
      console.log('Referral detected via invite route:', referrerId);
      localStorage.setItem('urba_referral', referrerId);
      // Redirect to cadastro after capturing
      navigate('/cadastro', { replace: true });
    }
  }, [searchParams, referrerId, navigate]);

  return null;
}
