// pages/chat.js — ListGenie.ai (enhanced)
// - Restored dark UI
// - Streaming chat with readable output cleanup
// - Variant detection & styled cards (MLS / Social / Luxury / Concise)
// - Copy-to-clipboard buttons for each variant and full response (with "Copied!" state)
// - Pro-gated flyer modal (Standard + Open House)
// - Downloads PDF via /api/flyer

import { useRef, useState } from "react";
import { useRouter } from "next/router";
import useUserPlan from "@/hooks/useUserPlan";
import ChatHeader from "@/components/chat/Header";
import ExamplesRow from "@/components/chat/ExamplesRow";
import Composer from "@/components/chat/Composer";
import MessageThread from "@/components/chat/MessageThread";
import FlyerModal from "@/components/chat/FlyerModal";

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

  // Chat state
  const [messages, setMessages] = useState([
    // { role: 'user'|'assistant', content: string, pretty?: string }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Flyer modal state
  const [flyerOpen, setFlyerOpen] = useState(false);

  // Questions modal
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Track all Q&A history for better AI memory
  const [allQuestionsAndAnswers, setAllQuestionsAndAnswers] = useState([]);
    const [isListingMode, setIsListingMode] = useState(false);

  const composerRef = useRef(null);
  const [originalInput, setOriginalInput] = useState("");

    async function handleSend(text) {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const baseInput = messages.length === 0 ? trimmed : originalInput;
      if (messages.length === 0) setOriginalInput(trimmed);

      // Add user message to chat
      setMessages(prev => [...prev, { role: "user", content: trimmed }]);
      setError(null);

      // Scroll to bottom after adding user message
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);

      try {
        setLoading(true);

        // Build conversation context with full history
        const conversationContext = [
          // Include the original request and any previous Q&A
          ...(allQuestionsAndAnswers.length > 0 ? [
            { role: "user", content: `Original request: ${baseInput}` },
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
        
        // Scroll to bottom to show the AI response
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
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
          
          // Scroll to bottom to show the AI response
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 100);
          
          // Set listing mode if this is a listing response
          setIsListingMode(true);
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

  function handleNewListing() {
    setIsListingMode(false);
    setMessages([]);
    if (composerRef.current) composerRef.current.clearInput();
  }

  function openQuestionsModal(questionsData) {
    setQuestions(questionsData.questions || []);
    setQuestionAnswers({});
    setCurrentQuestionIndex(0);
    setQuestionsOpen(true);
    
    // Add new questions to the history
    setAllQuestionsAndAnswers(prev => [...prev, ...questionsData.questions]);
    
    // Scroll to bottom to show the questions modal
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
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

  async function handleModifyListing(listingText, modificationType) {
    const modificationPrompts = {
      longer: "Please make this listing longer and more detailed, adding more descriptive language and specific details about the property features.",
      modern: "Please rewrite this listing to have a more modern, contemporary tone and style.",
      country: "Please rewrite this listing to have a more country/rural, warm, and welcoming tone.",
      luxurious: "Please rewrite this listing to have a more luxurious, upscale, and premium tone."
    };

    const prompt = modificationPrompts[modificationType];
    if (!prompt) return;

    // Add the modification request to the chat
    setMessages(prev => [
      ...prev,
      { role: "user", content: `Modify this listing: ${prompt}` },
      { role: "assistant", content: "", pretty: "" }
    ]);

    // Scroll to bottom to show the modification request
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);

    try {
      setLoading(true);
      
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `Here is a property listing: ${listingText}` },
            { role: "user", content: prompt }
          ],
          tone: "mls" // Use MLS tone for modifications
        }),
      });

      if (!resp.ok) throw new Error(`Chat API error: ${resp.status}`);

      if (resp.body && resp.body.getReader) {
        // Handle streaming response
        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let acc = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
        }

        // Try to parse as JSON for structured responses
        let displayContent = acc;
        try {
          const parsed = JSON.parse(acc);
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
          } else {
            displayContent = coerceToReadableText(acc);
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
        
        // Scroll to bottom to show the modification response
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
        
        // Set listing mode if this is a listing response
        if (displayContent.includes('**') && displayContent.includes('•')) {
          setIsListingMode(true);
        }
      } else {
        // Handle non-streaming response
        const data = await resp.json();
        let displayContent = "";
        
        try {
          if (data.parsed && data.parsed.type === "listing") {
            const listing = data.parsed;
            
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
          } else {
            displayContent = coerceToReadableText(data.content || data.message || "");
          }
        } catch (e) {
          displayContent = coerceToReadableText(data.content || data.message || "");
        }
        
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: displayContent, pretty: displayContent };
          return copy;
        });
        
        // Scroll to bottom to show the modification response
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
        
        // Set listing mode if this is a listing response
        if (displayContent.includes('**') && displayContent.includes('•')) {
          setIsListingMode(true);
        }
      }
    } catch (error) {
      console.error("Error modifying listing:", error);
      setError("Failed to modify listing. Please try again.");
    } finally {
      setLoading(false);
    }
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

    // Scroll to bottom to show the submitted answers
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);

    // Close modal
    setQuestionsOpen(false);

    // Send the answers to get the final listing
    try {
      setLoading(true);
      
      // Build complete conversation context with ALL previous Q&A
      const conversationContext = [
        { role: "user", content: `Original request: ${originalInput}` },
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
            { role: "user", content: `Original request: ${originalInput}` },
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

    setPropertyPhotos(prev => prev.filter(photo => photo.id !== photoId));
  }

  return (
    <div className="chat-page">
      <ChatHeader
        isListingMode={isListingMode}
        onNewListing={handleNewListing}
        isPro={isPro}
        isTrial={isTrial}
      />
      <main className="chat-container">
        <div className="chat-wrap">
          {!isListingMode && (
            <ExamplesRow onSelect={(text) => composerRef.current.setInput(text)} />
          )}
          <div className="ai-chat-section">
            <h1 className="ai-chat-title">AI Listing Generator</h1>
            <p className="ai-chat-subtitle">Describe your property and let AI create professional listings</p>
            <Composer ref={composerRef} onSend={handleSend} loading={loading} />
          </div>
          {messages.length > 0 && (
            <MessageThread
              messages={messages}
              loading={loading}
              error={error}
              onCopyListing={handleCopyListing}
              onModifyListing={handleModifyListing}
              onOpenFlyer={openFlyerModal}
            />
          )}
        </div>
      </main>
      <FlyerModal
        open={flyerOpen}
        onClose={() => setFlyerOpen(false)}
        messages={messages}
        isPro={isPro}
      />
      {questionsOpen && (
        <div className="questions-modal-overlay">
          <div className="questions-modal">
            <div className="questions-modal-header">
              <h3>Additional Information Needed</h3>
              <button className="questions-modal-close" onClick={() => setQuestionsOpen(false)}>✕</button>
            </div>
            <div className="questions-modal-body">
              <p>{questions[currentQuestionIndex]}</p>
              <textarea
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
              <button className="questions-modal-btn cancel" onClick={() => setQuestionsOpen(false)}>
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
    </div>
  );
}
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
