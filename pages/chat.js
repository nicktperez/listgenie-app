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

  // Flyer modal state
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [flyerGenerating, setFlyerGenerating] = useState(false);

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

  // Flyer preview
  const [showFlyerPreview, setShowFlyerPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Refs
  const composerRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }, [messages.length]);

  // Monitor flyer modal state changes
  useEffect(() => {
    console.log('🎨 Flyer modal state changed:', flyerOpen);
  }, [flyerOpen]);

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

  function handleFlyerPreview(data) {
    setPreviewData(data);
    setShowFlyerPreview(true);
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

  // Handle enhanced flyer generation with our professional engine
  const handleEnhancedFlyerGeneration = async (flyerData) => {
    console.log('🎯 handleEnhancedFlyerGeneration: Function called');
    console.log('🎯 handleEnhancedFlyerGeneration: flyerData received:', flyerData);
    console.log('🎯 handleEnhancedFlyerGeneration: flyerData type:', typeof flyerData);
    console.log('🎯 handleEnhancedFlyerGeneration: flyerData keys:', Object.keys(flyerData || {}));

    try {
      console.log('🎯 handleEnhancedFlyerGeneration: Setting flyerGenerating to true');
      setFlyerGenerating(true);

      console.log('🎯 handleEnhancedFlyerGeneration: Calling generateProfessionalFlyer...');
      const canvaProject = await generateProfessionalFlyer(flyerData);
      console.log('🎯 handleEnhancedFlyerGeneration: generateProfessionalFlyer result:', canvaProject);
      console.log('🎯 handleEnhancedFlyerGeneration: Result type:', typeof canvaProject);
      console.log('🎯 handleEnhancedFlyerGeneration: Result keys:', Object.keys(canvaProject || {}));

      if (canvaProject && canvaProject.type === 'professional-flyer') {
        console.log('🎯 handleEnhancedFlyerGeneration: Professional flyer generated successfully');
        console.log('🎯 handleEnhancedFlyerGeneration: Flyer data:', canvaProject.flyer);

        const downloadProfessionalFlyer = () => {
          console.log('🎯 handleEnhancedFlyerGeneration: Starting download process');
          try {
            console.log('🎯 handleEnhancedFlyerGeneration: Creating HTML document...');
            const htmlDocument = `<!DOCTYPE html><html><head><style>${canvaProject.flyer.css}</style></head><body>${canvaProject.flyer.html}<script>${canvaProject.flyer.animations} /* ... animation init ... */</script></body></html>`;
            console.log('🎯 handleEnhancedFlyerGeneration: HTML document created, length:', htmlDocument.length);

            console.log('🎯 handleEnhancedFlyerGeneration: Creating blob...');
            const blob = new Blob([htmlDocument], { type: 'text/html' });
            console.log('🎯 handleEnhancedFlyerGeneration: Blob created, size:', blob.size);

            console.log('🎯 handleEnhancedFlyerGeneration: Creating download URL...');
            const url = URL.createObjectURL(blob);
            console.log('🎯 handleEnhancedFlyerGeneration: Download URL created:', url);

            console.log('🎯 handleEnhancedFlyerGeneration: Creating download link...');
            const a = document.createElement('a');
            a.href = url;
            a.download = `professional-flyer-${flyerData.style}-${Date.now()}.html`;
            console.log('🎯 handleEnhancedFlyerGeneration: Download link created, filename:', a.download);

            console.log('🎯 handleEnhancedFlyerGeneration: Appending link to DOM...');
            document.body.appendChild(a);

            console.log('🎯 handleEnhancedFlyerGeneration: Triggering download...');
            a.click();

            console.log('🎯 handleEnhancedFlyerGeneration: Cleaning up...');
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ handleEnhancedFlyerGeneration: Download completed successfully');
          } catch (downloadError) {
            console.error('❌ handleEnhancedFlyerGeneration: Download failed:', downloadError);
            console.error('❌ handleEnhancedFlyerGeneration: Download error stack:', downloadError.stack);
            throw downloadError;
          }
        };

        const message = `🎉 Your professional marketing flyer has been created successfully!\n\nDesign System: ${canvaProject.designSystem}\nQuality: ${canvaProject.quality}\n\nYour flyer is ready for download!`;
        console.log('🎯 handleEnhancedFlyerGeneration: Showing confirmation dialog');

        if (confirm(message + '\n\nClick OK to download your professional flyer now!')) {
          console.log('🎯 handleEnhancedFlyerGeneration: User confirmed, starting download');
          downloadProfessionalFlyer();
        } else {
          console.log('🎯 handleEnhancedFlyerGeneration: User cancelled download');
        }

        console.log('🎯 handleEnhancedFlyerGeneration: Closing flyer modal');
        setFlyerOpen(false);
        console.log('🎯 handleEnhancedFlyerGeneration: Setting flyerGenerating to false');
        setFlyerGenerating(false);
      } else {
        console.log('❌ handleEnhancedFlyerGeneration: Invalid response format:', canvaProject);
        throw new Error('Invalid response format from flyer generation');
      }
    } catch (error) {
      console.error('❌ handleEnhancedFlyerGeneration: Error occurred:', error);
      console.error('❌ handleEnhancedFlyerGeneration: Error stack:', error.stack);
      console.error('❌ handleEnhancedFlyerGeneration: Error name:', error.name);
      console.error('❌ handleEnhancedFlyerGeneration: Error message:', error.message);

      alert(`❌ Error generating professional flyer: ${error.message}`);
      console.log('🎯 handleEnhancedFlyerGeneration: Setting flyerGenerating to false');
      setFlyerGenerating(false);
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
  if (!isLoaded) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return null; // Will redirect in useEffect
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
            
            {/* Generated Listing Display */}
            {hasListing && currentListing && (
              <div className="listing-display-section">
                <h3 className="listing-display-title">Generated Listing</h3>
                <div className="listing-content">
                  <div className="listing-text">
                    {(() => {
                      try {
                        // Try to parse as JSON and format nicely
                        const parsed = JSON.parse(currentListing);
                        if (parsed.type === 'listing' && parsed.mls) {
                          return (
                            <div className="formatted-listing">
                              <h4 className="listing-headline">{parsed.mls.headline}</h4>
                              <p className="listing-body">{parsed.mls.body}</p>
                              {parsed.mls.bullets && parsed.mls.bullets.length > 0 && (
                                <ul className="listing-features">
                                  {parsed.mls.bullets.map((bullet, index) => (
                                    <li key={index} className="listing-feature">{bullet}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        }
                      } catch (e) {
                        // If not JSON, display as plain text
                        return (
                          <div className="plain-listing">
                            <p>{currentListing}</p>
                          </div>
                        );
                      }
                      // Fallback for other formats
                      return (
                        <div className="plain-listing">
                          <p>{currentListing}</p>
                        </div>
                      );
                    })()}
                  </div>
                  <button 
                    className="copy-listing-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(currentListing);
                      const btn = document.querySelector('.copy-listing-btn');
                      if (btn) {
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        btn.style.background = '#10b981';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.background = '';
                        }, 2000);
                      }
                    }}
                  >
                    📋 Copy Listing
                  </button>
                </div>
              </div>
            )}
            
            {/* Flyer Generation Button */}
            {hasListing && (
              <div className="flyer-generation-section">
                <button
                  className="flyer-generation-btn"
                  onClick={() => {
                    console.log('🎨 Flyer button clicked!');
                    console.log('🎨 Current state:', { 
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
                    
                    console.log('✅ User is Pro, opening flyer modal...');
                    setFlyerOpen(true);
                    console.log('🎨 Flyer modal state set to true');
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
      </main>

      {/* Enhanced Flyer Modal */}
      {flyerOpen && (
        <div>
          {console.log('🎨 Rendering EnhancedFlyerModal, flyerOpen:', flyerOpen)}
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
