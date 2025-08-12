// hooks/useUserPlan.js
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export function useUserPlan() {
  const { isSignedIn, user } = useUser();
  const [state, setState] = useState({
    plan: "trial",
    trialEnd: null,
    isLoading: true,
    usageCount: 0,
    usageLimit: 10, // Free users get 10 generations
    isInitialized: false
  });

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

        // Get current plan and usage
        const r = await fetch("/api/user/plan");
        const j = await r.json();
        
        if (!mounted) return;
        
        const plan = j?.plan || "trial";
        const trialEnd = j?.trial_end_date || null;
        const usageCount = j?.usage_count || 0;
        const usageLimit = plan === "pro" ? 1000 : 10; // Pro users get 1000 generations
        
        setState({ 
          plan, 
          trialEnd, 
          usageCount,
          usageLimit,
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

  const { plan, trialEnd, isLoading, usageCount, usageLimit, isInitialized } = state;
  const isPro = plan === "pro";
  const isTrial = plan === "trial" && !!trialEnd && Date.now() <= new Date(trialEnd).getTime();
  const isExpired = plan === "expired" || (plan === "trial" && trialEnd && Date.now() > new Date(trialEnd).getTime());
  const canGenerate = isPro || (isTrial && usageCount < usageLimit);
  const usageRemaining = Math.max(0, usageLimit - usageCount);

  const daysLeft = isTrial
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Function to refresh usage data
  const refreshUsage = async () => {
    try {
      const r = await fetch("/api/user/plan");
      const j = await r.json();
      if (j?.ok) {
        setState(s => ({
          ...s,
          usageCount: j.usage_count || 0,
          usageLimit: j.plan === "pro" ? 1000 : 10
        }));
      }
    } catch (e) {
      console.error("Failed to refresh usage:", e);
    }
  };

  return { 
    plan, 
    trialEnd, 
    isPro, 
    isTrial, 
    isExpired, 
    daysLeft, 
    isLoading,
    usageCount,
    usageLimit,
    usageRemaining,
    canGenerate,
    isInitialized,
    refreshUsage
  };
}