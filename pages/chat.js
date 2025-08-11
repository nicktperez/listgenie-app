// pages/chat.js
import { useEffect, useRef, useState } from 'react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import ProGate from '@/components/ProGate';
import useUserPlan from '@/lib/useUserPlan';

const EXAMPLES = [
  '3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.',
  'Downtown condo listing: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.',
  'Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, and fenced garden.',
];

const TONE_OPTIONS = ['MLS-ready', 'Social caption', 'Luxury tone', 'Concise'];

/* ---------- helpers ---------- */
function coerceToReadableText(s) {
  if (s == null) return '';
  const raw = String(s);
  try {
    const maybe = JSON.parse(raw);
    if (maybe && typeof maybe === 'object') {
      if (typeof maybe.body === 'string') return maybe.body;
      if (maybe.mls && typeof maybe.mls.body === 'string') return maybe.mls.body;
      if (maybe.message && typeof maybe.message.content === 'string') return maybe.message.content;
    }
  } catch {}
  return raw;
}

function wrapText(doc, text, maxWidth) {
  const safe = String(text || '');
  const words = safe.split(/\s+/);
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

function makeTitleFrom(t) {
  const first = (String(t || '').split('\n').map(s => s.trim()).find(Boolean)) || 'Listing';
  return first.length > 70 ? `${first.slice(0, 67)}…` : first;
}

/* Flyer parsing + drawing helpers */
function parseListingForFlyer(raw) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim();

  let headline = text.split(/[.!?\n]/)[0]?.trim() || 'Beautiful Home';
  if (headline.length > 72) headline = headline.slice(0, 69) + '…';

  const beds = (text.match(/(\d+)\s*(bed|beds|bedrooms?)/i) || [])[1];
  const baths = (text.match(/(\d+)\s*(bath|baths|bathrooms?)/i) || [])[1];
  const sqft = (text.match(/([\d,]{3,})\s*(sq\s*ft|sqft|square\s*feet)/i) || [])[1];
  const year = (text.match(/\b(19|20)\d{2}\b/) || [])[0];
  const nbhm = text.match(/\b(in|near)\s+([A-Za-z][A-Za-z\s\-']{2,})/i);
  const neighborhood = nbhm ? nbhm[2].trim().replace(/\s+near\s*$/i,'') : null;

  const parts = [
    beds && `${beds} Beds`,
    baths && `${baths} Baths`,
    sqft && `${sqft.replace(/,/g, ',')} Sq Ft`,
    neighborhood && neighborhood,
  ].filter(Boolean);
  const subhead = parts.join('  •  ') || 'Updated • Spacious • Move-in Ready';

  let rawBullets = [];
  if (text.includes('•')) rawBullets = text.split('•').map(s => s.trim());
  else rawBullets = text.split('.').map(s => s.trim());

  const bullets = rawBullets
    .filter(s => s && s.length > 3)
    .map(s => s.replace(/^[\-–•\s]+/, ''))
    .slice(0, 8);

  const narrative = text.replace(headline, '').trim();

  return { headline, subhead, bullets, narrative, body: text, beds, baths, sqft, year, neighborhood };
}

function drawBulletLine(doc, text, x, y, maxWidth, lineHeight) {
  const safe = String(text || '');
  doc.setFillColor(17, 24, 39);
  doc.circle(x + 3, y - 4, 2, 'F');
  const left = x + 12;
  const lines = wrapText(doc, safe, maxWidth - 12);
  lines.forEach((ln, i) => doc.text(ln, left, y + i*lineHeight));
  return y + lineHeight * lines.length;
}

/* Inline SVG logo we rasterize at runtime for the flyer */
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

async function svgToPngDataURL(svgString, width = 128, height = 128) {
  try {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png');
  } catch { return null; }
}

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
  } catch { return null; }
}

/* ---------- page ---------- */
export default function ChatPage() {
  const { user } = useUser();
  const { plan, isPro, trialStatus } = useUserPlan();
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {role, text, at, tone?}
  const [thinking, setThinking] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);
  const scrollRef = useRef(null);

  const canGenerate = isPro || trialStatus === 'active';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  function toast(s) {
    const el = document.createElement('div');
    el.textContent = String(s || '');
    el.className = 'lg-toast';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  function setExample(s) { setInput(s); }

  async function handleSend(e) {
    e?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed, at: Date.now() }]);
    setInput('');
    setThinking(true);
    if (!sentOnce) setSentOnce(true);

    const system = [
      `You are ListGenie, a real-estate listing assistant.`,
      `Write MLS-friendly listings that avoid fair-housing risks and focus on property features.`,
      `Use confident, tasteful language. Return polished prose.`,
      `Also consider a printable flyer: short headline + quick bullets suitable for a one-page handout.`,
      `Avoid asking follow-up questions unless info is clearly missing.`,
    ].join(' ');

    const body = {
      system,
      tone,
      messages: [
        ...messages.map(m => ({ role: m.role, content: String(m.text || '') })),
        { role: 'user', content: trimmed },
      ],
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let data; try { data = await res.json(); } catch {}
      const text = coerceToReadableText(data?.message ?? data ?? '');
      setMessages(prev => [...prev, { role: 'assistant', text, at: Date.now(), tone }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry—there was a server error.', at: Date.now() }]);
    } finally {
      setThinking(false);
    }
  }

  async function handleCopy(text) {
    try { await navigator.clipboard.writeText(String(text || '')); toast('Copied!'); }
    catch { toast('Copy failed'); }
  }

  async function handleSave(text) {
    try {
      const title = makeTitleFrom(text);
      const payload = { tone, text: String(text || '') };
      const r = await fetch('/api/listings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, payload }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      toast('Saved to Listings');
    } catch (e) {
      console.error(e); toast('Save failed');
    }
  }

  async function handleFlyerPDF(text, opts = {}) {
    try {
      const mod = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      const jsPDF = (mod?.jspdf || window.jspdf)?.jsPDF;
      if (!jsPDF) throw new Error('jspdf not available');

      const doc = new jsPDF({ unit: 'pt', format: 'letter' }); // 612 x 792
      const M = 48, W = 612, H = 792;
      const colGap = 24;
      const colW = (W - M*2 - colGap) / 2;
      const leftX = M, rightX = M + colW + colGap;

      const targetUrl = opts.url || 'https://app.listgenie.ai';
      const parsed = parseListingForFlyer(text);

      const logoPng = await svgToPngDataURL(BRAND_SVG_STRING, 88, 88);
      const qrPng = await fetchImageAsDataURL(
        `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(targetUrl)}`
      );

      // Header
      doc.setFillColor(15, 18, 24); doc.rect(0, 0, W, 96, 'F');
      doc.setDrawColor(124, 92, 255); doc.setLineWidth(1); doc.line(0, 96, W, 96);

      if (logoPng) doc.addImage(logoPng, 'PNG', M, 24, 44, 44);
      doc.setTextColor('#E9ECF1');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
      doc.text('ListGenie — Property Flyer', M + 56, 54);

      // Headline / Subhead
      doc.setTextColor('#0b0d11');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      doc.text(wrapText(doc, parsed.headline, W - M*2), M, 128);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor('#4b5563');
      doc.text(parsed.subhead, M, 150);

      // Right photo box
      doc.setDrawColor(210); doc.setFillColor(244, 246, 249);
      const photoY = 180, photoH = 260;
      doc.roundedRect(rightX, photoY, colW, photoH, 12, 12, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setTextColor('#6b7280'); doc.setFontSize(12);
      doc.text('Property Photo', rightX + colW/2, photoY + photoH/2, { align: 'center' });

      // Left highlights
      let y = 188;
      doc.setTextColor('#0b0d11'); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('Highlights', leftX, y); y += 22;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      parsed.bullets.slice(0,5).forEach(line => { y = drawBulletLine(doc, line, leftX, y, colW, 14); y += 2; });

      // Band under photo
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

      // Overview
      const narrativeTop = Math.max(y + 12, bandY + 100);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor('#0b0d11');
      doc.text('Overview', leftX, narrativeTop);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor('#111827');
      const bodyLines = wrapText(doc, parsed.narrative || parsed.body, colW);
      let bodyY = narrativeTop + 18;
      bodyLines.slice(0, 28).forEach(line => { doc.text(line, leftX, bodyY); bodyY += 16; });

      // Footer
      const footerY = H - 96;
      doc.setDrawColor(230); doc.line(M, footerY, W - M, footerY);

      const agentName  = String(user?.fullName || user?.username || 'Your Name');
      const agentEmail = String(user?.primaryEmailAddress?.emailAddress || 'you@yourbrokerage.com');
      const agentPhone = '(___) ___-____';

      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#0b0d11');
      doc.text(agentName, M, footerY + 24);
      doc.setFont('helvetica', 'normal'); doc.setTextColor('#4b5563');
      doc.text(`${agentEmail}  •  ${agentPhone}`, M, footerY + 40);

      const qrSize = 72, qrX = W - M - qrSize - 12, qrY = footerY + 14;
      if (qrPng) doc.addImage(qrPng, 'PNG', qrX, qrY, qrSize, qrSize);
      else { doc.setDrawColor(210); doc.roundedRect(qrX, qrY, qrSize, qrSize, 6, 6); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#6b7280');
      doc.text('listgenie.ai', qrX + qrSize/2, qrY + qrSize + 14, { align: 'center' });

      doc.save('listing-flyer.pdf');
      toast('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast('Could not generate PDF (network blocked?)');
    }
  }

  const gated = !canGenerate;

  return (
    <div className="page">
      <SignedIn>
        <div className="header">
          <h1>ListGenie.ai Chat</h1>
          <span className="pill">{isPro ? 'Pro' : trialStatus === 'active' ? 'Trial' : 'Free'}</span>
        </div>
        <p className="sub">Generate polished real estate listings plus social variants.</p>

        <div className="content">
          {/* tone */}
          <div className="tone-row">
            {TONE_OPTIONS.map(t => (
              <button key={t} className={`tone ${t===tone?'on':''}`} onClick={() => setTone(t)}>{t}</button>
            ))}
          </div>

          {/* examples */}
          {!sentOnce && (
            <div className="examples">
              {EXAMPLES.map((ex, i) => (
                <button key={i} className="example-chip" onClick={() => setExample(ex)}>{ex}</button>
              ))}
            </div>
          )}

          {/* chat */}
          <div className="chat" ref={scrollRef}>
            {!sentOnce && (
              <div className="bubble assistant">
                Hi! Tell me about the property (beds, baths, sqft, neighborhood, upgrades, nearby amenities) and I’ll draft a compelling listing. You can also paste bullet points.
              </div>
            )}

            {messages.map(m => (
              <div key={m.at} className={`bubble ${m.role==='assistant'?'assistant':'user'}`}>
                {coerceToReadableText(m.text)}
                {m.role==='assistant' && (
                  <div className="tools">
                    <button className="tool" onClick={() => handleCopy(m.text)}>Copy</button>
                    <button className="tool" onClick={() => handleSave(m.text)}>Save</button>
                    <button className="tool primary" onClick={() => handleFlyerPDF(m.text)}>Flyer (PDF)</button>
                  </div>
                )}
              </div>
            ))}

            {thinking && (
              <div className="thinking">
                <span className="dot"/><span className="dot"/><span className="dot"/>&nbsp;Thinking
              </div>
            )}
          </div>

          {/* input */}
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

          {gated && <ProGate />}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="signedout">
          <p>You’ll need to sign in to use ListGenie.</p>
          <SignInButton mode="modal"><button className="btn primary">Sign in</button></SignInButton>
        </div>
      </SignedOut>

      <style jsx>{`
        .page{min-height:100vh;background:radial-gradient(1200px 500px at 50% -180px,rgba(124,92,255,.2),transparent 70%),#0b0d11;color:#e9ecf1}
        .header{max-width:900px;margin:0 auto;padding:16px 16px 0;display:flex;justify-content:space-between;align-items:center}
        h1{margin:0;font-size:24px}
        .pill{font-size:12px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05)}
        .sub{max-width:900px;margin:6px auto 14px;color:#b9c0cc;padding:0 16px}
        .content{max-width:900px;margin:0 auto;padding:0 16px 120px}
        .tone-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
        .tone{padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#dfe3f0;font-size:14px}
        .tone.on{background:#7c5cff;border-color:#6b54f2;color:#fff}
        .examples{display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:10px}
        .example-chip{text-align:left;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;opacity:.92;font-size:13px}
        .example-chip:hover{background:rgba(255,255,255,.1)}
        .chat{border:1px solid rgba(255,255,255,.12);background:rgba(14,17,23,.6);border-radius:14px;padding:10px;height:520px;overflow-y:auto}
        .bubble{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:12px;padding:12px;margin:10px 6px;white-space:pre-wrap;line-height:1.5}
        .assistant{background:rgba(124,92,255,.12);border-color:rgba(124,92,255,.35)}
        .input-row{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:10px;align-items:center}
        textarea{width:100%;resize:vertical;min-height:64px;color:#e9ecf1;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px}
        .send{padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#7c5cff;color:#fff}
        .send:disabled{opacity:.6;cursor:not-allowed}
        .tools{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
        .tool{padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px}
        .tool.primary{background:#7c5cff;border-color:#6b54f2}
        .signedout{max-width:600px;margin:80px auto;text-align:center}
        .btn.primary{padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#7c5cff;color:#fff}
        .thinking{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.05);margin:10px 6px;color:#b9c0cc;font-size:12px}
        @keyframes lgBounce {0%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}100%{opacity:.25;transform:translateY(0)}}
        .dot{width:6px;height:6px;border-radius:50%;background:#d1d5db;display:inline-block;animation:lgBounce 1.2s infinite}
        .dot:nth-child(1){animation-delay:0s}.dot:nth-child(2){animation-delay:.15s}.dot:nth-child(3){animation-delay:.3s}
        .lg-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(22,22,24,.9);color:#fff;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);font-size:12px;z-index:9999}
      `}</style>
    </div>
  );
}