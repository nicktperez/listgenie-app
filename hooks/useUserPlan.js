// hooks/useUserPlan.js
import { useEffect, useState } from "react";

export function useUserPlan() {
  const [plan, setPlan] = useState("free"); // 'free' | 'pro'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/user/plan");
        const json = await res.json();
        if (!mounted) return;

        if (!res.ok || !json?.ok) {
          setError(json?.error || "Failed to load plan");
        } else {
          setPlan(json.plan || "free");
        }
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load plan");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { plan, isPro: plan === "pro", loading, error };
}