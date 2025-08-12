// pages/batch.js
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import useUserPlan from "@/hooks/useUserPlan";
import NavBar from "@/components/NavBar";

export default function BatchPage() {
  return (
    <div>
      <NavBar />
      <div className="chat-wrap">
        <h1 className="chat-title" style={{ marginBottom: 8 }}>Batch Processing</h1>
        <p className="chat-sub" style={{ marginBottom: 16 }}>
          Generate multiple listings at once. Pro users only.
        </p>

        <SignedOut>
          <div className="card" style={{ padding: 16 }}>
            <div className="chat-sub" style={{ marginBottom: 8 }}>
              Please sign in to access batch processing.
            </div>
            <SignInButton mode="modal">
              <button className="btn">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <BatchProcessor />
        </SignedIn>
      </div>
    </div>
  );
}

function BatchProcessor() {
  const { isPro } = useUserPlan();
  const [properties, setProperties] = useState([{ description: "" }]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  if (!isPro) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: 8 }}>Pro Feature</h3>
          <p style={{ marginBottom: 16, color: "var(--text-dim)" }}>
            Batch processing is available exclusively to Pro users.
          </p>
          <a href="/upgrade" className="btn">Upgrade to Pro</a>
        </div>
      </div>
    );
  }

  const addProperty = () => {
    if (properties.length < 20) {
      setProperties([...properties, { description: "" }]);
    }
  };

  const removeProperty = (index) => {
    if (properties.length > 1) {
      setProperties(properties.filter((_, i) => i !== index));
    }
  };

  const updateProperty = (index, value) => {
    const newProperties = [...properties];
    newProperties[index].description = value;
    setProperties(newProperties);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validProperties = properties
      .map(p => p.description.trim())
      .filter(desc => desc.length > 0);

    if (validProperties.length === 0) {
      setError("Please add at least one property description");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/chat/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: validProperties.map(desc => ({ description: desc }))
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to process batch");
      }

      setResults(data);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="batch-container">
      {/* Input Form */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Property Descriptions</h3>
        
        <form onSubmit={handleSubmit}>
          {properties.map((property, index) => (
            <div key={index} style={{ marginBottom: 12, display: "flex", gap: 8 }}>
              <textarea
                value={property.description}
                onChange={(e) => updateProperty(index, e.target.value)}
                placeholder={`Property ${index + 1} description...`}
                className="textarea"
                style={{ flex: 1, minHeight: "60px" }}
              />
              {properties.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProperty(index)}
                  className="btn"
                  style={{ 
                    background: "rgba(255, 99, 99, 0.1)", 
                    color: "#ff6363",
                    padding: "8px 12px",
                    minWidth: "auto"
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={addProperty}
              className="btn"
              style={{ background: "rgba(124, 231, 196, 0.1)", color: "#7ce7c4" }}
              disabled={properties.length >= 20}
            >
              + Add Property
            </button>
            
            <button
              type="submit"
              className="btn"
              disabled={loading || properties.every(p => !p.description.trim())}
            >
              {loading ? "Processing..." : `Generate ${properties.filter(p => p.description.trim()).length} Listings`}
            </button>
          </div>

          {error && (
            <div className="error" style={{ marginBottom: 16 }}>{error}</div>
          )}
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 16 }}>
            Results ({results.successful}/{results.total_processed} successful)
          </h3>
          
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => {
                const text = results.results
                  .map(r => `${r.property}\n\n${r.content}\n\n---\n`)
                  .join('\n');
                navigator.clipboard.writeText(text);
              }}
              className="btn"
              style={{ background: "rgba(134, 162, 255, 0.1)", color: "#86a2ff" }}
            >
              Copy All
            </button>
            
            <button
              onClick={() => {
                const csv = [
                  "Property,Content",
                  ...results.results.map(r => 
                    `"${r.property.replace(/"/g, '""')}","${r.content.replace(/"/g, '""')}"`
                  )
                ].join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'batch-listings.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn"
              style={{ background: "rgba(124, 231, 196, 0.1)", color: "#7ce7c4" }}
            >
              Export CSV
            </button>
          </div>

          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {results.results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  border: "1px solid var(--stroke)",
                  borderRadius: 8,
                  marginBottom: 12,
                  background: result.success ? "rgba(124, 231, 196, 0.05)" : "rgba(255, 99, 99, 0.05)"
                }}
              >
                <h4 style={{ marginBottom: 8, color: result.success ? "#7ce7c4" : "#ff6363" }}>
                  {result.property}
                </h4>
                <div style={{ 
                  whiteSpace: "pre-wrap", 
                  fontSize: "14px", 
                  lineHeight: "1.5",
                  color: result.success ? "inherit" : "var(--text-dim)"
                }}>
                  {result.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
