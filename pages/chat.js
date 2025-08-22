// pages/chat.js — ListGenie.ai (enhanced)
// - Restored dark UI
// - Streaming chat with readable output cleanup
// - Variant detection & styled cards (MLS / Social / Luxury / Concise)
// - Copy-to-clipboard buttons for each variant and full response (with "Copied!" state)
// - Enhanced Professional Flyer Generator with Template System
// - User photo uploads and agent customization

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import useUserPlan from "@/hooks/useUserPlan";
import ChatHeader from "@/components/chat/Header";
import ExamplesRow from "@/components/chat/ExamplesRow";
import Composer from "@/components/chat/Composer";
import MessageThread from "@/components/chat/MessageThread";
import EnhancedFlyerModal from "@/components/chat/EnhancedFlyerModal";

// Test if EnhancedFlyerModal is imported correctly
console.log("🔧 EnhancedFlyerModal import test:", typeof EnhancedFlyerModal, EnhancedFlyerModal);

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
  const { isSignedIn, isLoaded, user } = useUser();
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
  const [flyerGenerating, setFlyerGenerating] = useState(false);

  // Questions modal
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestionsAndAnswers, setAllQuestionsAndAnswers] = useState([]);
  const [isListingMode, setIsListingMode] = useState(false);

  const composerRef = useRef(null);
  const [originalInput, setOriginalInput] = useState("");

  // Check if we have a listing to display
  const hasListing = messages.some(msg => msg.role === 'assistant' && msg.content);
  const currentListing = messages.find(msg => msg.role === 'assistant')?.content || '';

  // Ensure page stays at top when listing is displayed
  useEffect(() => {
    console.log("useEffect triggered", { hasListing, messages: messages.length });
    if (hasListing) {
      console.log("Scrolling to top");
      // Use multiple methods to ensure scrolling works
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Also prevent any automatic scrolling
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    }
  }, [hasListing]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="chat-page">
        <div className="chat-wrap">
          <div className="loading-state">
            <div className="loading-card">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, show sign-in prompt and BLOCK ALL CHAT ACCESS
  if (!isSignedIn) {
    return (
      <div className="chat-page">
        <div className="chat-wrap">
          <div className="sign-in-prompt">
            <div className="sign-in-card">
              <h3>🔐 Sign In Required</h3>
              <p>Please sign in to use the AI Listing Generator</p>
              <button 
                className="sign-in-btn"
                onClick={() => router.push("/sign-in")}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have a listing, show the listing-focused layout
  if (hasListing) {
    return (
      <div className="chat-page listing-focused">
        <div className="listing-container">
          {/* Header - centered */}
          <div className="listing-header">
            <div className="listing-title-container">
              <svg 
                className="listing-icon" 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 3L2 12H4V21H20V12H22L12 3ZM18 19H6V10.91L12 5.41L18 10.91V19Z" 
                  fill="url(#listingGradient)" 
                />
                <path 
                  d="M9 14H15V16H9V14Z" 
                  fill="url(#listingGradient)" 
                />
                <path 
                  d="M9 17H15V19H9V17Z" 
                  fill="url(#listingGradient)" 
                />
                <defs>
                  <linearGradient id="listingGradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8B5CF6"/>
                    <stop offset="0.5" stopColor="#3B82F6"/>
                    <stop offset="1" stopColor="#06B6D4"/>
                  </linearGradient>
                </defs>
              </svg>
              <h1 className="listing-title">Your Generated Listing</h1>
            </div>
          </div>

          {/* Main listing content */}
          <div className="listing-content">
            <div className="listing-display">
              <pre className="listing-text">{currentListing}</pre>
              <button 
                className="copy-btn"
                onClick={() => handleCopyListing(currentListing)}
              >
                Copy Listing
              </button>
            </div>
          </div>

          {/* Compact chatbox for tweaks */}
          <div className="compact-chat">
            <div className="compact-chat-header">
              <h3>Need to tweak your listing?</h3>
              <p>Describe what you'd like to change or add</p>
            </div>
            <Composer 
              ref={composerRef} 
              onSend={handleSend} 
              loading={loading}
              placeholder="e.g., 'Make it more luxury-focused' or 'Add details about the backyard'"
              compact={true}
            />
            {error && <div className="error-message">{error}</div>}
            
                                {/* Action buttons near chatbox */}
                    <div className="compact-actions">
                      <button 
                        className="compact-action-btn new-listing-btn"
                        onClick={() => {
                          setMessages([]);
                          setOriginalInput("");
                          setIsListingMode(false);
                        }}
                      >
                        NEW LISTING
                      </button>
                      <button 
                        className="compact-action-btn flyer-btn"
                        onClick={() => {
                          if (!isPro) {
                            alert("Please upgrade to Pro to generate flyers");
                            return;
                          }
                          
                          if (!currentListing || !currentListing.trim()) {
                            alert("Please generate a listing first");
                            return;
                          }
                          
                          // Open the enhanced flyer modal
                          console.log('🎨 Opening flyer modal, current state:', { flyerOpen, hasListing, currentListing: currentListing?.substring(0, 50) });
                          setFlyerOpen(true);
                        }}
                        disabled={!isPro || !hasListing}
                        style={{ position: 'relative', zIndex: 10 }}
                      >
                        🎨 Generate Flyer
                      </button>
                      

                    </div>
          </div>
        </div>

        {/* Enhanced Flyer Modal */}
        <EnhancedFlyerModal
          isOpen={flyerOpen}
          onClose={() => setFlyerOpen(false)}
          onGenerate={handleEnhancedFlyerGeneration}
          listing={currentListing}
          loading={flyerGenerating}
        />
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ position: 'fixed', top: 10, right: 10, background: 'red', color: 'white', padding: '10px', zIndex: 999999 }}>
            Modal State: {flyerOpen ? 'OPEN' : 'CLOSED'}
          </div>
        )}

      </div>
    );
  }

    async function handleSend(text) {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      
      // Check authentication first
      if (!isSignedIn) {
        console.log("User not signed in, redirecting to sign-in page");
        setError("Please sign in to use the AI Listing Generator");
        router.push("/sign-in");
        return;
      }
      
      console.log("User authentication status:", { isSignedIn, isPro, isTrial }); // Debug log
      
      // Check if we're modifying an existing listing
      const isModifyingListing = hasListing && messages.length > 0;
      
      const baseInput = messages.length === 0 ? trimmed : originalInput;
      if (messages.length === 0) setOriginalInput(trimmed);

      // Add user message to chat
      setMessages(prev => [...prev, { role: "user", content: trimmed }]);
      setError(null);

      // Don't scroll - let the page stay where it is

      try {
        setLoading(true);

        // Build conversation context with full history
        const conversationContext = [
          // Include the original request and any previous Q&A
          ...(allQuestionsAndAnswers.length > 0 ? [
            { role: "user", content: `Original request: ${baseInput}` },
            { role: "user", content: `Previous answers: ${allQuestionsAndAnswers.map((q, i) => `Q: ${q}\nA: ${questionAnswers[i] || 'N/A'}`).join('\n\n')}` }
          ] : []),
          // If modifying a listing, include the current listing content
          ...(isModifyingListing ? [
            { role: "assistant", content: `Current listing: ${currentListing}` }
          ] : []),
          // Current message
          { role: "user", content: trimmed },
          // System instruction for edit requests
          { role: "system", content: isModifyingListing 
            ? `You are modifying an existing property listing. The user wants to change: "${trimmed}". Please update the listing with these changes while keeping all the existing property details. Return the complete updated listing.`
            : `If the user is asking to modify or add details to a previous listing, use the existing information and make the requested changes. Do not ask for information that was already provided. If they want to add "1 bedroom", include that in the listing without asking for it again.`
          }
        ];

      console.log("Sending this context to AI:", conversationContext); // Debug log

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationContext,
          tone
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        console.log("API error data:", errorData); // Debug log
        const errorMessage = errorData.error || `Chat API error: ${resp.status}`;
        if (resp.status === 401) {
          console.error("Authentication failed. User appears signed in but API rejected request.");
          console.error("User state:", { isSignedIn, isPro, isTrial });
          console.error("This usually means the Clerk environment variables are not properly configured.");
          throw new Error("Authentication failed. This appears to be a configuration issue. Please contact support.");
        } else if (resp.status === 400) {
          throw new Error(errorMessage);
        } else {
          throw new Error(`Server error: ${errorMessage}`);
        }
      }

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
              displayContent += `${listing.mls.bullets.join('\n')  }\n\n`;
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
            displayContent += `${listing.mls.bullets.join('\n')  }\n\n`;
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
      console.error("Chat error:", e);
      const errorMessage = e?.message || e?.error || "Failed to get response";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function openFlyerModal() {
    console.log("🚀 ===== OPENFLYERMODAL DEBUG START =====");
    console.log("🚀 openFlyerModal called", { isPro, flyerOpen, hasListing, currentListing: currentListing ? currentListing.substring(0, 50) : 'NO LISTING' });
    
    if (!isPro) { 
      console.log("❌ User not Pro, redirecting to upgrade");
      router.push("/upgrade"); 
      return; 
    }
    
    console.log("✅ User is Pro, proceeding...");
    console.log("🚀 Setting flyerOpen to true");
    setFlyerOpen(true);
    console.log("🚀 flyerOpen state should now be true");
    console.log("🚀 ===== OPENFLYERMODAL DEBUG END =====");
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
    
    // Don't scroll - let the page stay where it is
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

  // Enhanced flyer generation handler
  async function handleEnhancedFlyerGeneration(flyerData) {
    const { agentInfo, style, photos, listing } = flyerData;
    
    console.log('🎨 Starting enhanced flyer generation:', { agentInfo, style, photos: photos?.length });
    
    try {
      setFlyerGenerating(true);
      
      // First, call our API to validate the data
      const response = await fetch("/api/flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentInfo, style, photos, listing })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎨 API response:', data);
      
      if (data.success) {
        // Now generate the actual flyer using our template system
        const flyerImageUrl = await generateFlyerWithTemplates(flyerData);
        
        // Download the generated flyer
        const a = document.createElement('a');
        a.href = flyerImageUrl;
        a.download = `flyer-${style}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        // Close modal and show success
        setFlyerOpen(false);
        alert('✅ Professional flyer generated successfully! Check your downloads folder.');
        
      } else {
        throw new Error("Failed to generate flyer");
      }
      
    } catch (error) {
      console.error('🎨 Enhanced flyer generation error:', error);
      alert(`❌ Error generating flyer: ${error.message}`);
    } finally {
      setFlyerGenerating(false);
    }
  }

  // Generate flyer using our template system
  async function generateFlyerWithTemplates(flyerData) {
    try {
      console.log('🎨 Starting flyer generation with templates:', flyerData);
      
      // Dynamically import the generateFlyer function
      const { generateFlyer } = await import('@/lib/flyerTemplates');
      
      // Generate the flyer
      const dataUrl = await generateFlyer(flyerData, flyerData.style);
      
      if (dataUrl) {
        console.log('✅ Professional flyer generated successfully!');
        return dataUrl;
      } else {
        console.error('❌ Flyer generation failed');
        // Fallback to simple flyer
        return generateFallbackFlyer(flyerData);
      }
      
    } catch (error) {
      console.error('❌ Error in flyer generation:', error);
      // Fallback to simple flyer
      return generateFallbackFlyer(flyerData);
    }
  }

  // Fallback flyer generation if templates fail
  function generateFallbackFlyer(flyerData) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    // Professional fallback design
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8fafc');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);
    
    // Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1200, 120);
    
    // FOR SALE badge
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(40, 30, 120, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOR SALE', 100, 55);
    
    // Property title
    const title = flyerData.listing ? flyerData.listing.split('\n')[0].substring(0, 35) : 'Beautiful Property';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 200, 60);
    
    // Photo placeholder
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(40, 140, 1120, 300);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 140, 1120, 300);
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Property Photos', 600, 290);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('(AI Generated)', 600, 310);
    
    // Property details
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Property Details', 40, 580);
    
    // Agent info
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 600, 1200, 200);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(flyerData.agentInfo?.name || 'Your Name', 40, 640);
    
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(flyerData.agentInfo?.agency || 'Your Agency', 40, 665);
    
    // Generated by
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by ListGenie.ai', 600, 770);
    
    return canvas.toDataURL('image/png', 0.95);
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

    // Don't scroll - let the page stay where it is

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

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMessage = errorData.error || `Chat API error: ${resp.status}`;
        if (resp.status === 401) {
          throw new Error("Please sign in to use the AI Listing Generator");
        } else if (resp.status === 400) {
          throw new Error(errorMessage);
        } else {
          throw new Error(`Server error: ${errorMessage}`);
        }
      }

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
              displayContent += `${listing.mls.bullets.join('\n')  }\n\n`;
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
              displayContent += `${listing.mls.bullets.join('\n')  }\n\n`;
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
    } catch (e) {
      console.error("Modify listing error:", e);
      const errorMessage = e?.message || e?.error || "Failed to get response";
      setError(errorMessage);
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
          tone
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMessage = errorData.error || `Chat API error: ${resp.status}`;
        if (resp.status === 401) {
          throw new Error("Please sign in to use the AI Listing Generator");
        } else if (resp.status === 400) {
          throw new Error(errorMessage);
        } else {
          throw new Error(`Server error: ${errorMessage}`);
        }
      }

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
              tone
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
                displayContent += `${listing.mls.bullets.join('\n')  }\n\n`;
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
          displayContent += `${listing.mls.bullets.join('\n')  }\n\n`;
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
      console.error("Modify listing error:", e);
      const errorMessage = e?.message || e?.error || "Failed to get response";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
          <div className="ai-chat-section">
            <h1 className="ai-chat-title">AI Listing Generator</h1>
            <p className="ai-chat-subtitle">Describe your property and let AI create professional listings</p>
            {!isListingMode && (
              <ExamplesRow onSelect={(text) => composerRef.current.setInput(text)} />
            )}
            <div className="chat-input-section">
              <Composer ref={composerRef} onSend={handleSend} loading={loading} />
            </div>
            {loading && (
              <div className="generating-animation">
                <div className="generating-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="generating-text">Generating...</div>
              </div>
            )}
          </div>
        </div>
      </main>

      

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
