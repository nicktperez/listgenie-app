// pages/chat.js — ListGenie.ai (enhanced)
// - Restored dark UI
// - Streaming chat with readable output cleanup
// - Variant detection & styled cards (MLS / Social / Luxury / Concise)
// - Copy-to-clipboard buttons for each variant and full response (with "Copied!" state)
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

  // Flyer modal state
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [flyerTypes, setFlyerTypes] = useState({ standard: true, openHouse: false });
  const [flyerBusy, setFlyerBusy] = useState(false);
  
  // New flyer customization state
  const [agencyName, setAgencyName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [agencyLogo, setAgencyLogo] = useState(null);
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // New customization state variables
  const [primaryColor, setPrimaryColor] = useState("#2d4a3e");
  const [secondaryColor, setSecondaryColor] = useState("#8b9d83");
  const [fontStyle, setFontStyle] = useState("modern");
  const [showPrice, setShowPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState("$399,900");
  
  // Load saved agency info from localStorage on component mount
  useEffect(() => {
    const savedAgencyInfo = localStorage.getItem('listgenie_agency_info');
    if (savedAgencyInfo) {
      try {
        const parsed = JSON.parse(savedAgencyInfo);
        if (parsed.agencyName) setAgencyName(parsed.agencyName);
        if (parsed.agentEmail) setAgentEmail(parsed.agentEmail);
        if (parsed.agentPhone) setAgentPhone(parsed.agentPhone);
        if (parsed.websiteLink) setWebsiteLink(parsed.websiteLink);
        if (parsed.officeAddress) setOfficeAddress(parsed.officeAddress);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.secondaryColor) setSecondaryColor(parsed.secondaryColor);
        if (parsed.fontStyle) setFontStyle(parsed.fontStyle);
        if (parsed.backgroundPattern) setBackgroundPattern(parsed.backgroundPattern);
        if (parsed.propertyDetails) setPropertyDetails(parsed.propertyDetails);
        if (parsed.propertyHighlights) setPropertyHighlights(parsed.propertyHighlights);
      } catch (e) {
        console.log('Error loading saved agency info:', e);
      }
    }
  }, []);
  
  // Open House specific fields
  const [openHouseDate, setOpenHouseDate] = useState("December 15th, 2024");
  const [openHouseTime, setOpenHouseTime] = useState("2:00 PM - 5:00 PM");
  const [openHouseAddress, setOpenHouseAddress] = useState("123 Anywhere St., Any City, ST 12345");
  
  // Signature styling option
  const [useSignatureStyling, setUseSignatureStyling] = useState(false);
  
  // Background pattern option
  const [backgroundPattern, setBackgroundPattern] = useState("none");
  
  // Property details state
  const [propertyDetails, setPropertyDetails] = useState({
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: ''
  });
  
  // Property highlights state
  const [propertyHighlights, setPropertyHighlights] = useState({
    highCeilings: false,
    crownMolding: false,
    updatedKitchen: false,
    lushLandscaping: false,
    twoCarGarage: false,
    communityPool: false,
    solarPanels: false
  });
  
  // Save confirmation state
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Questions modal
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Track all Q&A history for better AI memory
  const [allQuestionsAndAnswers, setAllQuestionsAndAnswers] = useState([]);

  // Copy state (for "Copied!" UI)
  const [copiedKey, setCopiedKey] = useState(null);
  
  // Track if we're in listing mode (hide examples when true)
  const [isListingMode, setIsListingMode] = useState(false);
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

  // Function to save agency info to localStorage
  const saveAgencyInfo = () => {
    const agencyInfo = {
      agencyName,
      agentEmail,
      agentPhone,
      websiteLink,
      officeAddress,
      primaryColor,
      secondaryColor,
      fontStyle,
      backgroundPattern,
      propertyDetails,
      propertyHighlights
    };
    localStorage.setItem('listgenie_agency_info', JSON.stringify(agencyInfo));
    
    // Show confirmation
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 2000);
  };

  async function generateFlyers() {
    if (!isPro) { router.push("/upgrade"); return; }
    
    // Save agency info before generating flyers
    saveAgencyInfo();
    
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
      // Add customization data
      customization: {
        agencyName: agencyName.trim(),
        agentEmail: agentEmail.trim(),
        agentPhone: agentPhone.trim(),
        websiteLink: websiteLink.trim(),
        officeAddress: officeAddress.trim(),
        agencyLogo: agencyLogo,
        propertyPhotos: propertyPhotos,
        primaryColor,
        secondaryColor,
        fontStyle,
        showPrice,
        customPrice,
        openHouseDate,
        openHouseTime,
        openHouseAddress,
        propertyDetails,
        propertyHighlights,
        useSignatureStyling,
        backgroundPattern,
        showAdvancedOptions
      }
    };

    try {
      setFlyerBusy(true);
      setError(null); // Clear any previous errors
      
      console.log("Generating flyers with payload:", payload); // Debug log
      console.log("Flyer types selected:", flyerTypes); // Debug log
      console.log("Filtered flyers array:", Object.entries(flyerTypes).filter(([_, v]) => v).map(([k]) => k)); // Debug log
      
      const res = await fetch("/api/flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log("Flyer API response status:", res.status);
      console.log("Flyer API response headers:", Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Flyer API error response:", errorData);
        throw new Error(errorData.error || `Flyer API error: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      console.log("Response content type:", contentType);
      
      if (contentType?.includes("application/json")) {
        console.log("Processing JSON response with separate flyers...");
        const data = await res.json();
        console.log("Flyer generation response:", data);
        
        if (data.success && data.flyers) {
          console.log("Available flyers in response:", Object.keys(data.flyers)); // Debug log
          console.log("Flyer content lengths:", Object.entries(data.flyers).map(([k, v]) => [k, v.length])); // Debug log
          
          // Download each flyer type separately
          const downloadedFiles = [];
          for (const [flyerType, htmlContent] of Object.entries(data.flyers)) {
            const filename = flyerType === 'standard' ? 'property-flyer.html' : 'open-house-flyer.html';
            downloadedFiles.push(filename);
            
            console.log(`Processing ${flyerType} flyer, content length: ${htmlContent.length}`); // Debug log
            
            // Create and download HTML file
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; 
            a.download = filename; 
            document.body.appendChild(a); 
            a.click();
            URL.revokeObjectURL(url); 
            a.remove();
            
            console.log(`Downloaded ${filename} successfully`);
            
            // Small delay between downloads to prevent browser issues
            if (downloadedFiles.length < Object.keys(data.flyers).length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // Show success message
          setError(null);
          alert(`✅ Successfully generated and downloaded: ${downloadedFiles.join(', ')}`);
        } else {
          throw new Error(data.message || "Failed to generate flyers");
        }
      } else if (contentType?.includes("text/html")) {
        console.log("Processing HTML response...");
        const htmlText = await res.text();
        console.log("HTML content length:", htmlText.length);
        
        // Create and download HTML file
        const blob = new Blob([htmlText], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; 
        a.download = "flyer.html"; 
        document.body.appendChild(a); 
        a.click();
        URL.revokeObjectURL(url); 
        a.remove();
        
        console.log("HTML flyer download initiated successfully");
      } else if (contentType?.includes("application/pdf")) {
        console.log("Processing PDF response...");
        const blob = await res.blob();
        console.log("PDF blob size:", blob.size);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; 
        a.download = "flyer.pdf"; 
        document.body.appendChild(a); 
        a.click();
        URL.revokeObjectURL(url); 
        a.remove();
        
        console.log("PDF download initiated successfully");
      } else {
        console.log("Processing JSON response...");
        // JSON with urls (alternate server behavior)
        const data = await res.json();
        console.log("JSON response data:", data);
        
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

  function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo file is too large. Please use an image under 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Compress the image before storing
        compressImage(e.target.result, 800, 600, 0.7).then(compressed => {
          setAgencyLogo(compressed);
          setError(null); // Clear any previous errors
        });
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Check total file sizes
    const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) { // 20MB total limit
      setError("Total photo size is too large. Please use images under 20MB total.");
      return;
    }
    
    imageFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB per photo limit
        setError(`Photo "${file.name}" is too large. Please use images under 5MB each.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Compress each photo before storing
        compressImage(e.target.result, 600, 400, 0.6).then(compressed => {
          setPropertyPhotos(prev => [...prev, {
            id: Date.now() + Math.random(),
            data: compressed,
            name: file.name
          }]);
          setError(null); // Clear any previous errors
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Image compression function
  function compressImage(dataUrl, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  }

  function removePhoto(photoId) {
    setPropertyPhotos(prev => prev.filter(photo => photo.id !== photoId));
  }

  return (
    <div className="chat-page">


      {/* Top Navbar */}
      <nav className="top-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="logo">🏠</div>
            <div className="brand-text">ListGenie.ai</div>
          </div>
          <div className="navbar-right">
            {isListingMode && (
              <button 
                className="new-listing-btn"
                onClick={() => {
                  setIsListingMode(false);
                  setMessages([]);
                  setInput('');
                }}
                title="Start a new listing"
              >
                ✨ New Listing
              </button>
            )}
            <div className="navbar-links">
              <a href="/upgrade" className="billing-link">
                Billing
              </a>
              <div className="plan-badge">
                {isPro ? "Pro" : isTrial ? "Trial" : "Expired"}
              </div>
              <div className="profile-section">
                <div className="profile-avatar">👤</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="chat-container">
        <div className="chat-wrap">
          {/* Header */}
          <header className="chat-header">
            <h1 className="chat-title">AI Listing Generator</h1>
          </header>
          <p className="header-sub">
            Describe your property and let AI create professional listings
          </p>

          {/* Example prompts */}
          {!isListingMode && (
            <>
              <p className="examples-label">Quick examples</p>
              <div className="examples-row">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    className="chip example-chip"
                    onClick={() => setInput(ex.text)}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Input field */}
          <div className="field-card">
            <textarea
              className="chat-textarea"
              rows={4}
              placeholder="Describe your property (e.g., '3 bed ranch')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="field-actions">
              <button
                className="send-btn"
                disabled={loading || !input.trim()}
                onClick={handleSend}
              >
                {loading ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>

          {error && <div className="error-card">{error}</div>}

          {/* Chat Messages - Centered when present */}
          {messages.length > 0 && (
            <section className="chat-area thread">
              {messages.map((message, index) => (
                <div key={index} className={`msg-card ${message.role}`}>
                  <div className="msg-header">{message.role === "user" ? "You" : "ListGenie"}</div>
                  <div className="msg-body">
                    {message.role === "user"
                      ? message.content
                      : message.pretty || message.content || "Generating..."}
                  </div>

                  {message.role === "assistant" && message.pretty && message.pretty.includes('**') && (
                    <div className="listing-actions">
                      <div className="primary-actions">
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

                      <div className="modification-options">
                        <h4 className="modify-title">Modify Listing:</h4>
                        <div className="modify-buttons">
                          <button
                            className="modify-btn"
                            onClick={() => handleModifyListing(message.pretty, 'longer')}
                            title="Make the listing longer and more detailed"
                          >
                            📝 Make Longer
                          </button>
                          <button
                            className="modify-btn"
                            onClick={() => handleModifyListing(message.pretty, 'modern')}
                            title="Make the listing more modern and contemporary"
                          >
                            🏢 More Modern
                          </button>
                          <button
                            className="modify-btn"
                            onClick={() => handleModifyListing(message.pretty, 'country')}
                            title="Make the listing more country/rural focused"
                          >
                            🌾 More Country
                          </button>
                          <button
                            className="modify-btn"
                            onClick={() => handleModifyListing(message.pretty, 'luxurious')}
                            title="Make the listing more luxurious and upscale"
                          >
                            ✨ More Luxurious
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
        </div>
      </main>

      {flyerOpen && (
        <div className="flyer-modal">
          <div className="flyer-modal-content">
            <div className="flyer-modal-header">
              <h2 className="flyer-modal-title">Create Beautiful Flyers</h2>
              <button className="flyer-modal-close" onClick={() => setFlyerOpen(false)}>✕</button>
            </div>
            
            <div className="flyer-modal-body">
              {/* Error Display */}
              {error && (
                <div className="flyer-error">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{error}</span>
                </div>
              )}
              
              {/* Flyer Type Selection */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Flyer Types</h3>
                <p className="flyer-section-description">
                  Select which types of flyers you'd like to generate. You can choose one or both.
                </p>
                <div className="flyer-options">
                  <label className="flyer-option">
                    <input
                      type="checkbox"
                      checked={flyerTypes.standard}
                      onChange={(e) => setFlyerTypes((s) => ({ ...s, standard: e.target.checked }))}
                    />
                    <span className="flyer-option-text">
                      <span className="flyer-option-icon">📄</span>
                      Standard Property Flyer
                    </span>
                  </label>
                  <label className="flyer-option">
                    <input
                      type="checkbox"
                      checked={flyerTypes.openHouse}
                      onChange={(e) => setFlyerTypes((s) => ({ ...s, openHouse: e.target.checked }))}
                    />
                    <span className="flyer-option-text">
                      <span className="flyer-option-icon">🏠</span>
                      Open House Flyer
                    </span>
                  </label>
                </div>
                <div className="flyer-selection-summary">
                  {flyerTypes.standard && flyerTypes.openHouse ? (
                    <span className="summary-both">✅ Both flyer types selected</span>
                  ) : flyerTypes.standard ? (
                    <span className="summary-standard">✅ Standard flyer only</span>
                  ) : flyerTypes.openHouse ? (
                    <span className="summary-openhouse">✅ Open house flyer only</span>
                  ) : (
                    <span className="summary-none">⚠️ Please select at least one flyer type</span>
                  )}
                </div>
              </div>

              {/* Agency Information */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Agency Information</h3>
                <div className="flyer-form-grid">
                  <div className="form-group">
                    <label>Agency Name</label>
                    <input
                      type="text"
                      placeholder="Your Agency Name"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Agent Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={agentEmail}
                      onChange={(e) => setAgentEmail(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Agent Phone</label>
                    <input
                      type="tel"
                      placeholder="123-456-7890"
                      value={agentPhone}
                      onChange={(e) => setAgentPhone(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Listing Website Link</label>
                    <input
                      type="url"
                      placeholder="https://yourlisting.com or MLS listing URL"
                      value={websiteLink}
                      onChange={(e) => setWebsiteLink(e.target.value)}
                      className="flyer-input"
                    />
                    <small className="input-hint">This will be displayed prominently in the flyer description</small>
                  </div>
                  <div className="form-group">
                    <label>Office Address</label>
                    <input
                      type="text"
                      placeholder="123 Main St, City, State ZIP"
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="flyer-section">
                  <h3 className="flyer-section-title">Property Details (Optional)</h3>
                  <p className="flyer-section-description">
                    Add key property specifications to display on your flyer.
                  </p>
                  <div className="flyer-form-grid">
                    <div className="form-group">
                      <label>Bedrooms</label>
                      <input
                        type="number"
                        placeholder="e.g., 3"
                        value={propertyDetails.bedrooms || ''}
                        onChange={(e) => setPropertyDetails(prev => ({ ...prev, bedrooms: e.target.value }))}
                        className="flyer-input"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Bathrooms</label>
                      <input
                        type="number"
                        placeholder="e.g., 2.5"
                        value={propertyDetails.bathrooms || ''}
                        onChange={(e) => setPropertyDetails(prev => ({ ...prev, bathrooms: e.target.value }))}
                        className="flyer-input"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Square Feet</label>
                      <input
                        type="number"
                        placeholder="e.g., 1850"
                        value={propertyDetails.sqft || ''}
                        onChange={(e) => setPropertyDetails(prev => ({ ...prev, sqft: e.target.value }))}
                        className="flyer-input"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Year Built</label>
                      <input
                        type="number"
                        placeholder="e.g., 2015"
                        value={propertyDetails.yearBuilt || ''}
                        onChange={(e) => setPropertyDetails(prev => ({ ...prev, yearBuilt: e.target.value }))}
                        className="flyer-input"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>
                </div>

                {/* Property Highlights */}
                <div className="flyer-section">
                  <h3 className="flyer-section-title">Property Highlights (Optional)</h3>
                  <p className="flyer-section-description">
                    Check the features that apply to your property. Only selected features will appear on your flyer.
                  </p>
                  <div className="highlights-grid">
                    <div className="highlight-item">
                      <label className="highlight-checkbox">
                        <input
                          type="checkbox"
                          checked={propertyHighlights.highCeilings}
                          onChange={(e) => setPropertyHighlights(prev => ({ ...prev, highCeilings: e.target.checked }))}
                        />
                        <span className="highlight-label">High Ceilings</span>
                      </label>
                    </div>
                    <div className="highlight-item">
                      <label className="highlight-checkbox">
                        <input
                          type="checkbox"
                          checked={propertyHighlights.crownMolding}
                          onChange={(e) => setPropertyHighlights(prev => ({ ...prev, crownMolding: e.target.checked }))}
                        />
                        <span className="highlight-label">Crown Molding</span>
                      </label>
                    </div>
                    <div className="highlight-item">
                      <label className="highlight-checkbox">
                        <input
                          type="checkbox"
                          checked={propertyHighlights.updatedKitchen}
                          onChange={(e) => setPropertyHighlights(prev => ({ ...prev, updatedKitchen: e.target.checked }))}
                        />
                        <span className="highlight-label">Updated Kitchen</span>
                      </label>
                    </div>
                    <div className="highlight-item">
                      <label className="highlight-checkbox">
                        <input
                          type="checkbox"
                          checked={propertyHighlights.lushLandscaping}
                          onChange={(e) => setPropertyHighlights(prev => ({ ...prev, lushLandscaping: e.target.checked }))}
                        />
                        <span className="highlight-label">Lush Landscaping</span>
                      </label>
                    </div>
                    <div className="highlight-item">
                      <label className="highlight-checkbox">
                        <input
                          type="checkbox"
                          checked={propertyHighlights.twoCarGarage}
                          onChange={(e) => setPropertyHighlights(prev => ({ ...prev, twoCarGarage: e.target.checked }))}
                        />
                        <span className="highlight-label">2-Car Garage</span>
                      </label>
                    </div>
                    <div className="highlight-item">
                      <label className="highlight-checkbox">
                        <input
                          type="checkbox"
                          checked={propertyHighlights.communityPool}
                          onChange={(e) => setPropertyHighlights(prev => ({ ...prev, communityPool: e.target.checked }))}
                        />
                        <span className="highlight-label">Community Pool</span>
                      </label>
                    </div>
                    <div className="highlight-item">
                      <label className="highlight-checkbox">
                        <input
                          type="checkbox"
                          checked={propertyHighlights.solarPanels}
                          onChange={(e) => setPropertyHighlights(prev => ({ ...prev, solarPanels: e.target.checked }))}
                        />
                        <span className="highlight-label">Solar Panels</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Agency Logo (Optional)</h3>
                <div className="logo-upload-area">
                  {agencyLogo ? (
                    <div className="logo-preview">
                      <img src={agencyLogo} alt="Agency Logo" />
                      <button 
                        className="remove-logo-btn"
                        onClick={() => setAgencyLogo(null)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="logo-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="logo-upload-input"
                      />
                      <div className="logo-upload-content">
                        <span className="logo-upload-icon">📷</span>
                        <span>Click to upload logo</span>
                        <span className="logo-upload-hint">PNG, JPG up to 2MB</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Design Customization */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Design Customization</h3>
                <p className="flyer-section-description">
                  Customize the look and feel of your flyer to match your brand.
                </p>
                
                <div className="customization-grid">
                  <div className="customization-item full-width">
                    <label className="customization-label">Color Theme</label>
                    <p className="customization-description">
                      Choose from professional color schemes designed for real estate
                    </p>
                    <div className="current-theme-display">
                      <span className="current-theme-label">Current:</span>
                      <span className="current-theme-name">
                        {primaryColor === "#2d4a3e" && secondaryColor === "#8b9d83" ? "Forest Green" :
                         primaryColor === "#1e3a8a" && secondaryColor === "#60a5fa" ? "Navy Blue" :
                         primaryColor === "#7c2d12" && secondaryColor === "#f59e0b" ? "Warm Brown" :
                         primaryColor === "#374151" && secondaryColor === "#9ca3af" ? "Modern Gray" :
                         primaryColor === "#581c87" && secondaryColor === "#a855f7" ? "Royal Purple" :
                         primaryColor === "#dc2626" && secondaryColor === "#f87171" ? "Bold Red" : "Custom"}
                        </span>
                    </div>
                    <div className="color-palettes">
                      <div 
                        className={`color-palette ${primaryColor === "#2d4a3e" && secondaryColor === "#8b9d83" ? 'active' : ''}`}
                        onClick={() => {
                          setPrimaryColor("#2d4a3e");
                          setSecondaryColor("#8b9d83");
                        }}
                      >
                        <div className="palette-preview">
                          <div className="palette-primary" style={{background: "#2d4a3e"}}></div>
                          <div className="palette-secondary" style={{background: "#8b9d83"}}></div>
                        </div>
                        <div className="palette-info">
                          <span className="palette-name">Forest Green</span>
                          <span className="palette-description">Professional & Trustworthy</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`color-palette ${primaryColor === "#1e3a8a" && secondaryColor === "#60a5fa" ? 'active' : ''}`}
                        onClick={() => {
                          setPrimaryColor("#1e3a8a");
                          setSecondaryColor("#60a5fa");
                        }}
                      >
                        <div className="palette-preview">
                          <div className="palette-primary" style={{background: "#1e3a8a"}}></div>
                          <div className="palette-secondary" style={{background: "#60a5fa"}}></div>
                        </div>
                        <div className="palette-info">
                          <span className="palette-name">Navy Blue</span>
                          <span className="palette-description">Classic & Sophisticated</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`color-palette ${primaryColor === "#7c2d12" && secondaryColor === "#f59e0b" ? 'active' : ''}`}
                        onClick={() => {
                          setPrimaryColor("#7c2d12");
                          setSecondaryColor("#f59e0b");
                        }}
                      >
                        <div className="palette-preview">
                          <div className="palette-primary" style={{background: "#7c2d12"}}></div>
                          <div className="palette-secondary" style={{background: "#f59e0b"}}></div>
                        </div>
                        <div className="palette-info">
                          <span className="palette-name">Warm Brown</span>
                          <span className="palette-description">Cozy & Inviting</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`color-palette ${primaryColor === "#374151" && secondaryColor === "#9ca3af" ? 'active' : ''}`}
                        onClick={() => {
                          setPrimaryColor("#374151");
                          setSecondaryColor("#9ca3af");
                        }}
                      >
                        <div className="palette-preview">
                          <div className="palette-primary" style={{background: "#374151"}}></div>
                          <div className="palette-secondary" style={{background: "#9ca3af"}}></div>
                        </div>
                        <div className="palette-info">
                          <span className="palette-name">Modern Gray</span>
                          <span className="palette-description">Clean & Contemporary</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`color-palette ${primaryColor === "#581c87" && secondaryColor === "#a855f7" ? 'active' : ''}`}
                        onClick={() => {
                          setPrimaryColor("#581c87");
                          setSecondaryColor("#a855f7");
                        }}
                      >
                        <div className="palette-preview">
                          <div className="palette-primary" style={{background: "#581c87"}}></div>
                          <div className="palette-secondary" style={{background: "#a855f7"}}></div>
                        </div>
                        <div className="palette-info">
                          <span className="palette-name">Royal Purple</span>
                          <span className="palette-description">Luxury & Elegance</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`color-palette ${primaryColor === "#dc2626" && secondaryColor === "#f87171" ? 'active' : ''}`}
                        onClick={() => {
                          setPrimaryColor("#dc2626");
                          setSecondaryColor("#f87171");
                        }}
                      >
                        <div className="palette-preview">
                          <div className="palette-primary" style={{background: "#dc2626"}}></div>
                          <div className="palette-secondary" style={{background: "#f87171"}}></div>
                        </div>
                        <div className="palette-info">
                          <span className="palette-name">Bold Red</span>
                          <span className="palette-description">Attention-Grabbing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="customization-item">
                    <label className="customization-label">Font Style</label>
                    <select
                      value={fontStyle}
                      onChange={(e) => setFontStyle(e.target.value)}
                      className="font-select"
                    >
                      <option value="modern">Modern & Clean</option>
                      <option value="elegant">Elegant Serif</option>
                      <option value="playful">Playful & Fun</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                  
                  <div className="customization-item">
                    <label className="customization-label">Show Price</label>
                    <div className="toggle-container">
                      <input
                        type="checkbox"
                        checked={showPrice}
                        onChange={(e) => setShowPrice(e.target.checked)}
                        className="toggle-checkbox"
                        id="show-price-toggle"
                      />
                      <label htmlFor="show-price-toggle" className="toggle-label">
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {showPrice && (
                  <div className="customization-item full-width">
                    <label className="customization-label">Custom Price</label>
                    <input
                      type="text"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="$399,900"
                      className="price-input"
                    />
                  </div>
                )}
                
                <div className="customization-item full-width">
                  <label className="customization-label">Signature Styling</label>
                  <div className="toggle-container">
                    <input
                      type="checkbox"
                      checked={useSignatureStyling}
                      onChange={(e) => setUseSignatureStyling(e.target.checked)}
                      className="toggle-checkbox"
                      id="signature-toggle"
                    />
                    <label htmlFor="signature-toggle" className="toggle-label">
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="customization-item full-width">
                  <label className="customization-label">Background Pattern</label>
                  <select
                    value={backgroundPattern}
                    onChange={(e) => setBackgroundPattern(e.target.value)}
                    className="font-select"
                  >
                    <option value="none">Plain Background</option>
                    <option value="checkerboard">Checkered Pattern</option>
                    <option value="floral">Floral Design</option>
                    <option value="geometric">Geometric Shapes</option>
                    <option value="dots">Polka Dots</option>
                    <option value="stripes">Subtle Stripes</option>
                  </select>
                </div>
              </div>

              {/* Open House Details */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Open House Details</h3>
                <p className="flyer-section-description">
                  Fill in the details for your open house flyer.
                </p>
                
                <div className="customization-grid">
                  <div className="customization-item">
                    <label className="customization-label">Date</label>
                    <input
                      type="text"
                      value={openHouseDate}
                      onChange={(e) => setOpenHouseDate(e.target.value)}
                      placeholder="December 15th, 2024"
                      className="flyer-input"
                    />
                  </div>
                  
                  <div className="customization-item">
                    <label className="customization-label">Time</label>
                    <input
                      type="text"
                      value={openHouseTime}
                      onChange={(e) => setOpenHouseTime(e.target.value)}
                      placeholder="2:00 PM - 5:00 PM"
                      className="flyer-input"
                    />
                  </div>
                  
                  <div className="customization-item full-width">
                    <label className="customization-label">Property Address</label>
                    <input
                      type="text"
                      value={openHouseAddress}
                      onChange={(e) => setOpenHouseAddress(e.target.value)}
                      placeholder="123 Anywhere St., Any City, ST 12345"
                      className="flyer-input"
                    />
                  </div>
                </div>
              </div>

              {/* Property Photos */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Property Photos (Optional)</h3>
                <div className="photo-upload-area">
                  <label className="photo-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="photo-upload-input"
                    />
                    <div className="photo-upload-content">
                      <span className="photo-upload-icon">📸</span>
                      <span>Add property photos</span>
                      <span className="photo-upload-hint">Select multiple images</span>
                    </div>
                  </label>
                  
                  {propertyPhotos.length > 0 && (
                    <div className="photo-grid">
                      {propertyPhotos.map((photo) => (
                        <div key={photo.id} className="photo-item">
                          <img src={photo.data} alt="Property" />
                          <button 
                            className="remove-photo-btn"
                            onClick={() => removePhoto(photo.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Save Settings Button */}
              <div className="flyer-section">
                <button 
                  onClick={saveAgencyInfo}
                  className="save-settings-btn"
                  type="button"
                  disabled={showSaveConfirmation}
                >
                  {showSaveConfirmation ? (
                    <>
                      <span className="save-checkmark">✓</span>
                      Settings Saved!
                    </>
                  ) : (
                    <>
                      💾 Save Settings for Next Time
                    </>
                  )}
                </button>
                <p className="flyer-section-description">
                  {showSaveConfirmation 
                    ? "Your settings have been saved successfully!" 
                    : "Your agency information and preferences will be automatically filled in next time."
                  }
                </p>
              </div>
            </div>

            <div className="flyer-modal-actions">
              <button className="flyer-modal-btn cancel" onClick={() => setFlyerOpen(false)}>
                Cancel
              </button>
              <button
                className="flyer-modal-btn generate"
                onClick={generateFlyers}
                disabled={flyerBusy || (!flyerTypes.standard && !flyerTypes.openHouse)}
              >
                {flyerBusy ? (
                  <>
                    <span className="loading-spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="generate-icon">✨</span>
                    Generate Flyer
                  </>
                )}
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