// components/ProGate.js
import React from "react";
import { useUserPlan } from "@/hooks/useUserPlan";

export function ProWall({ children, fallback }) {
  const { isPro, isTrial, isExpired } = useUserPlan();

  if (isPro || isTrial) return <>{children}</>;

  // expired or unknown -> show fallback or default upsell
  if (fallback) return fallback;
  return <DefaultUpsell />;
}

function DefaultUpsell() {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="chat-sub" style={{ marginBottom: 8 }}>
        This feature requires an active plan.
      </div>
      <a href="/upgrade" className="link">Upgrade to Pro</a>
    </div>
  );
}