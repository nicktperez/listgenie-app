// pages/chat.js
import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useUser } from '@clerk/nextjs';
import ProGate from '@/components/ProGate';

// ------------ helpers ------------
function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function nowStamp() {
  const d = new Date();
  return d.toLocaleString();
}

/**
 * Try to coerce various model response shapes into readable text.
 * Supports:
 * { type: 'listing', headline, mls:{body}, bullets:[...], variants:[{label,text}] }
 * { blocks:[...] }  // any structured content
 * plain string
 */
function coerceToReadableText(payload) {
  try {
    if (typeof payload === 'string') {
      return payload.trim();
    }
    if (!payload || typeof payload !== 'object') {
      return '';
    }

    // common ListingGen shape
    if (payload.type === 'listing') {
      const out = [];
      if (payload.headline) out.push(payload.headline);
      if (payload.mls?.body) out.push('\n' + payload.mls.body);
      if (Array.isArray(payload.bullets) && payload.bullets.length) {
        out.push('\nHighlights:\n• ' + payload.bullets.filter(Boolean).join('\n• '));
      }
      if (Array.isArray(payload.variants) && payload.variants.length) {
        for (const v of payload.variants) {
          if (!v?.text) continue;
          if (v.label) out.push(`\n${v.label}:\n${v.text}`);
          else out.push('\n' + v.text);
        }
      }
      return out.join('\n').trim();
    }

    // generic blocks -> join text fields
    if (Array.isArray(payload.blocks)) {
      return payload.blocks
        .map(b => (typeof b === 'string' ? b : b?.text || ''))
        .filter(Boolean)
        .join('\n')
        .trim();
    }

    // best effort: flatten simple object fields
    const flat = [];
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v === 'string') flat.push(v);
      if (Array.isArray(v)) flat.push(v.filter(Boolean).join('\n'));
      if (typeof v === 'object' && v && v.text) flat.push(v.text);
    }
    if (flat.length) return flat.join('\n').trim();

    return JSON.stringify(payload);
  } catch {
    try {
      return typeof payload === 'string' ? payload : JSON.stringify(payload);
    } catch {
      return String(payload ?? '');
    }
  }
}

// ------------ small UI bits ------------
function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-sm',
        active
          ? 'bg-white/10 text-white'
          : 'bg-white/5 text-white/80 hover:bg-white/10'
      )}
    >
      {children}
    </button>
  );
}

function ThinkingBubble() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-white/70 text-sm">
      <span className="inline-flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.2s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.05s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" />
      </span>
      Thinking
    </div>
  );
}

// ------------ Flyer Modal ------------
function FlyerModal({
  open,
  onClose,
  form,
  setForm,
  onGenerate,
  onSaveLogo,
  flyerBusy,
}) {
  const topRef = useRef(null);

  useEffect(() => {
    if (open) {
      // scroll into view when opened
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [open]);

  if (!open) return null;

  function onFile(e, key) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, [key]: reader.result }));
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60">
      <div ref={topRef} className="w-full max-w-3xl rounded-2xl bg-[#12141a] p-6 shadow-xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Create flyer PDF</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">Close</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-sm text-white/70">
              Agent name
              <input
                className="mt-1 w-full rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                value={form.agent_name || ''}
                onChange={e => setForm(s => ({ ...s, agent_name: e.target.value }))}
              />
            </label>

            <label className="block text-sm text-white/70">
              Agent email
              <input
                className="mt-1 w-full rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                value={form.agent_email || ''}
                onChange={e => setForm(s => ({ ...s, agent_email: e.target.value }))}
              />
            </label>

            <label className="block text-sm text-white/70">
              Agent phone
              <input
                className="mt-1 w-full rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                value={form.agent_phone || ''}
                onChange={e => setForm(s => ({ ...s, agent_phone: e.target.value }))}
              />
            </label>

            <label className="block text-sm text-white/70">
              Brokerage
              <input
                className="mt-1 w-full rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                value={form.brokerage || ''}
                onChange={e => setForm(s => ({ ...s, brokerage: e.target.value }))}
              />
            </label>

            <label className="block text-sm text-white/70">
              Brokerage logo upload (PNG/JPG/SVG)
              <input
                type="file"
                accept="image/*,.svg"
                className="mt-1 block w-full text-white/80"
                onChange={e => onFile(e, 'logoDataUrl')}
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
                onClick={onSaveLogo}
                disabled={flyerBusy || !form.logoDataUrl}
                title={!form.logoDataUrl ? 'Choose a logo file first' : 'Save to profile'}
              >
                {flyerBusy ? 'Saving…' : 'Save uploaded logo to profile'}
              </button>
              {form.logoUrl ? (
                <span className="text-xs text-emerald-300">Saved ✓</span>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <fieldset className="border border-white/10 rounded-lg p-3">
              <legend className="px-1 text-sm text-white/70">Templates</legend>

              <label className="flex items-center gap-2 text-white/80 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={!!form.useStandard}
                  onChange={e => setForm(s => ({ ...s, useStandard: e.target.checked }))}
                />
                Standard (headline + highlights)
              </label>

              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.useOpenHouse}
                  onChange={e => setForm(s => ({ ...s, useOpenHouse: e.target.checked }))}
                />
                Open House (banner + date/time/address + optional map QR)
              </label>

              {!!form.useOpenHouse && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                    placeholder="Date (e.g. Sat Aug 24)"
                    value={form.oh_date || ''}
                    onChange={e => setForm(s => ({ ...s, oh_date: e.target.value }))}
                  />
                  <input
                    className="rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                    placeholder="Time (e.g. 1–4 PM)"
                    value={form.oh_time || ''}
                    onChange={e => setForm(s => ({ ...s, oh_time: e.target.value }))}
                  />
                  <input
                    className="col-span-2 rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                    placeholder="Address"
                    value={form.oh_address || ''}
                    onChange={e => setForm(s => ({ ...s, oh_address: e.target.value }))}
                  />
                  <input
                    className="col-span-2 rounded-md bg-white/5 text-white p-2 outline-none border border-white/10"
                    placeholder="Maps URL (optional for QR)"
                    value={form.oh_maps_url || ''}
                    onChange={e => setForm(s => ({ ...s, oh_maps_url: e.target.value }))}
                  />
                </div>
              )}
            </fieldset>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            className="px-3 py-1.5 rounded-md bg-indigo-500/80 text-white hover:bg-indigo-500"
            disabled={!form.useStandard && !form.useOpenHouse}
          >
            Generate PDF{form.useStandard && form.useOpenHouse ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------ main ------------
export default function ChatPage() {
  const { user } = useUser();

  const [tone, setTone] = useState('mls');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text:string, raw?:any}
  const [loading, setLoading] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);

  // flyer modal
  const [showFlyer, setShowFlyer] = useState(false);
  const [flyerForm, setFlyerForm] = useState({
    useStandard: true,
    useOpenHouse: false,
  });
  const [flyerBusy, setFlyerBusy] = useState(false);

  // compact examples (white text, auto-hide after first send)
  const examples = useMemo(
    () => [
      '3 bed, 2 bath, 1,850 sqft in Fair Oaks, remodeled kitchen with quartz counters, large backyard near parks.',
      'Downtown loft: 1 bed, skyline views, floor-to-ceiling windows, walkable to coffee shops.',
      'Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, fenced garden.',
    ],
    []
  );

  // load agent profile into flyer form on first open
  async function loadAgentProfile() {
    try {
      const r = await fetch('/api/agent/get');
      const j = await r.json();
      if (j?.ok && j.profile) {
        setFlyerForm(prev => ({
          ...prev,
          agent_name: j.profile.agent_name || prev.agent_name,
          agent_email: j.profile.agent_email || prev.agent_email,
          agent_phone: j.profile.agent_phone || prev.agent_phone,
          brokerage: j.profile.brokerage || prev.brokerage,
          logoUrl: j.profile.logo_url || prev.logoUrl,
        }));
      }
    } catch {}
  }

  useEffect(() => {
    if (showFlyer) loadAgentProfile();
  }, [showFlyer]);

  async function onSend() {
    if (!input.trim()) return;
    setLoading(true);
    setSentOnce(true);

    const userMsg = { role: 'user', text: input.trim(), at: nowStamp() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          text: userMsg.text,
        }),
      });
      const j = await r.json();

      if (!j?.ok) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: 'Server error', at: nowStamp() },
        ]);
      } else {
        const readable = coerceToReadableText(j.message?.content ?? j.message);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: readable, raw: j.message, at: nowStamp() },
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Server error', at: nowStamp() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ----- Flyer integrations -----
  async function uploadLogoAndRemember() {
    try {
      if (!flyerForm?.logoDataUrl) {
        alert('Choose a logo file first');
        return;
      }
      setFlyerBusy(true);

      const res = await fetch('/api/agent/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: flyerForm.logoDataUrl,
          filename: 'logo',
          remember: true,
        }),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || 'Upload failed');

      setFlyerForm(prev => ({ ...prev, logoUrl: j.url }));
      alert('Logo saved to profile');
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    } finally {
      setFlyerBusy(false);
    }
  }

  async function handleGeneratePdf() {
    try {
      setFlyerBusy(true);

      // persist profile (agent name/email/phone/brokerage, logoUrl)
      await fetch('/api/agent/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: flyerForm.agent_name || '',
          agent_email: flyerForm.agent_email || '',
          agent_phone: flyerForm.agent_phone || '',
          brokerage: flyerForm.brokerage || '',
          logo_url: flyerForm.logoUrl || '',
        }),
      }).catch(() => {});

      // Take the last assistant text as body
      const last = [...messages].reverse().find(m => m.role === 'assistant');
      const bodyText = last?.text || '';

      // Request PDFs (one or two)
      const payload = {
        body: bodyText,
        standard: !!flyerForm.useStandard,
        open_house: !!flyerForm.useOpenHouse,
        oh: {
          date: flyerForm.oh_date || '',
          time: flyerForm.oh_time || '',
          address: flyerForm.oh_address || '',
          maps_url: flyerForm.oh_maps_url || '',
        },
        agent: {
          name: flyerForm.agent_name || '',
          email: flyerForm.agent_email || '',
          phone: flyerForm.agent_phone || '',
          brokerage: flyerForm.brokerage || '',
          logo_url: flyerForm.logoUrl || '',
        },
      };

      const r = await fetch('/api/flyer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) throw new Error('Failed to generate');
      // Could be a single blob or a zip; assume API returns application/pdf for one,
      // or multipart-like JSON with array of base64s. We’ll handle both.

      const ct = r.headers.get('Content-Type') || '';
      if (ct.includes('application/pdf')) {
        const blob = await r.blob();
        downloadBlob(blob, 'listgenie-flyer.pdf');
      } else {
        const j = await r.json();
        if (Array.isArray(j?.files)) {
          // { name, data: base64, contentType }
          for (const f of j.files) {
            const b = await (await fetch(`data:${f.contentType};base64,${f.data}`)).blob();
            downloadBlob(b, f.name || 'flyer.pdf');
          }
        } else if (j?.file) {
          const b = await (await fetch(`data:${j.file.contentType};base64,${j.file.data}`)).blob();
          downloadBlob(b, j.file.name || 'flyer.pdf');
        } else {
          throw new Error('Unexpected flyer response');
        }
      }

      setShowFlyer(false);
    } catch (e) {
      console.error(e);
      alert('Could not generate PDF');
    } finally {
      setFlyerBusy(false);
    }
  }

  // ----- Render -----
  return (
    <>
      <Head>
        <title>ListGenie.ai — Chat</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-[#0b0e14] to-[#0f1320] text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">

          {/* title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">ListGenie.ai Chat</h1>
            {/* Pro indicator */}
            <span className="text-xs rounded-full bg-white/10 px-2 py-0.5">{user ? 'Pro' : 'Free'}</span>
          </div>
          <p className="text-white/70 mt-1">
            Generate polished real estate listings plus social variants.
          </p>

          {/* tone */}
          <section className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Chip active={tone === 'mls'} onClick={() => setTone('mls')}>MLS-ready</Chip>
              <Chip active={tone === 'social'} onClick={() => setTone('social')}>Social caption</Chip>
              <Chip active={tone === 'luxury'} onClick={() => setTone('luxury')}>Luxury tone</Chip>
              <Chip active={tone === 'concise'} onClick={() => setTone('concise')}>Concise</Chip>
            </div>
          </section>

          {/* compact examples */}
          {!sentOnce && (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  className="truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-white hover:bg-white/10"
                  onClick={() => setInput(ex)}
                  title={ex}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {/* messages */}
          <section className="mt-4 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-[#12141a]">
                <div className="flex items-center justify-between px-3 py-2 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5">{m.role === 'user' ? 'You' : 'ListGenie'}</span>
                    <span>{m.at}</span>
                  </div>
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-md bg-white/10 px-3 py-1 text-white hover:bg-white/20"
                        onClick={() => copyToClipboard(m.text)}
                      >
                        Copy
                      </button>
                      <button
                        className="rounded-md bg-white/10 px-3 py-1 text-white hover:bg-white/20"
                        onClick={() => {
                          // optional save to your /api/listings/save
                          fetch('/api/listings/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              title: (m.text || '').slice(0, 60),
                              payload: { text: m.text, tone },
                            }),
                          }).catch(() => {});
                          alert('Saved to your listings');
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="rounded-md bg-indigo-500/80 px-3 py-1 text-white hover:bg-indigo-500"
                        onClick={() => setShowFlyer(true)}
                      >
                        Flyer (PDF)
                      </button>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4 whitespace-pre-wrap text-white/90">
                  {m.text || '[empty]'}
                </div>
              </div>
            ))}

            {loading && (
              <div className="px-2"><ThinkingBubble /></div>
            )}
          </section>

          {/* input */}
          <section className="mt-4">
            <div className="rounded-xl border border-white/10 bg-[#12141a] p-3">
              <textarea
                className="h-28 w-full resize-none rounded-md bg-white/5 p-3 text-white outline-none"
                placeholder="Describe the property and any highlights…"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <div className="mt-3 flex items-center justify-end">
                <button
                  onClick={onSend}
                  disabled={loading}
                  className="rounded-md bg-indigo-500/80 px-4 py-1.5 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Generating…' : 'Send'}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Flyer modal */}
        <FlyerModal
          open={showFlyer}
          onClose={() => setShowFlyer(false)}
          form={flyerForm}
          setForm={setFlyerForm}
          onGenerate={handleGeneratePdf}
          onSaveLogo={uploadLogoAndRemember}
          flyerBusy={flyerBusy}
        />
      </main>
    </>
  );
}