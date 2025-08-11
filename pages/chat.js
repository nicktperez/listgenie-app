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

// Extracts useful flyer fields from the model text
function parseListingForFlyer(raw) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim();

  // Headline: first sentence or line
  let headline = text.split(/[.!?\n]/)[0]?.trim() || 'Beautiful Home';
  if (headline.length > 72) headline = headline.slice(0, 69) + '…';

  // Subhead: Beds • Baths • Sq Ft • Neighborhood (best-effort regex)
  const beds = (text.match(/(\d+)\s*(bed|beds|bedrooms?)/i) || [])[1];
  const baths = (text.match(/(\d+)\s*(bath|baths|bathrooms?)/i) || [])[1];
  const sqft = (text.match(/([\d,]{3,})\s*(sq\s*ft|sqft|square\s*feet)/i) || [])[1];
  const year = (text.match(/\b(19|20)\d{2}\b/) || [])[0];
  // Try to grab "in <Place>" or "near <Place>" once
  const nbhm = text.match(/\b(in|near)\s+([A-Za-z][A-Za-z\s\-']{2,})/i);
  const neighborhood = nbhm ? nbhm[2].trim().replace(/\s+near\s*$/i,'') : null;

  const parts = [
    beds && `${beds} Beds`,
    baths && `${baths} Baths`,
    sqft && `${sqft.replace(/,/g, ',')} Sq Ft`,
    neighborhood && neighborhood,
  ].filter(Boolean);
  const subhead = parts.join('  •  ') || 'Updated • Spacious • Move-in Ready';

  // Bullets: split on bullets or sentences, keep the punchy ones
  let rawBullets = [];
  if (text.includes('•')) {
    rawBullets = text.split('•').map(s => s.trim());
  } else {
    rawBullets = text.split('.').map(s => s.trim());
  }
  const bullets = rawBullets
    .filter(s => s && s.length > 3)
    .map(s => s.replace(/^[\-–•\s]+/, ''))
    .slice(0, 8);

  // Narrative (fallback to full text minus headline)
  const narrative = text.replace(headline, '').trim();

  return {
    headline,
    subhead,
    bullets,
    narrative,
    body: text,
    beds, baths, sqft, year, neighborhood
  };
}

// Draws a bullet line with a dot + wrapped text
function drawBulletLine(doc, text, x, y, maxWidth, lineHeight) {
  // dot
  doc.setFillColor(17, 24, 39);
  doc.circle(x + 3, y - 4, 2, 'F');

  const left = x + 12;
  const lines = wrapText(doc, text, maxWidth - 12);
  lines.forEach((ln, i) => {
    doc.text(ln, left, y + i*lineHeight);
  });
  return y + lineHeight * lines.length;
}

// Inline SVG (your landing logo, simplified) — we’ll rasterize it at runtime
const BRAND_SVG_STRING = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7C5CFF"/>
      <stop offset="100%" stop-color="#5BC0FF"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="232" height="232" rx="48" fill="#0f1218" stroke="url(#g)" stroke-width="2"/>
  <path d="M150 36l-54 84h40l-30 100 84-124h-44l4-60z" fill="url(#g)"/>
  <path d="M56 188c18 20 48 32 76 32 38 0 66-16 82-44" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round"/>
</svg>
`;

// Convert an SVG string to PNG data URL via offscreen canvas (works in browsers)
async function svgToPngDataURL(svgString, width = 128, height = 128) {
  try {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });
    img.src = svgUrl;
    await loaded;

    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(svgUrl);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

// Fetch an image (PNG/JPG/SVG endpoint) and return a data URL
async function fetchImageAsDataURL(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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

  async function handleFlyerPDF(text, opts = {}) {
    try {
      // Load jspdf from CDN at runtime
      const mod = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      const jsPDF = (mod?.jspdf || window.jspdf)?.jsPDF;
      if (!jsPDF) throw new Error('jspdf not available');
  
      // ----------- CONFIG -----------
      const doc = new jsPDF({ unit: 'pt', format: 'letter' }); // 612 x 792
      const M = 48; const W = 612; const H = 792;
      const colGap = 24;
      const colW = (W - M*2 - colGap) / 2;
      const leftX = M, rightX = M + colW + colGap;
  
      // Target URL for QR (later: a per-listing permalink)
      const targetUrl = opts.url || 'https://app.listgenie.ai';
  
      // Parse listing text
      const parsed = parseListingForFlyer(text);
  
      // Prepare assets (logo PNG from inline SVG + QR PNG from API)
      const logoPng = await svgToPngDataURL(BRAND_SVG_STRING, 88, 88);
      const qrPng = await fetchImageAsDataURL(
        `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(targetUrl)}`
      );
  
      // ===== Top Header Ribbon =====
      doc.setFillColor(15, 18, 24);
      doc.rect(0, 0, W, 96, 'F');
      doc.setDrawColor(124, 92, 255);
      doc.setLineWidth(1);
      doc.line(0, 96, W, 96);
  
      // Brand (logo + title)
      const logoY = 24;
      if (logoPng) {
        doc.addImage(logoPng, 'PNG', M, logoY, 44, 44); // small logo
      }
      doc.setTextColor('#E9ECF1');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
      doc.text('ListGenie — Property Flyer', M + 56, logoY + 30);
  
      // ===== Headline / Subheader =====
      doc.setTextColor('#0b0d11');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      const headlineLines = wrapText(doc, parsed.headline, W - M*2);
      doc.text(headlineLines, M, 128);
  
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      doc.setTextColor('#4b5563');
      doc.text(parsed.subhead, M, 150);
  
      // ===== Two columns =====
      // Right: photo placeholder
      doc.setDrawColor(210); doc.setFillColor(244, 246, 249);
      const photoY = 180; const photoH = 260;
      doc.roundedRect(rightX, photoY, colW, photoH, 12, 12, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setTextColor('#6b7280'); doc.setFontSize(12);
      doc.text('Property Photo', rightX + colW/2, photoY + photoH/2, { align: 'center' });
  
      // Left: highlights
      let y = 188;
      doc.setTextColor('#0b0d11'); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('Highlights', leftX, y);
      y += 22;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      parsed.bullets.slice(0, 5).forEach(line => {
        y = drawBulletLine(doc, line, leftX, y, colW, 14);
        y += 2;
      });
  
      // Feature band under photo
      const bandY = photoY + photoH + 18;
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(rightX, bandY, colW, 64, 10, 10, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#6b21a8');
      const feat = [
        parsed.beds && `${parsed.beds} Beds`,
        parsed.baths && `${parsed.baths} Baths`,
        parsed.sqft && `${parsed.sqft} Sq Ft`,
        parsed.year && `Built ${parsed.year}`,
      ].filter(Boolean).join('  •  ');
      doc.text(feat || 'Spacious • Updated • Move-in Ready', rightX + 12, bandY + 24);
  
      // Lower narrative (left)
      const lowerY = bandY + 100;
      const narrativeTop = Math.max(y + 12, lowerY);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor('#0b0d11');
      doc.text('Overview', leftX, narrativeTop);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor('#111827');
      const bodyLines = wrapText(doc, parsed.narrative || parsed.body, colW);
      let bodyY = narrativeTop + 18;
      bodyLines.slice(0, 28).forEach(line => { doc.text(line, leftX, bodyY); bodyY += 16; });
  
      // ===== Footer: agent + QR =====
      const footerY = H - 96;
      doc.setDrawColor(230); doc.line(M, footerY, W - M, footerY);
  
      const agentName  = (user?.fullName || user?.username || 'Your Name').toString();
      const agentEmail = (user?.primaryEmailAddress?.emailAddress || 'you@yourbrokerage.com').toString();
      const agentPhone = '(___) ___-____';
  
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#0b0d11');
      doc.text(agentName, M, footerY + 24);
  
      doc.setFont('helvetica', 'normal'); doc.setTextColor('#4b5563');
      doc.text(`${agentEmail}  •  ${agentPhone}`, M, footerY + 40);
  
      // QR block with brand
      const qrSize = 72;
      const qrX = W - M - qrSize - 12;
      const qrY = footerY + 14;
      if (qrPng) {
        doc.addImage(qrPng, 'PNG', qrX, qrY, qrSize, qrSize);
      } else {
        // fallback box
        doc.setDrawColor(210);
        doc.roundedRect(qrX, qrY, qrSize, qrSize, 6, 6);
      }
      // tiny brand under QR
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#6b7280');
      doc.text('listgenie.ai', qrX + qrSize/2, qrY + qrSize + 14, { align: 'center' });
  
      // save
      doc.save('listing-flyer.pdf');
      toast('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast('Could not generate PDF (network blocked?)');
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