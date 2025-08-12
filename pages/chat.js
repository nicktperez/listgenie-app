// pages/chat.js — ListGenie.ai (enhanced)
// - Restored dark UI
// - Streaming chat with readable output cleanup
// - Variant detection & styled cards (MLS / Social / Luxury / Concise)
// - Copy-to-clipboard buttons for each variant and full response (with “Copied!” state)
// - Pro-gated flyer modal (Standard + Open House)
// - Downloads PDF via /api/flyer

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import useUserPlan from "@/hooks/useUserPlan";

/** ---------------- Utilities ---------------- */
function stripFences(s = "") {
  return s
    .replace(/```json\s*([\s\S]*?)\s*```/gi, "$1")
    .replace(/```\s*([\s\S]*?)\s*```/gi, "$1")
    .trim();
}

// Coerce any LLM output (raw string, fenced JSON, or object) to readable text
function coerceToReadableText(raw) {
  if (!raw) return "";

  // If object-like, try common shapes
  if (typeof raw === "object") {
    const candidate = raw?.mls?.body || raw?.mls || raw?.content || raw?.text || raw?.body;
    if (candidate) return stripFences(String(candidate));
    try { return stripFences(JSON.stringify(raw, null, 2)); } catch { /* noop */ }
  }

  const txt = String(raw);
  // Try to parse JSON
  try {
    const j = JSON.parse(stripFences(txt));
    const candidate = j?.mls?.body || j?.mls || j?.content || j?.text || j?.body;
    if (candidate) return stripFences(String(candidate));
    return stripFences(JSON.stringify(j, null, 2));
  } catch {
    return stripFences(txt);
  }
}

// Detect formatted sections
function splitVariants(text) {
  if (!text) return null;
  const patterns = [
    { key: "mls",    rx: /(^|\n)\s*#{0,3}\s*(MLS-?Ready|MLS Ready)\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
    { key: "social", rx: /(^|\n)\s*#{0,3}\s*Social\s*Caption\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
    { key: "luxury", rx: /(^|\n)\s*#{0,3}\s*Luxury\s*Tone\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
    { key: "concise", rx: /(^|\n)\s*#{0,3}\s*Concise(?:\s*Version)?\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
  ];
  const out = {}; let found = false;
  for (const { key, rx } of patterns) {
    const m = text.match(rx);
    if (m) { out[key] = (m[3] || m[2] || "").trim(); found = true; }
  }
  return found ? out : null;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** ---------------- Page ---------------- */
export default function ChatPage() {
  const router = useRouter();
  const { isPro, isTrial, isExpired, daysLeft, refreshPlan, canGenerate, plan, trialEnd } = useUserPlan();

  // Input
  const [tone, setTone] = useState("mls");
  const [input, setInput] = useState("");

  // Chat state
  const [messages, setMessages] = useState([
    // { role: 'user'|'assistant', content: string, pretty?: string }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Flyers
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [flyerTypes, setFlyerTypes] = useState({ standard: true, openHouse: false });
  const [flyerBusy, setFlyerBusy] = useState(false);

  // Questions modal
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Track all Q&A history for better AI memory
  const [allQuestionsAndAnswers, setAllQuestionsAndAnswers] = useState([]);

  // Copy state (for "Copied!" UI)
  const [copiedKey, setCopiedKey] = useState(null);
  async function handleCopy(key, text) {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  }

  const listRef = useRef(null);
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const examples = [
    {
      label: "3BR Craftsman in Midtown",
      text:
        "3 bed, 2 bath Craftsman in Midtown. 1,650 sqft, updated kitchen, quartz counters, oak floors, detached garage, walkable to cafés and parks.",
    },
    {
      label: "Modern Condo DTLA",
      text:
        "1 bed, 1 bath modern condo, 780 sqft with skyline views, floor-to-ceiling windows, pool, gym, 24/7 security, near transit.",
    },
    {
      label: "Luxury Estate",
      text:
        "5 bed, 6 bath estate on 2 acres, 6,200 sqft, chef's kitchen, wine cellar, home theater, infinity pool, smart home, gated entry.",
    },
  ];

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Store the original input before clearing it
    const originalInput = input;

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setError(null);

    try {
      setLoading(true);
      
      // Build conversation context with full history
      const conversationContext = [
        // Include the original request and any previous Q&A
        ...(allQuestionsAndAnswers.length > 0 ? [
          { role: "user", content: `Original request: ${originalInput}` },
          { role: "user", content: `Previous answers: ${allQuestionsAndAnswers.map((q, i) => `Q: ${q}\nA: ${questionAnswers[i] || 'N/A'}`).join('\n\n')}` }
        ] : []),
        // Include the previous listing if it exists
        ...(messages.length > 0 ? [
          { role: "assistant", content: `Previous listing: ${messages[messages.length - 1].content || messages[messages.length - 1].pretty || ''}` }
        ] : []),
        // Current message
        { role: "user", content: trimmed },
        // System instruction for edit requests
        { role: "system", content: `If the user is asking to modify or add details to a previous listing, use the existing information and make the requested changes. Do not ask for information that was already provided. If they want to add "1 bedroom", include that in the listing without asking for it again.` }
      ];

      console.log("Sending this context to AI:", conversationContext); // Debug log

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationContext,
          tone: tone
        }),
      });

      if (!resp.ok) throw new Error(`Chat API error: ${resp.status}`);

      console.log("Response has getReader:", !!resp.body?.getReader); // Debug log
      console.log("Response headers:", Object.fromEntries(resp.headers.entries())); // Debug log

      if (resp.body && resp.body.getReader) {
        // Stream reader
        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let acc = "";
        console.log("Using streaming response"); // Debug log
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
        }

        // Try to parse as JSON for structured responses
        let displayContent = acc;
        console.log("Streaming response content:", acc); // Debug log
        try {
          const parsed = JSON.parse(acc);
          console.log("Parsed streaming response:", parsed); // Debug log
          if (parsed.parsed && parsed.parsed.type === "listing") {
            const listing = parsed.parsed;
            displayContent = "";
            
            if (listing.headline) {
              displayContent += `**${listing.headline}**\n\n`;
            }
            
            if (listing.mls && listing.mls.body) {
              displayContent += `${listing.mls.body}\n\n`;
            }
            
            if (listing.mls && listing.mls.bullets && listing.mls.bullets.length > 0) {
              displayContent += listing.mls.bullets.join('\n') + '\n\n';
            }
            
            if (listing.variants && listing.variants.length > 0) {
              listing.variants.forEach(variant => {
                displayContent += `**${variant.label}:** ${variant.text}\n\n`;
              });
            }
            
            displayContent = displayContent.trim();
          } else if (parsed.parsed && parsed.parsed.type === "questions") {
            // Handle questions in streaming response
            console.log("Questions detected in streaming response"); // Debug log
            displayContent = "I need a bit more information to create your listing. Please answer the questions below.";
            
            // Open questions modal immediately when questions are detected
            openQuestionsModal(parsed.parsed);
          }
        } catch (e) {
          // If parsing fails, use the raw content
          displayContent = coerceToReadableText(acc);
        }

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: displayContent, pretty: displayContent };
          return copy;
        });
      } else {
        // Non-streaming fallback
        const data = await resp.json();
        console.log("Chat API response:", data); // Debug log
        
        if (data.parsed && data.parsed.type === "listing") {
          // Display the parsed listing content
          const listing = data.parsed;
          let displayContent = "";

          if (listing.headline) {
            displayContent += `**${listing.headline}**\n\n`;
          }

          if (listing.mls && listing.mls.body) {
            displayContent += `${listing.mls.body}\n\n`;
          }

          if (listing.mls && listing.mls.bullets && listing.mls.bullets.length > 0) {
            displayContent += listing.mls.bullets.join('\n') + '\n\n';
          }

          if (listing.variants && listing.variants.length > 0) {
            listing.variants.forEach(variant => {
              displayContent += `**${variant.label}:** ${variant.text}\n\n`;
            });
          }

          const text = displayContent.trim();
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
            return copy;
          });
        } else if (data.parsed && data.parsed.type === "questions") {
          // Open questions modal for follow-up questions
          console.log("Questions detected in parsed field"); // Debug log
          openQuestionsModal(data.parsed);
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { 
              role: "assistant", 
              content: "I need a bit more information to create your listing. Please answer the questions below.", 
              pretty: "I need a bit more information to create your listing. Please answer the questions below." 
            };
            return copy;
          });
        } else if (data.message?.content && data.message.content.includes('"type":"questions"')) {
          // Fallback: check if questions are in the raw message content
          console.log("Questions detected in raw message content"); // Debug log
          try {
            const rawContent = data.message.content;
            const parsedContent = JSON.parse(rawContent);
            if (parsedContent.type === "questions") {
              openQuestionsModal(parsedContent);
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { 
                  role: "assistant", 
                  content: "I need a bit more information to create your listing. Please answer the questions below.", 
                  pretty: "I need a bit more information to create your listing. Please answer the questions below." 
                };
                return copy;
              });
            } else {
              // Fallback to raw content if parsing fails
              const text = coerceToReadableText(data.message?.content || data.content || data);
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
                return copy;
              });
            }
          } catch (e) {
            console.error("Failed to parse message content:", e);
            // Fallback to raw content if parsing fails
            const text = coerceToReadableText(data.message?.content || data.content || data);
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
              return copy;
            });
          }
        } else {
          // Fallback to raw content if parsing fails
          const text = coerceToReadableText(data.message?.content || data.content || data);
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
            return copy;
          });
        }
      }
    } catch (e) {
      setError(e?.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  }

  function openFlyerModal() {
    if (!isPro) { router.push("/upgrade"); return; }
    setFlyerOpen(true);
  }

  function openQuestionsModal(questionsData) {
    setQuestions(questionsData.questions || []);
    setQuestionAnswers({});
    setCurrentQuestionIndex(0);
    setQuestionsOpen(true);
    
    // Add new questions to the history
    setAllQuestionsAndAnswers(prev => [...prev, ...questionsData.questions]);
  }

  function handleCopyListing(listingText) {
    navigator.clipboard.writeText(listingText).then(() => {
      // Show a brief success message
      const copyBtn = document.querySelector('.copy-btn');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = listingText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }

  async function submitQuestionAnswers() {
    // Format answers into a natural language response with better context
    const answerText = questions.map((question, index) => {
      const answer = questionAnswers[index] || '';
      // Add context about uncertain answers
      let formattedAnswer = answer;
      if (answer.toLowerCase().includes('na') || 
          answer.toLowerCase().includes('not sure') || 
          answer.toLowerCase().includes('unknown') || 
          answer.toLowerCase().includes('unsure') ||
          answer.toLowerCase().includes("don't know")) {
        formattedAnswer = `${answer} (information not available)`;
      }
      return `Q: ${question}\nA: ${formattedAnswer}`;
    }).join('\n\n');

    // Add the answers to the chat
    setMessages(prev => [
      ...prev,
      { role: "user", content: answerText },
      { role: "assistant", content: "", pretty: "" }
    ]);

    // Close modal
    setQuestionsOpen(false);

    // Send the answers to get the final listing
    try {
      setLoading(true);
      
      // Build complete conversation context with ALL previous Q&A
      const conversationContext = [
        { role: "user", content: `Original request: ${input}` },
        { role: "user", content: `Complete Q&A history: ${answerText}` },
        { role: "system", content: `CRITICAL INSTRUCTIONS: The user has already provided ALL of this information: ${answerText}. You have EVERYTHING you need to create a listing. DO NOT ask for any of this information again. Generate a listing NOW using the provided details. If any information is missing, make reasonable assumptions.` }
      ];

      console.log("Sending this context to AI:", conversationContext); // Debug log

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationContext,
          tone: tone
        }),
      });

      if (!resp.ok) throw new Error(`Chat API error: ${resp.status}`);

      const data = await resp.json();
      console.log("Follow-up response:", data); // Debug log

      if (data.parsed && data.parsed.type === "questions") {
        // More questions needed - open modal again
        console.log("More questions detected after answers"); // Debug log
        
        // If we've already answered questions, force the AI to generate a listing instead
        if (allQuestionsAndAnswers.length > 0) {
          console.log("Forcing listing generation instead of more questions"); // Debug log
          // Force the AI to generate a listing with what we have
          const forceListingContext = [
            { role: "user", content: `Original request: ${input}` },
            { role: "user", content: `All provided information: ${answerText}` },
            { role: "system", content: `STOP ASKING QUESTIONS. The user has provided sufficient information. Generate a listing NOW using the details provided. Make reasonable assumptions for any missing information.` }
          ];
          
          const forceResp = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: forceListingContext,
              tone: tone
            }),
          });
          
          if (forceResp.ok) {
            const forceData = await forceResp.json();
            if (forceData.parsed && forceData.parsed.type === "listing") {
              // Display the listing
              const listing = forceData.parsed;
              let displayContent = "";
              
              if (listing.headline) {
                displayContent += `**${listing.headline}**\n\n`;
              }
              
              if (listing.mls && listing.mls.body) {
                displayContent += `${listing.mls.body}\n\n`;
              }
              
              if (listing.mls && listing.mls.bullets && listing.mls.bullets.length > 0) {
                displayContent += listing.mls.bullets.join('\n') + '\n\n';
              }
              
              if (listing.variants && listing.variants.length > 0) {
                listing.variants.forEach(variant => {
                  displayContent += `**${variant.label}:** ${variant.text}\n\n`;
                });
              }
              
              const text = displayContent.trim();
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
                return copy;
              });
              return; // Exit early
            }
          }
        }
        
        // If we get here, open the questions modal
        openQuestionsModal(data.parsed);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { 
            role: "assistant", 
            content: "I need a bit more information to create your listing. Please answer the questions below.", 
            pretty: "I need a bit more information to create your listing. Please answer the questions below." 
          };
          return copy;
        });
      } else if (data.parsed && data.parsed.type === "listing") {
        // Display the parsed listing content
        const listing = data.parsed;
        let displayContent = "";

        if (listing.headline) {
          displayContent += `**${listing.headline}**\n\n`;
        }

        if (listing.mls && listing.mls.body) {
          displayContent += `${listing.mls.body}\n\n`;
        }

        if (listing.mls && listing.mls.bullets && listing.mls.bullets.length > 0) {
          displayContent += listing.mls.bullets.join('\n') + '\n\n';
        }

        if (listing.variants && listing.variants.length > 0) {
          listing.variants.forEach(variant => {
            displayContent += `**${variant.label}:** ${variant.text}\n\n`;
          });
        }

        const text = displayContent.trim();
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
          return copy;
        });
      } else {
        // Fallback to raw content if parsing fails
        const text = coerceToReadableText(data.message?.content || data.content || data);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
          return copy;
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  }

  async function generateFlyers() {
    if (!isPro) { router.push("/upgrade"); return; }
    
    // Find the most recent listing (assistant message with formatted content)
    const lastAssistant = [...messages].reverse().find((m) => 
      m.role === "assistant" && m.pretty && m.pretty.includes('**')
    );
    
    if (!lastAssistant) {
      setError("No listing found to generate flyers from. Please generate a listing first.");
      return;
    }
    
    const content = lastAssistant.pretty || lastAssistant.content || "";
    if (!content.trim()) {
      setError("Listing content is empty. Please generate a listing first.");
      return;
    }

    const payload = {
      flyers: Object.entries(flyerTypes)
        .filter(([_, v]) => v)
        .map(([k]) => k),
      content: { single: content },
    };

    try {
      setFlyerBusy(true);
      setError(null); // Clear any previous errors
      
      console.log("Generating flyers with payload:", payload); // Debug log
      
      const res = await fetch("/api/flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Flyer API error: ${res.status}`);
      }

      if (res.headers.get("content-type")?.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; 
        a.download = "flyer.pdf"; 
        document.body.appendChild(a); 
        a.click();
        URL.revokeObjectURL(url); 
        a.remove();
      } else {
        // JSON with urls (alternate server behavior)
        const data = await res.json();
        const urls = data?.urls || (data?.url ? [data.url] : []);
        for (const u of urls) {
          const a = document.createElement("a");
          a.href = u; 
          a.download = ""; 
          document.body.appendChild(a); 
          a.click(); 
          a.remove();
        }
      }
    } catch (e) {
      console.error("Flyer generation error:", e);
      setError(e?.message || "Could not generate flyers");
    } finally {
      setFlyerBusy(false);
    }
  }

  return (
    <div className="chat-page">
      <header className="main-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="logo">🏠</div>
            <div className="title">ListGenie.ai</div>
            <div className="plan-badge">
              {isPro ? "Pro" : isTrial ? "Trial" : "Expired"}
            </div>
          </div>
          <div className="tagline">Generate listings, captions, and flyers</div>
        </div>
      </header>

      <main className="chat-container">
        <section className="controls">
          <div className="row1">
            <button className="flyer-btn" onClick={openFlyerModal}>
              {isPro ? "Create Flyers" : "Flyers (Pro)"}
            </button>
            <div className="tone-separator"></div>
            <TonePill value="mls" label="MLS-ready" current={tone} onChange={setTone} />
            <TonePill value="social" label="Social caption" current={tone} onChange={setTone} />
            <TonePill value="luxury" label="Luxury tone" current={tone} onChange={setTone} />
            <TonePill value="concise" label="Concise" current={tone} onChange={setTone} />
          </div>
          <div className="examples">
            {examples.map((ex, i) => (
              <button key={i} className="example" onClick={() => setInput(ex.text)}>
                {ex.label}
              </button>
            ))}
          </div>
        </section>

        {/* Only show chat area if there are messages */}
        {messages.length > 0 && (
          <section className="chat-area">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.role === "user" ? (
                    <span className="user-message">{message.content}</span>
                  ) : (
                    <div className="assistant-message">
                      {message.pretty || message.content || "Generating..."}
                      
                      {/* Show action buttons after listings */}
                      {message.pretty && message.pretty.includes('**') && (
                        <div className="listing-actions">
                          <button 
                            className="copy-btn"
                            onClick={() => handleCopyListing(message.pretty)}
                            title="Copy listing to clipboard"
                          >
                            📋 Copy Listing
                          </button>
                          <button 
                            className="flyer-btn-small"
                            onClick={openFlyerModal}
                            title="Generate flyers from this listing"
                          >
                            🎨 Create Flyers
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="loading">
                <div className="loading-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="loading-text">Generating your listing...</div>
              </div>
            )}
            {error && <div className="error">{error}</div>}
          </section>
        )}

        <section className="composer">
          <textarea
            rows={3}
            placeholder="Paste a property description or type details…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="send" disabled={loading || !input.trim()} onClick={handleSend}>
            {loading ? "Generating…" : "Send"}
          </button>
        </section>
      </main>

      {flyerOpen && (
        <div className="flyer-modal">
          <div className="flyer-modal-content">
            <div className="flyer-modal-header">
              <h2 className="flyer-modal-title">Generate Flyers</h2>
              <button className="flyer-modal-close" onClick={() => setFlyerOpen(false)}>✕</button>
            </div>
            <p className="flyer-modal-description">
              Choose flyer types to generate from the latest assistant output.
            </p>
            <div className="flyer-options">
              <label className="flyer-option">
                <input
                  type="checkbox"
                  checked={flyerTypes.standard}
                  onChange={(e) => setFlyerTypes((s) => ({ ...s, standard: e.target.checked }))}
                />{" "}
                Standard Flyer
              </label>
              <label className="flyer-option">
                <input
                  type="checkbox"
                  checked={flyerTypes.openHouse}
                  onChange={(e) => setFlyerTypes((s) => ({ ...s, openHouse: e.target.checked }))}
                />{" "}
                Open House Flyer
              </label>
            </div>
            <div className="flyer-modal-actions">
              <button className="flyer-modal-btn cancel" onClick={() => setFlyerOpen(false)}>Cancel</button>
              <button
                className="flyer-modal-btn generate"
                onClick={generateFlyers}
                disabled={flyerBusy || (!flyerTypes.standard && !flyerTypes.openHouse)}
              >
                {flyerBusy ? "Generating…" : "Generate PDFs"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {questionsOpen && (
        <div className="questions-modal">
          <div className="questions-modal-content">
            <div className="questions-modal-header">
              <h2 className="questions-modal-title">Additional Information Needed</h2>
              <button className="questions-modal-close" onClick={() => setQuestionsOpen(false)}>✕</button>
            </div>
            <p className="questions-modal-description">
              To create the best listing, I need a bit more information about the property.
            </p>
            
            <div className="question-progress">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            
            <div className="current-question">
              <h3>{questions[currentQuestionIndex]}</h3>
              <textarea
                className="question-answer-input"
                placeholder="Type your answer here..."
                value={questionAnswers[currentQuestionIndex] || ""}
                onChange={(e) => setQuestionAnswers(prev => ({
                  ...prev,
                  [currentQuestionIndex]: e.target.value
                }))}
                rows={3}
              />
            </div>
            
            <div className="questions-modal-actions">
              <button 
                className="questions-modal-btn cancel" 
                onClick={() => setQuestionsOpen(false)}
              >
                Cancel
              </button>
              {currentQuestionIndex > 0 && (
                <button 
                  className="questions-modal-btn secondary" 
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                >
                  Previous
                </button>
              )}
              {currentQuestionIndex < questions.length - 1 ? (
                <button 
                  className="questions-modal-btn primary" 
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={!questionAnswers[currentQuestionIndex]}
                >
                  Next
                </button>
              ) : (
                <button 
                  className="questions-modal-btn submit" 
                  onClick={submitQuestionAnswers}
                  disabled={!questionAnswers[currentQuestionIndex]}
                >
                  Submit All Answers
                </button>
              )}
            </div>
          </div>
        </div>
      )}

<style jsx>{`
  :root {
    --bg: #0a0d14;
    --bg-soft: #0f1320;
    --card: #0d111a;
    --stroke: #2a3242;
    --text: #e6e9ef;
    --text-dim: #9aa4b2;
    --indigo: #6366f1;
    --indigo-ghost: rgba(99,102,241,0.14);
    --emerald-ghost: rgba(16,185,129,0.14);
    --rose: #f43f5e;
  }

  /* Page background & typography */
  .chat-page {
    min-height: 100vh;
    background:
      radial-gradient(1200px 800px at 20% -10%, rgba(42,60,106,.45), transparent 60%),
      radial-gradient(900px 700px at 100% 0%, rgba(23,38,97,.30), transparent 50%),
      var(--bg);
    color: var(--text);
  }

  /* Top bar */
  .main-header {
    background: linear-gradient(135deg, rgba(14,18,28,0.95), rgba(10,13,20,0.95));
    border: 1px solid rgba(80,90,120,0.3);
    border-radius: 16px;
    margin: 24px auto;
    max-width: 800px;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  .header-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }

  .brand-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .main-header .logo {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }
  
  .main-header .title {
    font-weight: 700;
    font-size: 18px;
    color: #e6e9ef;
  }
  
  /* Premium tagline */
  .main-header .tagline {
    font-size: 14px;
    color: #9aa4b2;
    text-align: center;
    padding: 8px 16px;
    background: rgba(20, 24, 36, 0.6);
    border: 1px solid rgba(80, 90, 120, 0.3);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    margin: 8px auto;
    width: fit-content;
    max-width: 400px;
    display: block;
  }

  /* Main layout */
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Controls card */
  .controls {
    border: 1px solid var(--stroke);
    background: rgba(14,18,28,0.65);
    border-radius: 14px;
    padding: 16px;
  }
  .row1 { 
    display: flex; 
    gap: 8px; 
    align-items: center; 
    flex-wrap: wrap; 
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .flyer-btn {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.15));
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
  
  .flyer-btn:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.25));
    border-color: rgba(99, 102, 241, 0.5);
    color: #c7d2fe;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  }
  
  .flyer-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
  
  .tone-separator {
    width: 1px;
    height: 24px;
    background: linear-gradient(180deg, transparent, rgba(80, 90, 120, 0.4), transparent);
    margin: 0 16px;
  }

  /* Examples section */
  .examples { 
    display: flex; 
    flex-wrap: wrap; 
    gap: 8px; 
  }
  .examples::before {
    content: "Examples:";
    display: block;
    width: 100%;
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 8px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  .example { 
    border: 1px solid rgba(255,255,255,0.15); 
    color: var(--text); 
    background: rgba(20,24,36,0.6); 
    padding: 8px 12px; 
    border-radius: 8px; 
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .example:hover {
    background: rgba(30,34,46,0.8);
    border-color: rgba(255,255,255,0.25);
    transform: translateY(-1px);
  }

  /* Messages panel */
  .messages {
    border: 1px solid var(--stroke);
    background: rgba(12,16,24,0.72);
    border-radius: 14px;
    padding: 10px;
    min-height: 42vh;
    max-height: 58vh;   /* keeps composer visible */
    overflow: auto;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02), inset 0 -1px 0 rgba(0,0,0,0.25);
  }
  .empty { text-align: center; color: var(--text-dim); font-size: 14px; padding: 28px 0; }

  /* Message rows */
  .row { display: grid; grid-template-columns: 72px 1fr; gap: 10px; margin-bottom: 10px; }
  .row.you .author { color: #b6c1d1; }
  .row.ai  .author { color: #86a2ff; }
  .author { font-size: 12px; letter-spacing: .02em; padding-top: 10px; }

  .bubble {
    border: 1px solid var(--stroke);
    background: rgba(11,14,22,0.85);
    border-radius: 14px;
    padding: 10px;
  }

  /* Assistant extras */
  .assistant-block {
    display: grid;
    gap: 12px;
  }
  
  .listing-content {
    line-height: 1.6;
    color: #e6e9ef;
  }
  
  .listing-content strong {
    color: #fbbf24;
    font-weight: 600;
  }
  
  .listing-content h3 {
    color: #fbbf24;
    font-size: 18px;
    font-weight: 700;
    margin: 16px 0 8px 0;
  }
  
  .listing-content ul {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  .listing-content li {
    margin: 4px 0;
  }
  .copy-all { position: absolute; top: -6px; right: -6px; }
  .copy-btn {
    border: 1px solid var(--stroke);
    background: rgba(30,36,52,0.9);
    color: var(--text);
    font-size: 12px; padding: 4px 8px; border-radius: 8px;
    transition: transform .06s ease, background .15s ease, border-color .15s ease;
  }
  .copy-btn:hover { transform: translateY(-1px); background: rgba(36,42,60,0.95); border-color: rgba(99,102,241,0.5); }
  .copy-btn.sm { font-size: 11px; padding: 3px 6px; }

  /* Variants */
  .variants { display: grid; gap: 8px; }
  .variant {
    border: 1px solid var(--stroke);
    background: rgba(16,19,28,0.75);
    border-radius: 12px;
  }
  .variant .variant-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 0 10px; }
  .variant .variant-body { padding: 8px 10px 10px; }
  .variant-chip {
    font-size: 10px; text-transform: uppercase; letter-spacing: .08em;
    color: var(--text-dim); border: 1px solid var(--stroke); padding: 2px 8px; border-radius: 999px;
  }
  .variant.mls .variant-chip    { color: #bcd3ff; border-color: rgba(99,102,241,0.5); }
  .variant.social .variant-chip { color: #f8d68e; border-color: rgba(234,179,8,0.45); }
  .variant.luxury .variant-chip { color: #f0c6ff; border-color: rgba(168,85,247,0.5); }
  .variant.concise .variant-chip{ color: #b0f3d2; border-color: rgba(16,185,129,0.45); }

  /* Composer (sticky bottom) */
  .composer {
    position: sticky; bottom: 0;
    background: linear-gradient(to top, rgba(5,7,11,0.85), rgba(5,7,11,0.0));
    backdrop-filter: blur(6px) saturate(120%);
    display: grid; grid-template-columns: 1fr 120px; gap: 8px;
    padding-top: 6px;
  }
  .composer textarea {
    background: rgba(12,16,26,0.88);
    border: 1px solid rgba(86,96,120,0.55);
    color: var(--text);
    border-radius: 12px;
    padding: 12px;
    min-height: 74px;
    resize: vertical;
    box-shadow: 0 4px 28px rgba(0,0,0,0.28);
  }
  .composer textarea::placeholder { color: rgba(200,208,220,0.45); }
  .composer .send {
    border: 1px solid rgba(99,102,241,0.55);
    background: var(--indigo-ghost);
    color: #e6e9ff;
    border-radius: 12px;
    font-weight: 600;
    box-shadow: 0 4px 24px rgba(62,74,140,0.25);
  }

  /* Errors & thinking dots */
  .error { text-align: center; color: #ff9db0; font-size: 13px; margin: 6px 0; }
  .thinking { display: inline-grid; grid-auto-flow: column; gap: 6px; align-items: center; margin: 10px; }
  .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--text-dim); animation: bounce 1.2s infinite ease-in-out; }
  .dot:nth-child(1) { animation-delay: 0s; }
  .dot:nth-child(2) { animation-delay: 0.12s; }
  .dot:nth-child(3) { animation-delay: 0.24s; }
  .thinking-label { font-size: 12px; color: var(--text-dim); }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .5; } 40% { transform: translateY(-4px); opacity: 1; } }

  /* Tone pills styling */
  .tone-pill {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.15));
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
  
  .tone-pill:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.25));
    border-color: rgba(99, 102, 241, 0.5);
    color: #c7d2fe;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  }
  
  .tone-pill.active {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(79, 70, 229, 0.3));
    border-color: rgba(99, 102, 241, 0.6);
    color: #d9dbff;
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
    transform: translateY(-1px);
  }
  
  .tone-pill span {
    position: relative;
    z-index: 1;
  }

  /* Clerk Modal Styling Fixes */
  :global(.cl-modal) {
    background: rgba(10, 13, 20, 0.95) !important;
    backdrop-filter: blur(20px) !important;
  }
  
  :global(.cl-modal .cl-card) {
    background: linear-gradient(135deg, rgba(14, 18, 28, 0.95), rgba(10, 13, 20, 0.95)) !important;
    border: 1px solid rgba(80, 90, 120, 0.3) !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
  }
  
  :global(.cl-modal .cl-cardHeader) {
    background: transparent !important;
  }
  
  :global(.cl-modal .cl-cardHeaderTitle) {
    color: #e6e9ef !important;
  }
  
  :global(.cl-modal .cl-cardHeaderSubtitle) {
    color: #9aa4b2 !important;
  }
  
  :global(.cl-modal .cl-formField) {
    background: rgba(20, 24, 36, 0.8) !important;
    border: 1px solid rgba(80, 90, 120, 0.4) !important;
    border-radius: 12px !important;
  }
  
  :global(.cl-modal .cl-formFieldInput) {
    background: transparent !important;
    color: #e6e9ef !important;
    border: none !important;
    outline: none !important;
  }
  
  :global(.cl-modal .cl-formFieldInput::placeholder) {
    color: #9aa4b2 !important;
  }
  
  :global(.cl-modal .cl-formFieldInput:focus) {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3) !important;
  }
  
  :global(.cl-modal .cl-formFieldInput:focus-within) {
    border-color: rgba(99, 102, 241, 0.6) !important;
  }
  
  :global(.cl-modal .cl-formFieldError) {
    color: #f87171 !important;
    background: rgba(239, 68, 68, 0.1) !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    margin-top: 8px !important;
  }
  
  :global(.cl-modal .cl-formFieldSuccess) {
    color: #34d399 !important;
    background: rgba(52, 211, 153, 0.1) !important;
    border: 1px solid rgba(52, 211, 153, 0.3) !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    margin-top: 8px !important;
  }
  
  /* Clerk backdrop and animations */
  :global(.cl-modalBackdrop) {
    background: rgba(0, 0, 0, 0.7) !important;
    backdrop-filter: blur(8px) !important;
  }
  
  :global(.cl-modalContent) {
    animation: modalSlideIn 0.3s ease-out !important;
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .plan-badge {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }
  
  /* Clerk Modal Dark Theme Overrides */
  .flyer-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .flyer-modal-content {
    background: linear-gradient(135deg, rgba(14, 18, 28, 0.95), rgba(10, 13, 20, 0.95));
    border: 1px solid rgba(80, 90, 120, 0.4);
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    position: relative;
  }
  
  .flyer-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  .flyer-modal-title {
    font-size: 20px;
    font-weight: 700;
    color: #e6e9ef;
    margin: 0;
  }
  
  .flyer-modal-close {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #9aa4b2;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 16px;
  }
  
  .flyer-modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #e6e9ef;
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .flyer-modal-description {
    color: #9aa4b2;
    margin-bottom: 24px;
    line-height: 1.5;
  }
  
  .flyer-options {
    margin-bottom: 24px;
  }
  
  .flyer-option {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .flyer-option:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .flyer-option input[type="checkbox"] {
    margin-right: 12px;
    width: 18px;
    height: 18px;
    accent-color: #6366f1;
  }
  
  .flyer-option label {
    color: #e6e9ef;
    font-weight: 500;
    cursor: pointer;
    flex: 1;
  }
  
  .flyer-modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .flyer-modal-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 14px;
  }
  
  .flyer-modal-btn.cancel {
    background: rgba(255, 255, 255, 0.1);
    color: #9aa4b2;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .flyer-modal-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #e6e9ef;
  }
  
  .flyer-modal-btn.generate {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
  
  .flyer-modal-btn.generate:hover {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  }

  .error {
    color: #f56565;
    text-align: center;
    padding: 20px;
    background: rgba(245, 101, 101, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(245, 101, 101, 0.3);
  }

  /* Questions Modal Styling */
  .questions-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .questions-modal-content {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }

  .questions-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .questions-modal-title {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .questions-modal-close {
    background: none;
    border: none;
    color: #a0aec0;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .questions-modal-close:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .questions-modal-description {
    color: #a0aec0;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .question-progress {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 8px;
    color: #a0aec0;
    font-size: 14px;
    margin-bottom: 20px;
    text-align: center;
  }

  .current-question h3 {
    color: white;
    margin-bottom: 12px;
    font-size: 16px;
    line-height: 1.4;
  }

  .question-answer-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 12px;
    color: white;
    font-size: 14px;
    resize: vertical;
    transition: all 0.2s ease;
  }

  .question-answer-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .question-answer-input::placeholder {
    color: #a0aec0;
  }

  .questions-modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    justify-content: flex-end;
  }

  .questions-modal-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .questions-modal-btn.cancel {
    background: rgba(255, 255, 255, 0.1);
    color: #a0aec0;
  }

  .questions-modal-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .questions-modal-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .questions-modal-btn.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .questions-modal-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .questions-modal-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .questions-modal-btn.submit {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .questions-modal-btn.submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .questions-modal-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Chat Container */
  .chat-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .chat-area {
    margin-bottom: 20px;
    min-height: 200px;
  }

  .message {
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 80%;
  }

  .message.user {
    margin-left: auto;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .message.assistant {
    margin-right: auto;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .message-content {
    line-height: 1.5;
  }

  .user-message {
    font-weight: 500;
  }

  .assistant-message {
    white-space: pre-wrap;
  }

  .loading {
    text-align: center;
    color: #a0aec0;
    font-style: italic;
    padding: 20px;
  }

  .loading-dots {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    justify-content: center;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #667eea;
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite both;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .loading-text {
    font-size: 14px;
    color: #a0aec0;
    text-align: center;
    font-style: italic;
  }

  .listing-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .copy-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .copy-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .flyer-btn-small {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .flyer-btn-small:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
  }

  /* Questions Modal Styling */
  .questions-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .questions-modal-content {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }

  .questions-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .questions-modal-title {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .questions-modal-close {
    background: none;
    border: none;
    color: #a0aec0;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .questions-modal-close:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .questions-modal-description {
    color: #a0aec0;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .question-progress {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 8px;
    color: #a0aec0;
    font-size: 14px;
    margin-bottom: 20px;
    text-align: center;
  }

  .current-question h3 {
    color: white;
    margin-bottom: 12px;
    font-size: 16px;
    line-height: 1.4;
  }

  .question-answer-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 12px;
    color: white;
    font-size: 14px;
    resize: vertical;
    transition: all 0.2s ease;
  }

  .question-answer-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .question-answer-input::placeholder {
    color: #a0aec0;
  }

  .questions-modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    justify-content: flex-end;
  }

  .questions-modal-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .questions-modal-btn.cancel {
    background: rgba(255, 255, 255, 0.1);
    color: #a0aec0;
  }

  .questions-modal-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .questions-modal-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .questions-modal-btn.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .questions-modal-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .questions-modal-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .questions-modal-btn.submit {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .questions-modal-btn.submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .questions-modal-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`}</style>
    </div>
  );
}

/** ---------------- Small bits ---------------- */
function TonePill({ value, label, current, onChange }) {
  const active = current === value;
  return (
    <button
      className={`tone-pill ${active ? 'active' : ''}`}
      onClick={() => onChange(value)}
    >
      <span>{label}</span>
    </button>
  );
}

function displayName(key) {
  return key === "mls" ? "MLS-Ready" : key === "social" ? "Social Caption" : key === "luxury" ? "Luxury Tone" : key === "concise" ? "Concise" : key;
}

function ThinkingDots() {
  return (
    <div className="thinking">
      <div className="dot" /><div className="dot" /><div className="dot" />
      <span className="thinking-label">Thinking…</span>
    </div>
  );
}