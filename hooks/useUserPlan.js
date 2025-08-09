// hooks/useUserPlan.js
import { useEffect, useState } from "react";

export function useUserPlan() {
  const [state, setState] = useState({
    plan: "trial",
    trialEnd: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/user/plan");
        const j = await r.json();
        if (!mounted) return;
        const plan = j?.plan || "trial";
        const trialEnd = j?.trial_end_date || null;
        setState({ plan, trialEnd, isLoading: false });
      } catch {
        if (!mounted) return;
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
    return () => { mounted = false; };
  }, []);

  const { plan, trialEnd, isLoading } = state;
  const isPro = plan === "pro";
  const isTrial = plan === "trial" && !!trialEnd && Date.now() <= new Date(trialEnd).getTime();
  const isExpired = plan === "expired" || (plan === "trial" && trialEnd && Date.now() > new Date(trialEnd).getTime());

  const daysLeft = isTrial
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return { plan, trialEnd, isPro, isTrial, isExpired, daysLeft, isLoading };
}