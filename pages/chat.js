// pages/chat.js
import { useEffect, useRef, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import useUserPlan from '@/lib/useUserPlan';

const EXAMPLES = [
  '3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.',
  'Downtown condo listing: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.',
  'Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, and fenced garden.',
];

const TONE_OPTIONS = ['MLS-ready', 'Social caption', 'Luxury tone', 'Concise'];

/* ------------------------ helpers: text handling ------------------------ */

function coerceToReadableText(s) {
  if (s == null) return '';

  if (typeof s === 'string') {
    const str = s.trim();
    if (str.startsWith('{') || str.startsWith('[')) {
      try { return coerceToReadableText(JSON.parse(str)); } catch {}
    }
    return str;
  }

  if (typeof s === 'object') {
    if (typeof s.body === 'string') return s.body;
    if (s.mls && typeof s.mls.body === 'string') return s.mls.body;
    if (s.message !== undefined) return coerceToReadableText(s.message);
    if (s.content !== undefined) return coerceToReadableText(s.content);
    if (Array.isArray(s.choices) && s.choices[0]?.message?.content) {
      return coerceToReadableText(s.choices[0].message.content);
    }
    if (Array.isArray(s.messages)) {
      return s.messages.map(coerceToReadableText).filter(Boolean).join('\n\n');
    }
    for (const k of ['text', 'output', 'result']) {
      if (typeof s[k] === 'string') return s[k];
    }
    try { return JSON.stringify(s, null, 2); } catch {}
  }

  return String(s);
}

function makeTitleFrom(t) {
  const first = (String(t || '')
    .split('\n')
    .map(s => s.trim())
    .find(Boolean)) || 'Listing';
  return first.length > 70 ? `${first.slice(0, 67)}…` : first;
}

/* ------------------------ helpers: flyer parsing ------------------------ */

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

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
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

/* ------------------------ inline Pro gate ------------------------ */

const Gate = ({ show }) => {
  if (!show) return null;
  return (
    <div className="gate">
      <div className="gate-title">Upgrade to Pro</div>
      <p className="gate-body">
        Your trial/plan doesn’t allow more generations. Upgrade to Pro to continue.
      </p>
      <a className="btn primary" href="/api/stripe/create-checkout-session">Upgrade</a>
    </div>
  );
};

/* ------------------------ Flyer modal ------------------------ */

function FlyerModal({ open, onClose, form, onFormChange, template, setTemplate, onSubmit }) {
  if (!open) return null;

  const handleFile = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    onFormChange({ ...form, [key]: dataUrl });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Flyer details</div>

        <div className="modal-row">
          <label className="radio">
            <input type="radio" name="tpl" checked={template==='standard'} onChange={()=>setTemplate('standard')}/>
            <span>Standard</span>
          </label>
          <label className="radio">
            <input type="radio" name="tpl" checked={template==='openHouse'} onChange={()=>setTemplate('openHouse')}/>
            <span>Open House</span>
          </label>
        </div>

        <div className="modal-grid">
          <label>
            Agent name
            <input value={form.agentName} onChange={e=>onFormChange({...form,agentName:e.target.value})}/>
          </label>
          <label>
            Agent email
            <input value={form.agentEmail} onChange={e=>onFormChange({...form,agentEmail:e.target.value})}/>
          </label>
          <label>
            Agent phone
            <input value={form.agentPhone} onChange={e=>onFormChange({...form,agentPhone:e.target.value})}/>
          </label>
          <label>
            Brokerage
            <input value={form.brokerage} onChange={e=>onFormChange({...form,brokerage:e.target.value})}/>
          </label>
          <label>
            Brokerage logo (PNG/JPG/SVG)
            <input type="file" accept="image/*,.svg" onChange={e=>handleFile(e,'logoDataUrl')}/>
          </label>
          <label>
            Property photo (PNG/JPG)
            <input type="file" accept="image/*" onChange={e=>handleFile(e,'photoDataUrl')}/>
          </label>

          {template === 'openHouse' && (
            <>
              <label>
                Date
                <input value={form.ohDate} onChange={e=>onFormChange({...form,ohDate:e.target.value})} placeholder="Aug 24, 1–4 PM"/>
              </label>
              <label>
                Time range
                <input value={form.ohTime} onChange={e=>onFormChange({...form,ohTime:e.target.value})} placeholder="1:00–4:00 PM"/>
              </label>
              <label>
                Address
                <input value={form.ohAddress} onChange={e=>onFormChange({...form,ohAddress:e.target.value})} placeholder="123 Main St, City"/>
              </label>
              <label>
                Link/Maps URL (for QR)
                <input value={form.ohUrl} onChange={e=>onFormChange({...form,ohUrl:e.target.value})} placeholder="https://maps..."/>
              </label>
            </>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={onSubmit}>Generate PDF</button>
        </div>

        <style jsx>{`
          .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
          .modal{width:min(760px,92vw);background:#0f1218;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px}
          .modal-title{font-weight:700;margin-bottom:10px}
          .modal-row{display:flex;gap:16px;margin-bottom:10px}
          .radio{display:flex;align-items:center;gap:8px;font-size:13px;color:#dfe3f0}
          .modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
          label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#b9c0cc}
          input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px;color:#e9ecf1}
          .modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
          .btn{padding:8px 12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.06);color:#fff}
          .btn.primary{background:#7c5cff;border-color:#6b54f2}
        `}</style>
      </div>
    </div>
  );
}

/* ------------------------ main page ------------------------ */

export default function ChatPage() {
  const { user } = useUser();
  const { isPro, trialStatus } = useUserPlan();

  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {role, text, at, tone?}
  const [thinking, setThinking] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);

  const [flyerOpen, setFlyerOpen] = useState(false);
  const [flyerDraftText, setFlyerDraftText] = useState('');
  const [flyerForm, setFlyerForm] = useState({
    agentName: '',
    agentEmail: '',
    agentPhone: '',
    brokerage: '',
    logoDataUrl: '',
    photoDataUrl: '',
    ohDate: '',
    ohTime: '',
    ohAddress: '',
    ohUrl: '',
  });
  const [flyerTemplate, setFlyerTemplate] = useState('standard'); // 'standard' | 'openHouse'

  const scrollRef = useRef(null);
  const canGenerate = isPro || trialStatus === 'active';
  const gated = !canGenerate;

  useEffect(() => {
    setFlyerForm(prev => ({
      ...prev,
      agentName: prev.agentName || (user?.fullName || user?.username || ''),
      agentEmail: prev.agentEmail || (user?.primaryEmailAddress?.emailAddress || ''),
    }));
  }, [user]);

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
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let data; try { data = await res.json(); } catch {}
      const text = coerceToReadableText(data);
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

  /* ------------------------ flyer generation ------------------------ */

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

      const {
        agentName = (user?.fullName || user?.username || 'Your Name'),
        agentEmail = (user?.primaryEmailAddress?.emailAddress || 'you@yourbrokerage.com'),
        agentPhone = '(___) ___-____',
        brokerage = '',
        logoDataUrl = '',
        photoDataUrl = '',
        targetUrl = 'https://app.listgenie.ai',
        template = 'standard', // 'standard' | 'openHouse'
        ohDate = '',
        ohTime = '',
        ohAddress = '',
        ohUrl = '',
        showBrandHeader = false,
        showBrandFooter = true,
      } = opts;

      const parsed = parseListingForFlyer(text);

      // Optional brand header (subtle)
      let topY = M;
      if (showBrandHeader) {
        doc.setFillColor(15, 18, 24); doc.rect(0, 0, W, 88, 'F');
        doc.setDrawColor(124, 92, 255); doc.setLineWidth(1); doc.line(0, 88, W, 88);
        doc.setTextColor('#E9ECF1'); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
        doc.text('ListGenie — Property Flyer', M, 54);
        topY = 102;
      }

      // Headline
      doc.setTextColor('#0b0d11');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(26);
      const headlineLines = wrapText(doc, parsed.headline, W - M*2);
      let y = topY + 10;
      headlineLines.forEach(line => { doc.text(line, M, y); y += 28; });

      // Subhead
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor('#4b5563');
      doc.text(parsed.subhead, M, y + 8);
      y += 32;

      // Open House banner strip (if template)
      if (template === 'openHouse') {
        const bandH = 44;
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(M, y, W - M*2, bandH, 8, 8, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor('#6b21a8');
        let bandText = 'Open House';
        const parts = [ohDate, ohTime, ohAddress].filter(Boolean);
        if (parts.length) bandText += ` — ${parts.join(' • ')}`;
        doc.text(bandText, M + 12, y + 28);

        // QR to maps/url if provided
        if (ohUrl) {
          const qrPng = await fetchImageAsDataURL(
            `https://api.qrserver.com/v1/create-qr-code/?size=108x108&data=${encodeURIComponent(ohUrl)}`
          );
          if (qrPng) {
            doc.addImage(qrPng, 'PNG', W - M - 108 - 8, y + (bandH - 108) / 2, 108, 108);
          }
        }
        y += bandH + 16;
      }

      // Right photo
      const photoY = y;
      const photoH = 260;
      if (photoDataUrl) {
        doc.addImage(photoDataUrl, 'JPEG', rightX, photoY, colW, photoH, undefined, 'FAST');
        doc.setDrawColor(210); doc.roundedRect(rightX, photoY, colW, photoH, 12, 12);
      } else {
        doc.setDrawColor(210); doc.setFillColor(244, 246, 249);
        doc.roundedRect(rightX, photoY, colW, photoH, 12, 12, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setTextColor('#6b7280'); doc.setFontSize(12);
        doc.text('Property Photo', rightX + colW/2, photoY + photoH/2, { align: 'center' });
      }

      // Left highlights
      doc.setTextColor('#0b0d11'); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('Highlights', leftX, y);
      y += 18;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      parsed.bullets.slice(0,5).forEach(line => { y = drawBulletLine(doc, line, leftX, y, colW, 16); y += 2; });

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

      // Overview
      const narrativeTop = Math.max(y + 16, bandY + 100);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor('#0b0d11');
      doc.text('Overview', leftX, narrativeTop);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor('#111827');
      let bodyY = narrativeTop + 18;
      wrapText(doc, parsed.narrative || parsed.body, colW).slice(0, 28)
        .forEach(line => { doc.text(line, leftX, bodyY); bodyY += 16; });

      // Footer with agent + brokerage + logo
      const footerY = H - 96;
      doc.setDrawColor(230); doc.line(M, footerY, W - M, footerY);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#0b0d11');
      doc.text(agentName || 'Your Name', M, footerY + 24);
      doc.setFont('helvetica', 'normal'); doc.setTextColor('#4b5563');
      const agentLine = [agentEmail, agentPhone].filter(Boolean).join('  •  ');
      doc.text(agentLine, M, footerY + 40);
      if (brokerage) doc.text(brokerage, M, footerY + 56);

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', W - M - 120, footerY + 8, 120, 48, undefined, 'FAST');
      }

      if (showBrandFooter) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#6b7280');
        doc.text('Generated with ListGenie.ai', W/2, footerY + 56, { align: 'center' });
      }

      doc.save(template === 'openHouse' ? 'open-house-flyer.pdf' : 'listing-flyer.pdf');
      toast('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast('Could not generate PDF (network blocked?)');
    }
  }

  /* ------------------------ render ------------------------ */

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
                <button key={i} className="example-chip" onClick={() => setInput(ex)}>{ex}</button>
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

            {messages.map(m => {
              const clean = coerceToReadableText(m.text);
              return (
                <div key={m.at} className={`bubble ${m.role==='assistant'?'assistant':'user'}`}>
                  {clean}
                  {m.role==='assistant' && (
                    <div className="tools">
                      <button className="tool" onClick={() => handleCopy(clean)}>Copy</button>
                      <button className="tool" onClick={() => handleSave(clean)}>Save</button>
                      <button
                        className="tool primary"
                        onClick={() => {
                          setFlyerDraftText(clean);
                          setFlyerOpen(true);
                        }}
                      >
                        Flyer (PDF)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {thinking && (
              <div className="thinking"><span className="dot"/><span className="dot"/><span className="dot"/>&nbsp;Thinking</div>
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

          <Gate show={gated} />
        </div>

        {/* Flyer modal */}
        <FlyerModal
          open={flyerOpen}
          onClose={() => setFlyerOpen(false)}
          form={flyerForm}
          onFormChange={setFlyerForm}
          template={flyerTemplate}
          setTemplate={setFlyerTemplate}
          onSubmit={async () => {
            setFlyerOpen(false);
            await handleFlyerPDF(flyerDraftText, {
              agentName: flyerForm.agentName,
              agentEmail: flyerForm.agentEmail,
              agentPhone: flyerForm.agentPhone,
              brokerage: flyerForm.brokerage,
              logoDataUrl: flyerForm.logoDataUrl,
              photoDataUrl: flyerForm.photoDataUrl,
              template: flyerTemplate,
              ohDate: flyerForm.ohDate,
              ohTime: flyerForm.ohTime,
              ohAddress: flyerForm.ohAddress,
              ohUrl: flyerForm.ohUrl,
              showBrandHeader: false,
              showBrandFooter: true,
            });
          }}
        />
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
        .gate{margin-top:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:12px;padding:16px}
        .gate-title{font-weight:700;margin-bottom:6px}
        .gate-body{color:#b9c0cc;margin:0 0 10px}
        .signedout{max-width:600px;margin:80px auto;text-align:center}
        .btn.primary{display:inline-block;text-decoration:none;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#7c5cff;color:#fff}
        .thinking{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.05);margin:10px 6px;color:#b9c0cc;font-size:12px}
        @keyframes lgBounce {0%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}100%{opacity:.25;transform:translateY(0)}}
        .dot{width:6px;height:6px;border-radius:50%;background:#d1d5db;display:inline-block;animation:lgBounce 1.2s infinite}
        .dot:nth-child(1){animation-delay:0s}.dot:nth-child(2){animation-delay:.15s}.dot:nth-child(3){animation-delay:.3s}
        .lg-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(22,22,24,.9);color:#fff;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);font-size:12px;z-index:9999}
      `}</style>
    </div>
  );
}