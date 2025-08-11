// pages/chat.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import ProGate from '@/components/ProGate';
import useUserPlan from '@/lib/useUserPlan';

const EXAMPLES = [
  '3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.',
  'Downtown condo listing: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.',
  'Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, and fenced garden.',
];

const TONE_OPTIONS = ['MLS-ready', 'Social caption', 'Luxury tone', 'Concise'];

/** Small helper: trims model output into readable text if JSON-ish comes back */
function coerceToReadableText(s) {
  if (!s) return '';
  try {
    const maybe = JSON.parse(s);
    if (maybe && typeof maybe === 'object') {
      if (maybe.body) return String(maybe.body);
      if (maybe.mls && maybe.mls.body) return String(maybe.mls.body);
      if (maybe.message && maybe.message.content) return String(maybe.message.content);
    }
  } catch {
    /* ignore */
  }
  return String(s);
}

/** Wrap long text into lines that fit a given width for PDF */
function wrapText(doc, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = doc.getTextWidth(test);
    if (width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function ChatPage() {
  const { user } = useUser();
  const { plan, isPro, trialStatus } = useUserPlan(); // plan: 'pro' | 'trial' | 'expired'
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text:string, at:number}
  const [thinking, setThinking] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);
  const scrollRef = useRef(null);

  const canGenerate = isPro || trialStatus === 'active';

  useEffect(() => {
    // Scroll to bottom on new message
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  async function handleSend(e) {
    e?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message
    const now = Date.now();
    setMessages(prev => [...prev, { role: 'user', text: trimmed, at: now }]);
    setInput('');
    setThinking(true);
    if (!sentOnce) setSentOnce(true);

    // Build prompt
    const sys = [
      `You are ListGenie, a real-estate listing assistant.`,
      `Write MLS-friendly listings that avoid fair-housing risks and keep the focus on property features.`,
      `When appropriate, keep adjectives tasteful. Use active, confident language.`,
      `Return polished prose and flow in a readable format.`,
      `Also keep in mind a printable flyer: short headline + quick bullets the agent could place onto a one-page handout.`,
      `Do NOT ask follow-up questions unless information is clearly missing.`,
    ].join(' ');

    const body = {
      system: sys,
      tone,                         // e.g., 'MLS-ready'
      messages: [
        ...messages.map(m => ({ role: m.role, content: m.text })),
        { role: 'user', content: trimmed },
      ],
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => 'Server error');
        throw new Error(err || 'Server error');
      }

      // Expect either { message: string } or streaming text
      let data;
      try { data = await res.json(); } catch { /* ignore */ }
      const text = coerceToReadableText(data?.message || data || '');

      setMessages(prev => [...prev, { role: 'assistant', text, at: Date.now(), tone }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry—there was a server error.', at: Date.now() }]);
    } finally {
      setThinking(false);
    }
  }

  function setExample(s) {
    setInput(s);
    // keep examples until first submit
  }

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied!');
    } catch {
      toast('Copy failed');
    }
  }

  async function handleSave(text) {
    try {
      const title = makeTitleFrom(text);
      const payload = { tone, text };
      const res = await fetch('/api/listings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, payload }),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      toast('Saved to Listings');
    } catch (e) {
      console.error(e);
      toast('Save failed');
    }
  }

  function makeTitleFrom(t) {
    const first = (t || '').split('\n').map(s => s.trim()).filter(Boolean)[0] || 'Listing';
    return first.length > 70 ? `${first.slice(0, 67)}…` : first;
  }

  async function handleFlyerPDF(text) {
    try {
      const { jsPDF } = await import('jspdf'); // lazy-load
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const marginX = 48;
      const maxW = 515;

      // Header
      doc.setFillColor(15, 18, 24);
      doc.roundedRect(0, 0, 612, 100, 0, 0, 'F');
      doc.setTextColor('#E9ECF1');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('ListGenie — Property Flyer', marginX, 60);

      // Headline (first line)
      const lines = String(text || '').split('\n').map(s => s.trim()).filter(Boolean);
      const headline = (lines[0] || 'Property').replace(/^\W+/, '');

      doc.setTextColor('#000000');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(headline, marginX, 130);

      // Body
      const bodyText = lines.slice(1).join(' ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);

      const wrapped = wrapText(doc, bodyText, maxW);
      let y = 160;
      const step = 18;
      wrapped.forEach(line => {
        doc.text(line, marginX, y);
        y += step;
      });

      // Footer note
      doc.setDrawColor(230);
      doc.line(marginX, 700, 612 - marginX, 700);
      doc.setFontSize(10);
      doc.setTextColor('#6b7280');
      doc.text('Generated with ListGenie.ai', marginX, 718);

      doc.save('listing-flyer.pdf');
      toast('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast('PDF module not available. Run: npm i jspdf');
    }
  }

  function toast(s) {
    // quick inline toast
    const el = document.createElement('div');
    el.textContent = s;
    el.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: rgba(22,22,24,.9); color: #fff; padding: 10px 14px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,.12); font-size: 12px; z-index: 9999;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  const gated = !canGenerate;

  return (
    <div className="page">
      <SignedIn>
        <Header planLabel={isPro ? 'Pro' : trialStatus === 'active' ? 'Trial' : 'Free'} />
        <div className="content">
          {/* TONE */}
          <div className="tone-row">
            {TONE_OPTIONS.map(t => (
              <button
                key={t}
                className={`tone ${t === tone ? 'on' : ''}`}
                onClick={() => setTone(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* EXAMPLES (white text, smaller) */}
          {!sentOnce && (
            <div className="examples">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className="example-chip"
                  onClick={() => setExample(ex)}
                  title="Use this example"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {/* CHAT BOX */}
          <div className="chat-wrap" ref={scrollRef}>
            {/* Assistant instructions bubble (first) */}
            {!sentOnce && (
              <div className="bubble assistant">
                Hi! Tell me about the property (beds, baths, sqft, neighborhood, upgrades, nearby amenities) and I’ll draft a compelling listing. You can also paste bullet points.
              </div>
            )}

            {/* Messages */}
            {messages.map((m, idx) => (
              <MessageBubble
                key={m.at || idx}
                role={m.role}
                text={m.text}
                tone={m.tone}
                onCopy={() => handleCopy(m.text)}
                onSave={() => handleSave(m.text)}
                onPDF={() => handleFlyerPDF(m.text)}
              />
            ))}

            {/* Thinking indicator */}
            {thinking && <Thinking />}
          </div>

          {/* INPUT */}
          <form className="input-row" onSubmit={handleSend}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe the property and any highlights…"
              rows={3}
            />
            <button className="send" type="submit" disabled={!input.trim() || thinking}>
              {thinking ? 'Generating…' : 'Send'}
            </button>
          </form>

          {/* GATE (if trial expired / not pro) */}
          {gated && <ProGate />}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="signedout">
          <p>You’ll need to sign in to use ListGenie.</p>
          <SignInButton mode="modal">
            <button className="btn primary">Sign in</button>
          </SignInButton>
        </div>
      </SignedOut>

      {/* Styles scoped to this page */}
      <style jsx>{`
        .page { min-height: 100vh; background: radial-gradient(1200px 500px at 50% -180px, rgba(124,92,255,.2), transparent 70%), #0b0d11; color: #e9ecf1; }
        .content { max-width: 900px; margin: 0 auto; padding: 24px 16px 120px; }
        .tone-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
        .tone { padding: 10px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: #dfe3f0; font-size: 14px;}
        .tone.on { background: #7c5cff; border-color: #6b54f2; color: #fff; }

        .examples { display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 10px; }
        .example-chip {
          text-align: left; padding: 8px 10px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06);
          color: #fff; opacity: 0.92; font-size: 13px;
        }
        .example-chip:hover { background: rgba(255,255,255,.1); }

        .chat-wrap { border: 1px solid rgba(255,255,255,.12); background: rgba(14,17,23,.6); border-radius: 14px; padding: 10px; height: 520px; overflow-y: auto; }
        .bubble { border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); border-radius: 12px; padding: 12px; margin: 10px 6px; white-space: pre-wrap; line-height: 1.5; }
        .assistant { background: rgba(124,92,255,.12); border-color: rgba(124,92,255,.35); }
        .user { background: rgba(255,255,255,.05); }

        .input-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-top: 10px; align-items: center; }
        textarea { width: 100%; resize: vertical; min-height: 64px; color: #e9ecf1; background: rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 12px; }
        .send { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12); background: #7c5cff; color: #fff; }
        .send:disabled { opacity: .6; cursor: not-allowed; }

        .tools { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .tool { padding: 8px 10px; border-radius: 10px; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color:#fff; font-size: 12px; }
        .tool.primary { background: #7c5cff; border-color: #6b54f2; }

        .signedout { max-width: 600px; margin: 80px auto; text-align: center; }
        .btn.primary { padding: 10px 14px; border-radius: 10px; border:1px solid rgba(255,255,255,.12); background:#7c5cff; color:#fff; }
      `}</style>
    </div>
  );
}

function Header({ planLabel }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>ListGenie.ai Chat</h1>
        <span style={{ fontSize: 12, padding:'6px 10px', borderRadius: 999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)'}}>{planLabel}</span>
      </div>
      <p style={{ margin:'6px 0 14px', color:'#b9c0cc' }}>Generate polished real estate listings plus social variants.</p>
    </div>
  );
}

function MessageBubble({ role, text, tone, onCopy, onSave, onPDF }) {
  const isAssistant = role === 'assistant';
  const readable = coerceToReadableText(text);

  return (
    <div className={`bubble ${isAssistant ? 'assistant' : 'user'}`}>
      {readable}
      {isAssistant && (
        <div className="tools">
          <button className="tool" onClick={onCopy}>Copy</button>
          <button className="tool" onClick={onSave}>Save</button>
          <button className="tool primary" onClick={onPDF}>Flyer (PDF)</button>
        </div>
      )}
      <style jsx>{`
        .tools { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .tool { padding: 8px 10px; border-radius: 10px; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color:#fff; font-size: 12px; }
        .tool.primary { background: #7c5cff; border-color: #6b54f2; }
      `}</style>
    </div>
  );
}

function Thinking() {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px',
      border:'1px solid rgba(255,255,255,.12)', borderRadius: 999, background:'rgba(255,255,255,.05)', margin:'10px 6px'
    }}>
      <span style={{ fontSize: 12, color:'#b9c0cc' }}>
        <Dots /> Thinking
      </span>
    </div>
  );
}

function Dots() {
  return (
    <span style={{ display:'inline-flex', gap:4, marginRight:6 }}>
      <Dot delay="0s" /><Dot delay=".15s" /><Dot delay=".3s" />
      <style jsx>{`
        @keyframes b { 0% { opacity:.2; transform: translateY(0) } 50% { opacity:1; transform: translateY(-2px) } 100% { opacity:.2; transform: translateY(0) } }
        span :global(.dot) { width:6px; height:6px; border-radius:50%; background:#d1d5db; display:block; animation: b 1.2s infinite; }
      `}</style>
    </span>
  );
}
function Dot({ delay }) {
  return <i className="dot" style={{ animationDelay: delay }} />;
}