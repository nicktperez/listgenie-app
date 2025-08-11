// Lightweight hook to read the user's plan from our API
import { useEffect, useState } from 'react';

export default function useUserPlan() {
  const [state, setState] = useState({
    plan: 'free',          // 'pro' | 'trial' | 'expired' | 'free'
    isPro: false,
    trialStatus: 'none',   // 'active' | 'expired' | 'none'
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/plan');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (cancelled) return;

        const plan = j?.plan || 'free';
        const trialStatus = j?.trialStatus || (plan === 'trial' ? 'active' : 'none');
        setState({
          plan,
          isPro: plan === 'pro',
          trialStatus,
          loading: false,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState(s => ({ ...s, loading: false, error: e?.message || 'plan error' }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}