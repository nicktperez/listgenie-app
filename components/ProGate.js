// components/ProGate.js
import React from "react";
import { useUserPlan } from "@/hooks/useUserPlan";

export function ProOnly({ children }) {
  const { isPro, loading } = useUserPlan();
  if (loading) return null;
  if (!isPro) return null;
  return <>{children}</>;
}

export function ProWall({ children, fallback }) {
  const { isPro, loading } = useUserPlan();
  if (loading) return null;
  return <>{isPro ? children : (fallback ?? <DefaultUpsell />)}</>;
}

function DefaultUpsell() {
  return (
    <div className="rounded-xl border border-white/10 p-4 bg-white/5">
      <div className="text-sm opacity-80">This feature requires Pro.</div>
      <button className="mt-3 rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm">
        Upgrade to Pro
      </button>
    </div>
  );
}