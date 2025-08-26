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
import EnhancedFlyerModal from "@/components/chat/EnhancedFlyerModal";
import ProfessionalFlyerPreview from '../components/chat/ProfessionalFlyerPreview';

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

  // State for flyer generation
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [flyerGenerating, setFlyerGenerating] = useState(false);
  const [showFlyerPreview, setShowFlyerPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // ISOLATED TEST STATE - Completely separate from flyer logic
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Questions modal
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestionsAndAnswers, setAllQuestionsAndAnswers] = useState([]);

  // Listing mode
  const [isListingMode, setIsListingMode] = useState(false);
  const [currentListing, setCurrentListing] = useState("");
  const [hasListing, setHasListing] = useState(false);
  const [originalInput, setOriginalInput] = useState("");

  // Debug state changes - MOVED HERE after variables are declared
  useEffect(() => {
    console.log('🔍 FLYER STATE CHANGED:', { 
      flyerOpen, 
      flyerGenerating, 
      hasListing, 
      isPro,
      timestamp: new Date().toISOString()
    });
  }, [flyerOpen, flyerGenerating, hasListing, isPro]);

  // Debug currentListing changes - MOVED HERE after variables are declared
  useEffect(() => {
    console.log('📝 CURRENT LISTING CHANGED:', { 
      currentListing: currentListing?.substring(0, 100), 
      hasListing, 
      type: typeof currentListing,
      timestamp: new Date().toISOString()
    });
  }, [currentListing, hasListing]);

  // Debug modal state specifically
  useEffect(() => {
    console.log('🎭 MODAL STATE DEBUG:', {
      flyerOpen,
      modalShouldRender: flyerOpen === true,
      timestamp: new Date().toISOString()
    });
  }, [flyerOpen]);

  // Refs
  const composerRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Monitor flyer modal state changes
  useEffect(() => {
    console.log('🎨 Flyer modal state changed:', flyerOpen);
  }, [flyerOpen]);

  /** ---------------- Flyer Generation Functions ---------------- */
  const handleEnhancedFlyerGeneration = async (flyerData) => {
    try {
      setFlyerGenerating(true);
      
      const response = await fetch('/api/flyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...flyerData,
          listing: currentListing
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Download the generated PDF
        const link = document.createElement('a');
        link.href = result.pdfUrl;
        link.download = `professional-flyer-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setFlyerOpen(false);
        alert('Flyer generated successfully! Downloading now...');
      } else {
        throw new Error(result.error || 'Failed to generate flyer');
      }
    } catch (error) {
      console.error('Error generating flyer:', error);
      alert(`Error generating flyer: ${error.message}`);
    } finally {
      setFlyerGenerating(false);
    }
  };

  const handleFlyerPreview = (previewData) => {
    // Handle flyer preview if needed
    console.log('Flyer preview:', previewData);
    setPreviewData(previewData);
    setShowFlyerPreview(true);
  };

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

  /** ---------------- Event Handlers ---------------- */
  function handleNewListing() {
    setIsListingMode(true);
    setMessages([]);
    setCurrentListing("");
    setHasListing(false);
    setOriginalInput("");
    setAllQuestionsAndAnswers([]);
    setQuestionAnswers({});
    setCurrentQuestionIndex(0);
  }

  function closeFlyerPreview() {
    setShowFlyerPreview(false);
    setPreviewData(null);
  }

  // Generate professional flyer using our custom engine
  const generateProfessionalFlyer = async (flyerData) => {
    console.log('🌐 generateProfessionalFlyer: Function called');
    console.log('🌐 generateProfessionalFlyer: flyerData:', flyerData);

    try {
      console.log('🌐 generateProfessionalFlyer: Making API call to /api/flyer...');
      const response = await fetch('/api/flyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flyerData),
      });

      console.log('🌐 generateProfessionalFlyer: API response received');
      console.log('🌐 generateProfessionalFlyer: Response status:', response.status);
      console.log('🌐 generateProfessionalFlyer: Response ok:', response.ok);
      console.log('🌐 generateProfessionalFlyer: Response headers:', response.headers);

      if (!response.ok) {
        console.log('❌ generateProfessionalFlyer: Response not ok, getting error text...');
        const errorText = await response.text();
        console.log('❌ generateProfessionalFlyer: Error response text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      console.log('🌐 generateProfessionalFlyer: Parsing response JSON...');
      const data = await response.json();
      console.log('🌐 generateProfessionalFlyer: Parsed response data:', data);
      console.log('🌐 generateProfessionalFlyer: Data type:', typeof data);
      console.log('🌐 generateProfessionalFlyer: Data keys:', Object.keys(data || {}));

      return data;
    } catch (error) {
      console.error('❌ generateProfessionalFlyer: Error occurred:', error);
      console.error('❌ generateProfessionalFlyer: Error stack:', error.stack);
      console.error('❌ generateProfessionalFlyer: Error name:', error.name);
      console.error('❌ generateProfessionalFlyer: Error message:', error.message);
      throw error;
    }
  };

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
          setError("Authentication failed. Please sign in again.");
          router.push("/sign-in");
          return;
        }
        throw new Error(errorMessage);
      }

      const data = await resp.json();
      console.log("Raw API response:", data); // Debug log

      // Check if we need to ask follow-up questions
      if (data.parsed?.type === "questions") {
        console.log("Setting questions:", data.parsed.questions); // Debug log
        setQuestions(data.parsed.questions);
        setQuestionAnswers({});
        setCurrentQuestionIndex(0);
        setQuestionsOpen(true);
        setLoading(false);
        return;
      }

      // Process the response
      if (data.message?.content) {
        const content = data.message.content;
        const variants = splitVariants(content);
        
        if (variants) {
          // We have structured variants
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { 
              role: "assistant", 
              content: content,
              pretty: variants.mls || content,
              variants: variants
            };
            return copy;
          });
        } else {
          // Single response
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: content, pretty: content };
            return copy;
          });
        }

        // Check if this looks like a listing - only set hasListing if we actually get a proper listing
        if (data.parsed?.type === "listing" ||
            (content.includes("bedroom") && content.includes("bathroom") && content.includes("sq ft")) ||
            (content.includes("bedroom") && content.includes("bathroom") && content.includes("square feet"))) {
          console.log("Listing detected, setting currentListing and hasListing to true");
          setCurrentListing(content);
          setHasListing(true);
          
          // Save listing to localStorage and redirect to listing display page
          try {
            localStorage.setItem('currentListing', content);
            sessionStorage.setItem('currentListing', content);
            router.push('/listing-display');
          } catch (e) {
            console.error('Failed to save listing or redirect:', e);
          }
        } else {
          console.log("No listing detected, keeping hasListing as false");
          setHasListing(false);
        }
      } else {
        // Fallback to raw content if parsing fails
        const text = coerceToReadableText(data.message?.content || data.content || data);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
          return copy;
        });
        
        // Don't set hasListing to true for fallback content
        setHasListing(false);
      }
    } catch (e) {
      console.error("Modify listing error:", e);
      const errorMessage = e?.message || e?.error || "Failed to get response";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function submitQuestionAnswers() {
    const answers = Object.values(questionAnswers);
    setAllQuestionsAndAnswers(prev => [...prev, ...answers]);
    setQuestionsOpen(false);
    
    // Send the answers to continue the conversation
    const answerText = answers.join('\n\n');
    console.log('📝 Submitting question answers:', answerText);

    // Add the answers to the chat
    setMessages(prev => [
      ...prev,
      { role: "user", content: `Here are my answers:\n\n${answerText}` },
      { role: "assistant", content: "", pretty: "" }
    ]);

    // Send the answers to get the final listing
    handleSend(answerText);
  }

  // Don't render until user is loaded
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <ChatHeader />
        
        <div className="chat-content">
          {/* Centered AI Listing Generator Section */}
          <div className="ai-listing-generator-section">
            <h1 className="ai-listing-title">AI Listing Generator</h1>
            <p className="ai-listing-subtitle">Describe your property and let AI create professional listings</p>
            
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

          {/* Messages Container */}
          {messages.length > 0 && (
            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-content">
                    {message.role === 'assistant' && message.content.includes('```') ? (
                      <div className="code-block">
                        <pre>
                          <code>{message.content.replace(/```/g, '')}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="text-content">{message.content}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Flyer Generation Button - Only show if user stays on this page */}
          {hasListing && (
            <div className="flyer-generation-section">
              <div className="debug-flyer-info" style={{
                background: 'rgba(255, 0, 0, 0.1)',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <strong>🔍 FLYER DEBUG INFO:</strong><br/>
                hasListing: {hasListing ? '✅ true' : '❌ false'}<br/>
                flyerOpen: {flyerOpen ? '✅ true' : '❌ false'}<br/>
                isPro: {isPro ? '✅ true' : '❌ false'}<br/>
                currentListing exists: {currentListing ? '✅ yes' : '❌ no'}<br/>
                currentListing type: {typeof currentListing}<br/>
                currentListing length: {currentListing ? currentListing.length : 'N/A'}<br/>
                <strong>🎯 MODAL RENDER CHECK:</strong><br/>
                flyerOpen === true: {flyerOpen === true ? '✅ YES' : '❌ NO'}<br/>
                Modal should render: {flyerOpen ? '✅ YES' : '❌ NO'}<br/>
                <strong>🔧 STATE UPDATES:</strong><br/>
                Last update: {new Date().toLocaleTimeString()}
              </div>
              
              {/* ISOLATED REACT STATE TEST */}
              <button
                style={{
                  background: 'purple',
                  color: 'white',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
                onClick={() => {
                  console.log('🟣 ISOLATED REACT TEST BUTTON CLICKED');
                  console.log('🟣 Current testModalOpen state:', testModalOpen);
                  console.log('🟣 Setting testModalOpen to true...');
                  
                  setTestModalOpen(true);
                  
                  console.log('🟣 setTestModalOpen(true) called');
                  
                  // Check state after a delay
                  setTimeout(() => {
                    console.log('🟣 After 100ms, testModalOpen =', testModalOpen);
                  }, 100);
                }}
              >
                🟣 ISOLATED TEST: React State Only
              </button>
              
              {/* Simple Test Button - Bypass all complex state */}
              <button
                style={{
                  background: 'green',
                  color: 'white',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
                onClick={() => {
                  console.log('🟢 SIMPLE TEST BUTTON CLICKED');
                  console.log('🟢 This button should work regardless of state');
                  
                  // Force a simple modal to appear
                  const modal = document.createElement('div');
                  modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 99999;
                    background-color: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  `;
                  
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      color: black;
                      padding: 40px;
                      border-radius: 10px;
                      max-width: 500px;
                      text-align: center;
                    ">
                      <h2>🟢 SIMPLE MODAL TEST!</h2>
                      <p>This modal was created directly with DOM manipulation</p>
                      <p>If you see this, modal rendering works!</p>
                      <button onclick="this.parentElement.parentElement.remove()" style="
                        background: #10b981;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 20px;
                      ">
                        Close Modal
                      </button>
                    </div>
                  `;
                  
                  document.body.appendChild(modal);
                  console.log('🟢 Simple modal added to DOM');
                }}
              >
                🟢 SIMPLE TEST: Create Modal with DOM
              </button>
              
              {/* Force State Button */}
              <button
                style={{
                  background: 'orange',
                  color: 'white',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  console.log('🟠 FORCE STATE BUTTON CLICKED');
                  console.log('🟠 Current flyerOpen state:', flyerOpen);
                  
                  // Force a re-render by updating multiple states
                  setFlyerOpen(true);
                  setFlyerGenerating(false);
                  
                  console.log('🟠 States updated, flyerOpen should now be true');
                }}
              >
                🟠 FORCE: Update all flyer states
              </button>
              
              <button
                className="flyer-generation-btn"
                onClick={() => {
                  console.log('🎨 ===== FLYER BUTTON CLICKED =====');
                  console.log('🎨 Button clicked at:', new Date().toISOString());
                  console.log('🎨 Current state BEFORE setFlyerOpen:', { 
                    flyerOpen, 
                    hasListing, 
                    isPro,
                    isTrial,
                    currentListing: currentListing?.substring(0, 100) 
                  });
                  
                  if (!isPro) {
                    console.log('❌ User is not Pro, showing upgrade alert');
                    alert("Please upgrade to Pro to generate flyers");
                    return;
                  }
                  
                  if (!hasListing || !currentListing) {
                    console.log('❌ No listing available');
                    alert("Please generate a listing first");
                    return;
                  }
                  
                  console.log('✅ All checks passed, setting flyerOpen to true');
                  
                  // Force immediate state update
                  setFlyerOpen(true);
                  
                  console.log('🎨 State update called, flyerOpen should now be true');
                  
                  // Verify state change
                  setTimeout(() => {
                    console.log('🎨 State verification (after 100ms):', { 
                      flyerOpen, 
                      expected: true,
                      actual: flyerOpen 
                    });
                  }, 100);
                }}
                disabled={!isPro}
              >
                🎨 Generate Flyer {!isPro && '(Upgrade Required)'}
              </button>
              {!isPro && (
                <p className="flyer-upgrade-note">Upgrade to Pro to generate professional flyers</p>
              )}
            </div>
          )}
          
          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info" style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: 'rgba(0,0,0,0.1)', 
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <strong>Debug Info:</strong><br/>
              hasListing: {hasListing ? 'true' : 'false'}<br/>
              currentListing: {currentListing ? `"${currentListing.substring(0, 100)}..."` : 'null'}<br/>
              messages.length: {messages.length}<br/>
              isPro: {isPro ? 'true' : 'false'}
            </div>
          )}
        </div>
      </div>

      {/* ISOLATED TEST MODAL - Simple React state test */}
      {testModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(128, 0, 128, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            color: 'black',
            padding: '40px',
            borderRadius: '10px',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2>🟣 ISOLATED REACT MODAL!</h2>
            <p>This modal uses isolated React state: testModalOpen = {testModalOpen ? 'TRUE' : 'FALSE'}</p>
            <p>If you see this, React state management works!</p>
            <button
              onClick={() => {
                console.log('🟣 Closing isolated test modal');
                setTestModalOpen(false);
              }}
              style={{
                background: '#8b5cf6',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Close Isolated Modal
            </button>
          </div>
        </div>
      )}

      {/* Test Modal - Enhanced debugging */}
      {(() => {
        const shouldRender = flyerOpen === true;
        console.log('🎭 MODAL RENDER CHECK:', {
          flyerOpen,
          shouldRender,
          timestamp: new Date().toISOString()
        });
        
        if (shouldRender) {
          console.log('🧪 TEST MODAL RENDERING NOW!');
          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                background: 'white',
                color: 'black',
                padding: '40px',
                borderRadius: '10px',
                maxWidth: '500px',
                textAlign: 'center'
              }}>
                <h2>🧪 TEST MODAL WORKING!</h2>
                <p>flyerOpen state is: <strong>{flyerOpen ? 'TRUE' : 'FALSE'}</strong></p>
                <p>This proves modal rendering works!</p>
                <button
                  onClick={() => {
                    console.log('🧪 Closing test modal');
                    setFlyerOpen(false);
                  }}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  Close Modal
                </button>
              </div>
            </div>
          );
        } else {
          console.log('🧪 TEST MODAL NOT RENDERING - flyerOpen is false');
          return null;
        }
      })()}

      {/* Enhanced Flyer Modal */}
      {flyerOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <EnhancedFlyerModal
            onClose={() => {
              console.log('🎨 Modal close button clicked');
              setFlyerOpen(false);
            }}
            onGenerate={handleEnhancedFlyerGeneration}
            listing={currentListing}
            loading={flyerGenerating}
            onPreview={handleFlyerPreview}
          />
        </div>
      )}

      {/* Professional Flyer Preview */}
      <ProfessionalFlyerPreview
        flyerData={previewData}
        isVisible={showFlyerPreview}
        onClose={closeFlyerPreview}
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
