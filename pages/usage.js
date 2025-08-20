// pages/usage.js
import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import useUserPlan from "@/hooks/useUserPlan";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default function UsagePage() {
  return (
    <div>
      <NavBar />
      <div className="chat-wrap">
        <h1 className="chat-title" style={{ marginBottom: 8 }}>Usage Analytics</h1>
        <p className="chat-sub" style={{ marginBottom: 16 }}>
          Track your listing generation activity and usage patterns.
        </p>

        <SignedOut>
          <div className="card" style={{ padding: 16 }}>
            <div className="chat-sub" style={{ marginBottom: 8 }}>
              Please sign in to view your usage analytics.
            </div>
            <SignInButton mode="modal">
              <button className="btn">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <UsageAnalytics />
        </SignedIn>
      </div>
    </div>
  );
}

function UsageAnalytics() {
  const { isPro, plan, daysLeft, isTrial } = useUserPlan();
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGenerations();
  }, []);

  const loadGenerations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/generations");
      const data = await res.json();
      
      if (res.ok) {
        setGenerations(data.generations || []);
      } else {
        setError(data.error || "Failed to load generations");
      }
    } catch (e) {
      setError("Failed to load generations");
    } finally {
      setLoading(false);
    }
  };

  const getRecentActivity = () => {
    const now = new Date();
    const last7Days = generations.filter(g => {
      const genDate = new Date(g.created_at);
      const diffTime = Math.abs(now - genDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
    
    return last7Days.length;
  };

  const getMostActiveDay = () => {
    if (generations.length === 0) return "No activity";
    
    const dayCounts = {};
    generations.forEach(g => {
      const date = new Date(g.created_at).toLocaleDateString();
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    });
    
    const mostActive = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return mostActive ? `${mostActive[0]} (${mostActive[1]} generations)` : "No activity";
  };

  return (
    <div className="usage-container">
      {/* Current Status */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Current Plan Status</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", marginBottom: 4 }}>
              {plan.toUpperCase()}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              {isTrial ? `${daysLeft} days remaining` : "Current plan"}
            </div>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", marginBottom: 4, color: "#7ce7c4" }}>
              {generations.length}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Total generations
            </div>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", marginBottom: 4, color: "#86a2ff" }}>
              {getRecentActivity()}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Last 7 days
            </div>
          </div>
        </div>

        {/* Plan Status */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          {isTrial ? (
            <div style={{ 
              padding: "12px", 
              background: "rgba(124, 231, 196, 0.1)", 
              borderRadius: "8px",
              border: "1px solid rgba(124, 231, 196, 0.3)"
            }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#7ce7c4", marginBottom: 4 }}>
                Trial Pro Active
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                You have access to all Pro features for {daysLeft} more days
              </div>
            </div>
          ) : isPro ? (
            <div style={{ 
              padding: "12px", 
              background: "rgba(134, 162, 255, 0.1)", 
              borderRadius: "8px",
              border: "1px solid rgba(134, 162, 255, 0.3)"
            }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#86a2ff", marginBottom: 4 }}>
                Pro Plan Active
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Unlimited access to all features
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: "12px", 
              background: "rgba(255, 99, 99, 0.1)", 
              borderRadius: "8px",
              border: "1px solid rgba(255, 99, 99, 0.3)"
            }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#ff6363", marginBottom: 4 }}>
                Trial Expired
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: 8 }}>
                Upgrade to Pro to continue using ListGenie
              </div>
              <Link href="/upgrade" className="btn" style={{ fontSize: "12px", padding: "6px 12px" }}>
                Upgrade Now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Analytics */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Activity Insights</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", marginBottom: 4, color: "#7ce7c4" }}>
              {generations.length}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Total generations
            </div>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", marginBottom: 4, color: "#86a2ff" }}>
              {getRecentActivity()}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Last 7 days
            </div>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: 4, color: "#ffa726" }}>
              {getMostActiveDay()}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Most active day
            </div>
          </div>
        </div>
      </div>

      {/* Recent Generations */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Recent Generations</h3>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
            Loading...
          </div>
        ) : error ? (
          <div className="error" style={{ marginBottom: 16 }}>{error}</div>
        ) : generations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
            No generations yet. Start creating listings in the Chat section!
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {generations.slice(0, 10).map((gen, index) => (
              <div
                key={gen.id || index}
                style={{
                  padding: 12,
                  border: "1px solid var(--stroke)",
                  borderRadius: 8,
                  marginBottom: 12,
                  background: "rgba(255,255,255,0.02)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: "14px", color: "var(--text-dim)" }}>
                    {new Date(gen.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                    {gen.model || "AI Model"}
                  </div>
                </div>
                <div style={{ 
                  fontSize: "14px", 
                  lineHeight: "1.4",
                  maxHeight: "80px",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {gen.prompt || "Property description"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}