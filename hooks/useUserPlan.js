// hooks/useUserPlan.js
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function useUserPlan() {
  const { isSignedIn, user } = useUser();
  const [state, setState] = useState({
    plan: "trial",
    trialEnd: null,
    isLoading: true,
    isInitialized: false
  });

  const refreshPlan = async () => {
    try {
      const r = await fetch("/api/user/plan");
      const j = await r.json();
      
      const plan = j?.plan || "trial";
      const trialEnd = j?.trial_end_date || null;
      
      setState(s => ({ 
        ...s,
        plan, 
        trialEnd, 
        isLoading: false
      }));
      
      console.log("Plan refreshed:", { plan, trialEnd, response: j });
    } catch (e) {
      console.error("Error refreshing plan:", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    if (!isSignedIn) {
      setState(s => ({ ...s, isLoading: false, plan: "expired" }));
      return;
    }

    (async () => {
      try {
        // Initialize user if needed
        if (!state.isInitialized) {
          const initRes = await fetch("/api/user/init", { method: "POST" });
          if (initRes.ok) {
            setState(s => ({ ...s, isInitialized: true }));
          }
        }

        // Get current plan status
        const r = await fetch("/api/user/plan");
        const j = await r.json();
        
        if (!mounted) return;
        
        const plan = j?.plan || "trial";
        const trialEnd = j?.trial_end_date || null;
        
        setState({ 
          plan, 
          trialEnd, 
          isLoading: false,
          isInitialized: state.isInitialized
        });
      } catch (e) {
        if (!mounted) return;
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
    
    return () => { mounted = false; };
  }, [isSignedIn, state.isInitialized]);

  const { plan, trialEnd, isLoading, isInitialized } = state;
  const isPro = plan === "pro";
  const isTrial = plan === "trial" && !!trialEnd && Date.now() <= new Date(trialEnd).getTime();
  const isExpired = plan === "expired" || (plan === "trial" && trialEnd && Date.now() > new Date(trialEnd).getTime());
  const canGenerate = isPro || isTrial; // Both trial and paid Pro can generate

  const daysLeft = isTrial
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return { 
    plan, 
    trialEnd, 
    isPro, 
    isTrial, 
    isExpired, 
    daysLeft, 
    isLoading,
    canGenerate,
    isInitialized,
    refreshPlan
  };
}