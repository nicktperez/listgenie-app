// components/ListingRender.js
export function ListingRender({ data, onSave, saving }) {
    if (!data || data.type !== "listing") return null;
  
    const { headline, mls, variants = [], facts = {}, photo_shotlist = [], disclaimer } = data;
  
    return (
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{headline}</h3>
  
        {mls?.body && <p style={{ margin: "8px 0 10px" }}>{mls.body}</p>}
  
        {Array.isArray(mls?.bullets) && mls.bullets.length > 0 && (
          <ul style={{ margin:"0 0 12px 18px" }}>
            {mls.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
  
        {/* Variants */}
        {variants.length > 0 && (
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {variants.map((v, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>
                <div className="chat-sub" style={{ marginBottom: 6 }}>{v.label}</div>
                <div>{v.text}</div>
                <div style={{ marginTop: 8 }}>
                  <button className="link" onClick={() => copy(v.text)}>Copy</button>
                </div>
              </div>
            ))}
          </div>
        )}
  
        {/* Facts */}
        <div className="chat-sub" style={{ marginTop: 12, marginBottom: 4 }}>Key Facts</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {Object.entries(facts).filter(([,v]) => v !== null && v !== "").map(([k,v]) => (
            <span key={k} className="badge">{labelize(k)}: {v}</span>
          ))}
        </div>
  
        {/* Photo suggestions */}
        {photo_shotlist?.length > 0 && (
          <>
            <div className="chat-sub" style={{ marginTop: 12, marginBottom: 4 }}>Suggested Photos</div>
            <ul style={{ margin:"0 0 12px 18px" }}>
              {photo_shotlist.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </>
        )}
  
        {disclaimer && <div className="chat-sub" style={{ marginTop: 8 }}>{disclaimer}</div>}
  
        <div style={{ marginTop: 12, display:"flex", gap:8 }}>
          <button className="btn" onClick={() => copy(fullText(data))}>Copy MLS Text</button>
          <button className="btn" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save Listing"}</button>
        </div>
      </div>
    );
  }
  
  export function QuestionsRender({ data, onAnswer }) {
    if (!data || data.type !== "questions") return null;
    return (
      <div className="card" style={{ padding: 16 }}>
        <div className="chat-sub" style={{ marginBottom: 6 }}>I need a few details:</div>
        <ul style={{ margin:"0 0 10px 18px" }}>
          {data.questions.map((q,i) => <li key={i}>{q}</li>)}
        </ul>
        <div className="chat-sub">Reply with the answers, and I’ll generate the listing.</div>
      </div>
    );
  }
  
  /** utils **/
  function labelize(k){ return k.replace(/_/g," ").replace(/\b\w/g,(m)=>m.toUpperCase()); }
  function fullText(data){
    const parts = [data.headline, data?.mls?.body, ...(data?.mls?.bullets||[]).map(b=>`• ${b}`)];
    return parts.filter(Boolean).join("\n\n");
  }
  function copy(text){
    try{ navigator.clipboard.writeText(text); } catch {}
  }