// pages/index.js
import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import useUserPlan from "@/hooks/useUserPlan";

function stripFences(s = "") {
  if (!s) return "";
  const lines = s.split("\n");
  const start = lines.findIndex((l) => l.includes("```"));
  if (start === -1) return s;
  const end = lines.findIndex((l, i) => i > start && l.includes("```"));
  if (end === -1) return s;
  return lines.slice(start + 1, end).join("\n");
}

function coerceToReadableText(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (raw.type === "questions") {
    return `I need more information to create your listing. Please answer these questions:\n\n${raw.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  }
  if (raw.type === "listing") {
    return `# ${raw.headline}\n\n## MLS-Ready\n${raw.mls.body}\n\n## Key Features\n${raw.mls.bullets.join("\n")}\n\n## Social Teaser\n${raw.variants.find((v) => v.label === "Social Teaser")?.text || ""}\n\n## Luxury Narrative\n${raw.variants.find((v) => v.label === "Luxury Narrative")?.text || ""}\n\n## Concise Version\n${raw.variants.find((v) => v.label === "Concise Version")?.text || ""}`;
  }
  return JSON.stringify(raw, null, 2);
}

function splitVariants(text) {
  const variants = {};
  const lines = text.split("\n");
  let currentSection = "";
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      if (currentSection && currentContent.length > 0) {
        variants[currentSection] = currentContent.join("\n").trim();
      }
      currentSection = line.substring(2).toLowerCase().replace(/\s+/g, "-");
      currentContent = [];
    } else if (line.startsWith("## ")) {
      if (currentSection && currentContent.length > 0) {
        variants[currentSection] = currentContent.join("\n").trim();
      }
      currentSection = line.substring(3).toLowerCase().replace(/\s+/g, "-");
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    variants[currentSection] = currentContent.join("\n").trim();
  }

  return variants;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

export default function ChatPage() {
  const { isSignedIn, user } = useUser();
  const { isPro, canGenerate, daysLeft, isLoading: planLoading } = useUserPlan();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isListingMode, setIsListingMode] = useState(false);
  const [currentListing, setCurrentListing] = useState(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [questionsData, setQuestionsData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [agencyLogo, setAgencyLogo] = useState("");
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#10B981");
  const [fontStyle, setFontStyle] = useState("modern");
  const [showPrice, setShowPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState("");
  const [openHouseDate, setOpenHouseDate] = useState("");
  const [openHouseTime, setOpenHouseTime] = useState("");
  const [openHouseAddress, setOpenHouseAddress] = useState("");
  const [useSignatureStyling, setUseSignatureStyling] = useState(false);
  const [backgroundPattern, setBackgroundPattern] = useState("none");
  const [propertyDetails, setPropertyDetails] = useState({
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    yearBuilt: ""
  });
  const [propertyHighlights, setPropertyHighlights] = useState({
    highCeilings: false,
    crownMolding: false,
    updatedKitchen: false,
    lushLandscaping: false,
    twoCarGarage: false,
    communityPool: false,
    solarPanels: false
  });
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [isGeneratingFlyers, setIsGeneratingFlyers] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load saved agency info from localStorage
    const savedAgencyInfo = localStorage.getItem("agencyInfo");
    if (savedAgencyInfo) {
      try {
        const parsed = JSON.parse(savedAgencyInfo);
        setAgencyName(parsed.agencyName || "");
        setAgentEmail(parsed.agentEmail || "");
        setAgentPhone(parsed.agentPhone || "");
        setWebsiteLink(parsed.websiteLink || "");
        setOfficeAddress(parsed.officeAddress || "");
        setAgencyLogo(parsed.agencyLogo || "");
        setPropertyDetails(parsed.propertyDetails || {
          bedrooms: "",
          bathrooms: "",
          sqft: "",
          yearBuilt: ""
        });
        setPropertyHighlights(parsed.propertyHighlights || {
          highCeilings: false,
          crownMolding: false,
          updatedKitchen: false,
          lushLandscaping: false,
          twoCarGarage: false,
          communityPool: false,
          solarPanels: false
        });
      } catch (e) {
        console.error("Failed to parse saved agency info:", e);
      }
    }
  }, []);

  const saveAgencyInfo = () => {
    const agencyInfo = {
      agencyName,
      agentEmail,
      agentPhone,
      websiteLink,
      officeAddress,
      agencyLogo,
      propertyDetails,
      propertyHighlights
    };
    localStorage.setItem("agencyInfo", JSON.stringify(agencyInfo));
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 2000);
  };

  async function handleSend() {
    if (!input.trim() || isGenerating) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate listing");
      }

      const data = await response.json();
      const assistantMessage = data.message;

      if (data.parsed?.type === "questions") {
        setQuestionsData(data.parsed);
        setShowQuestionsModal(true);
        setCurrentQuestionIndex(0);
        setQuestionAnswers({});
      } else {
        setCurrentListing(data.parsed);
        setIsListingMode(true);
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  function openFlyerModal() {
    setShowFlyerModal(true);
  }

  function openQuestionsModal(questionsData) {
    setQuestionsData(questionsData);
    setShowQuestionsModal(true);
    setCurrentQuestionIndex(0);
    setQuestionAnswers({});
  }

  async function handleCopyListing(listingText) {
    const success = await copyToClipboard(listingText);
    if (success) {
      // You could add a toast notification here
      console.log("Copied to clipboard");
    }
  }

  async function handleModifyListing(listingText, modificationType) {
    if (!input.trim()) return;

    const modificationPrompt = `Please ${modificationType.toLowerCase()} this listing: ${listingText}\n\nUser request: ${input}`;
    
    const userMessage = { role: "user", content: modificationPrompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to modify listing");
      }

      const data = await response.json();
      const assistantMessage = data.message;

      // Parse the AI response and update the current listing
      if (data.parsed?.type === "listing") {
        setCurrentListing(data.parsed);
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function submitQuestionAnswers() {
    if (currentQuestionIndex < questionsData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return;
    }

    // All questions answered, generate listing
    const allAnswers = Object.values(questionAnswers).join("\n");
    const finalPrompt = `Based on the previous conversation and these additional details: ${allAnswers}\n\nPlease generate a complete listing.`;

    const userMessage = { role: "user", content: finalPrompt };
    setMessages((prev) => [...prev, userMessage]);
    setShowQuestionsModal(false);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate listing");
      }

      const data = await response.json();
      const assistantMessage = data.message;

      if (data.parsed?.type === "listing") {
        setCurrentListing(data.parsed);
        setIsListingMode(true);
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateFlyers() {
    if (!currentListing) return;

    setIsGeneratingFlyers(true);
    try {
      const response = await fetch("/api/flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            standardText: currentListing.mls?.body || "",
            openHouseText: currentListing.variants?.find(v => v.label === "Social Teaser")?.text || ""
          },
          customization: {
            agencyName,
            agentEmail,
            agentPhone,
            websiteLink,
            officeAddress,
            agencyLogo,
            propertyPhotos,
            primaryColor,
            secondaryColor,
            fontStyle,
            showPrice,
            customPrice,
            openHouseDate,
            openHouseTime,
            openHouseAddress,
            useSignatureStyling,
            backgroundPattern,
            propertyDetails,
            propertyHighlights
          },
          flyerTypes: ["standard", "openHouse"]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate flyers");
      }

      const data = await response.json();

      // Download each flyer type separately
      if (data.standard) {
        const blob = new Blob([data.standard], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "property-listing-flyer.html";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      // Add delay between downloads to prevent browser conflicts
      setTimeout(() => {
        if (data.openHouse) {
          const blob = new Blob([data.openHouse], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "open-house-flyer.html";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      }, 500);

      setShowFlyerModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Error generating flyers:", err);
    } finally {
      setIsGeneratingFlyers(false);
    }
  }

  function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        compressImage(dataUrl, 200, 200, 0.8).then((compressed) => {
          setAgencyLogo(compressed);
        });
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const newPhotos = [];
      let processed = 0;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          compressImage(dataUrl, 800, 600, 0.8).then((compressed) => {
            newPhotos.push({
              id: Date.now() + Math.random(),
              dataUrl: compressed
            });
            processed++;
            if (processed === files.length) {
              setPropertyPhotos(prev => [...prev, ...newPhotos]);
            }
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function compressImage(dataUrl, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

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
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.src = dataUrl;
    });
  }

  function removePhoto(photoId) {
    setPropertyPhotos(prev => prev.filter(photo => photo.id !== photoId));
  }

  const colorPalettes = [
    {
      name: "Professional Blue",
      primary: "#3B82F6",
      secondary: "#10B981",
      description: "Classic and trustworthy"
    },
    {
      name: "Luxury Gold",
      primary: "#F59E0B",
      secondary: "#7C3AED",
      description: "Premium and sophisticated"
    },
    {
      name: "Modern Green",
      primary: "#10B981",
      secondary: "#3B82F6",
      description: "Fresh and contemporary"
    },
    {
      name: "Elegant Purple",
      primary: "#8B5CF6",
      secondary: "#EC4899",
      description: "Creative and unique"
    },
    {
      name: "Warm Orange",
      primary: "#F97316",
      secondary: "#06B6D4",
      description: "Friendly and approachable"
    },
    {
      name: "Corporate Gray",
      primary: "#6B7280",
      secondary: "#EF4444",
      description: "Professional and clean"
    }
  ];

  const fontStyles = [
    { value: "modern", label: "Modern (Inter)", description: "Clean and professional" },
    { value: "elegant", label: "Elegant (Playfair Display)", description: "Sophisticated and refined" },
    { value: "script", label: "Script (Great Vibes)", description: "Creative and artistic" },
    { value: "casual", label: "Casual (Comic Sans MS)", description: "Friendly and approachable" },
    { value: "classic", label: "Classic (Georgia)", description: "Traditional and reliable" }
  ];

  const backgroundPatterns = [
    { value: "none", label: "None", description: "Clean solid background" },
    { value: "geometric", label: "Geometric", description: "Modern geometric shapes" },
    { value: "floral", label: "Floral", description: "Elegant floral patterns" },
    { value: "abstract", label: "Abstract", description: "Creative abstract designs" }
  ];

  if (planLoading) {
    return (
      <div className="chat-wrap">
        <div className="loading">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Top Navbar */}
      <nav className="top-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="logo">🏠</div>
            <span className="brand-text">ListGenie.ai</span>
          </div>
          
          <div className="navbar-right">
            <div className="navbar-links">
              <a href="/listings" className="billing-link">Listings</a>
              <a href="/upgrade" className="billing-link">Upgrade</a>
            </div>
            
            <button className="new-listing-btn" onClick={() => {
              setIsListingMode(false);
              setCurrentListing(null);
              setMessages([]);
              setError(null);
            }}>
              New Listing
            </button>
            
            <div className="profile-section">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn">Sign In</button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="chat-wrap">
        {/* AI Chat Section */}
        <div className="ai-chat-section">
          <h1 className="ai-chat-title">AI Listing Generator</h1>
          <p className="ai-chat-subtitle">
            Describe your property and I'll create compelling listings in multiple formats
          </p>

          <div className="composer">
            <div className="composer-inner">
              <div className="input-row">
                <textarea
                  className="chat-textarea"
                  placeholder="Describe your property (e.g., '3 bed, 2 bath ranch with updated kitchen and large yard')"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                />
                <button
                  className="send"
                  onClick={handleSend}
                  disabled={!input.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <div className="thinking">
                      <div className="thinking-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    </div>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-card">
              <div className="error-icon">⚠️</div>
              <div className="error-text">{error}</div>
            </div>
          )}

          {/* Messages */}
          <div className="thread">
            {messages.map((message, index) => (
              <div key={index} className={`msg-card ${message.role}`}>
                <div className="msg-header">
                  {message.role === "user" ? "You" : "ListGenie"}
                </div>
                <div className="msg-body">
                  {message.role === "assistant" && message.content.includes("```") ? (
                    <ListingRender
                      title="Generated Listing"
                      content={stripFences(message.content)}
                      meta={{ tone: "AI Generated" }}
                    />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current Listing Actions */}
          {currentListing && (
            <div className="listing-actions">
              <div className="primary-actions">
                <button
                  className="copy-btn"
                  onClick={() => handleCopyListing(coerceToReadableText(currentListing))}
                >
                  Copy Listing
                </button>
                <button
                  className="flyer-btn-small"
                  onClick={openFlyerModal}
                >
                  Create Flyers
                </button>
              </div>

              <div className="modification-options">
                <div className="modify-title">Modify Listing:</div>
                <div className="modify-buttons">
                  <button
                    className="modify-btn"
                    onClick={() => handleModifyListing(coerceToReadableText(currentListing), "Make Longer")}
                  >
                    Make Longer
                  </button>
                  <button
                    className="modify-btn"
                    onClick={() => handleModifyListing(coerceToReadableText(currentListing), "Make Shorter")}
                  >
                    Make Shorter
                  </button>
                  <button
                    className="modify-btn"
                    onClick={() => handleModifyListing(coerceToReadableText(currentListing), "Make More Professional")}
                  >
                    More Professional
                  </button>
                  <button
                    className="modify-btn"
                    onClick={() => handleModifyListing(coerceToReadableText(currentListing), "Make More Casual")}
                  >
                    More Casual
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Examples Section */}
        {!isListingMode && (
          <div className="examples-section compact">
            <div className="examples-header">
              <h3 className="examples-title">Quick Examples</h3>
            </div>
            <div className="examples-grid">
              <button
                className="example-btn"
                onClick={() => setInput("3 bed, 2 bath ranch in suburbs, updated kitchen, large yard")}
              >
                3 bed, 2 bath ranch
              </button>
              <button
                className="example-btn"
                onClick={() => setInput("Luxury condo with city views, modern amenities, pool and gym")}
              >
                Luxury condo
              </button>
              <button
                className="example-btn"
                onClick={() => setInput("Family home with great schools, finished basement, 2-car garage")}
              >
                Family home
              </button>
              <button
                className="example-btn"
                onClick={() => setInput("Investment property, 4 units, good cash flow, low maintenance")}
              >
                Investment property
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions Modal */}
      {showQuestionsModal && questionsData && (
        <div className="questions-modal">
          <div className="questions-modal-content">
            <div className="questions-modal-header">
              <h3 className="questions-modal-title">Additional Information Needed</h3>
              <button
                className="questions-modal-close"
                onClick={() => setShowQuestionsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="questions-modal-description">
              Please provide the following details to create your listing:
            </div>

            <div className="question-progress">
              Question {currentQuestionIndex + 1} of {questionsData.questions.length}
            </div>

            <div className="current-question">
              <h3>{questionsData.questions[currentQuestionIndex]}</h3>
              <input
                type="text"
                className="question-answer-input"
                placeholder="Enter your answer..."
                value={questionAnswers[currentQuestionIndex] || ""}
                onChange={(e) => setQuestionAnswers(prev => ({
                  ...prev,
                  [currentQuestionIndex]: e.target.value
                }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitQuestionAnswers();
                  }
                }}
              />
            </div>

            <div className="questions-modal-actions">
              <button
                className="questions-modal-btn cancel"
                onClick={() => setShowQuestionsModal(false)}
              >
                Cancel
              </button>
              <button
                className="questions-modal-btn primary"
                onClick={submitQuestionAnswers}
              >
                {currentQuestionIndex < questionsData.questions.length - 1 ? "Next" : "Generate Listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flyer Modal */}
      {showFlyerModal && (
        <div className="flyer-modal">
          <div className="flyer-modal-content">
            <div className="flyer-modal-header">
              <h2 className="flyer-modal-title">Generate Beautiful Flyers</h2>
              <button
                className="flyer-modal-close"
                onClick={() => setShowFlyerModal(false)}
              >
                ×
              </button>
            </div>

            <div className="flyer-modal-body">
              {/* Agency Information */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Agency Information</h3>
                <p className="flyer-section-description">
                  Add your agency details to personalize the flyers
                </p>
                
                <div className="flyer-form-grid">
                  <div className="form-group">
                    <label>Agency Name</label>
                    <input
                      type="text"
                      className="flyer-input"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="Your Agency Name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Agent Email</label>
                    <input
                      type="email"
                      className="flyer-input"
                      value={agentEmail}
                      onChange={(e) => setAgentEmail(e.target.value)}
                      placeholder="your.email@agency.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Agent Phone</label>
                    <input
                      type="tel"
                      className="flyer-input"
                      value={agentPhone}
                      onChange={(e) => setAgentPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Listing Website Link</label>
                    <input
                      type="url"
                      className="flyer-input"
                      value={websiteLink}
                      onChange={(e) => setWebsiteLink(e.target.value)}
                      placeholder="https://your-listing-url.com"
                    />
                    <div className="input-hint">This will be displayed prominently on the flyer</div>
                  </div>
                  
                  <div className="form-group">
                    <label>Office Address</label>
                    <input
                      type="text"
                      className="flyer-input"
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Property Details</h3>
                <p className="flyer-section-description">
                  Specify property specifications for the flyer
                </p>
                
                <div className="flyer-form-grid">
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input
                      type="number"
                      className="flyer-input"
                      value={propertyDetails.bedrooms}
                      onChange={(e) => setPropertyDetails(prev => ({
                        ...prev,
                        bedrooms: e.target.value
                      }))}
                      placeholder="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input
                      type="number"
                      className="flyer-input"
                      value={propertyDetails.bathrooms}
                      onChange={(e) => setPropertyDetails(prev => ({
                        ...prev,
                        bathrooms: e.target.value
                      }))}
                      placeholder="2"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Square Feet</label>
                    <input
                      type="number"
                      className="flyer-input"
                      value={propertyDetails.sqft}
                      onChange={(e) => setPropertyDetails(prev => ({
                        ...prev,
                        sqft: e.target.value
                      }))}
                      placeholder="1850"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Year Built</label>
                    <input
                      type="number"
                      className="flyer-input"
                      value={propertyDetails.yearBuilt}
                      onChange={(e) => setPropertyDetails(prev => ({
                        ...prev,
                        yearBuilt: e.target.value
                      }))}
                      placeholder="1995"
                    />
                  </div>
                </div>
              </div>

              {/* Property Highlights */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Property Highlights (Optional)</h3>
                <p className="flyer-section-description">
                  Select which features to highlight on the flyer
                </p>
                
                <div className="highlights-grid">
                  <div className="highlight-item">
                    <label className="highlight-checkbox">
                      <input
                        type="checkbox"
                        checked={propertyHighlights.highCeilings}
                        onChange={(e) => setPropertyHighlights(prev => ({
                          ...prev,
                          highCeilings: e.target.checked
                        }))}
                      />
                      <span className="highlight-label">High Ceilings</span>
                    </label>
                  </div>
                  
                  <div className="highlight-item">
                    <label className="highlight-checkbox">
                      <input
                        type="checkbox"
                        checked={propertyHighlights.crownMolding}
                        onChange={(e) => setPropertyHighlights(prev => ({
                          ...prev,
                          crownMolding: e.target.checked
                        }))}
                      />
                      <span className="highlight-label">Crown Molding</span>
                    </label>
                  </div>
                  
                  <div className="highlight-item">
                    <label className="highlight-checkbox">
                      <input
                        type="checkbox"
                        checked={propertyHighlights.updatedKitchen}
                        onChange={(e) => setPropertyHighlights(prev => ({
                          ...prev,
                          updatedKitchen: e.target.checked
                        }))}
                      />
                      <span className="highlight-label">Updated Kitchen</span>
                    </label>
                  </div>
                  
                  <div className="highlight-item">
                    <label className="highlight-checkbox">
                      <input
                        type="checkbox"
                        checked={propertyHighlights.lushLandscaping}
                        onChange={(e) => setPropertyHighlights(prev => ({
                          ...prev,
                          lushLandscaping: e.target.checked
                        }))}
                      />
                      <span className="highlight-label">Lush Landscaping</span>
                    </label>
                  </div>
                  
                  <div className="highlight-item">
                    <label className="highlight-checkbox">
                      <input
                        type="checkbox"
                        checked={propertyHighlights.twoCarGarage}
                        onChange={(e) => setPropertyHighlights(prev => ({
                          ...prev,
                          twoCarGarage: e.target.checked
                        }))}
                      />
                      <span className="highlight-label">2-Car Garage</span>
                    </label>
                  </div>
                  
                  <div className="highlight-item">
                    <label className="highlight-checkbox">
                      <input
                        type="checkbox"
                        checked={propertyHighlights.communityPool}
                        onChange={(e) => setPropertyHighlights(prev => ({
                          ...prev,
                          communityPool: e.target.checked
                        }))}
                      />
                      <span className="highlight-label">Community Pool</span>
                    </label>
                  </div>
                  
                  <div className="highlight-item">
                    <label className="highlight-checkbox">
                      <input
                        type="checkbox"
                        checked={propertyHighlights.solarPanels}
                        onChange={(e) => setPropertyHighlights(prev => ({
                          ...prev,
                          solarPanels: e.target.checked
                        }))}
                      />
                      <span className="highlight-label">Solar Panels</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Open House Details */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Open House Details (Optional)</h3>
                <p className="flyer-section-description">
                  Add open house information for the open house flyer
                </p>
                
                <div className="flyer-form-grid">
                  <div className="form-group">
                    <label>Open House Date</label>
                    <input
                      type="date"
                      className="flyer-input"
                      value={openHouseDate}
                      onChange={(e) => setOpenHouseDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Open House Time</label>
                    <input
                      type="time"
                      className="flyer-input"
                      value={openHouseTime}
                      onChange={(e) => setOpenHouseTime(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Open House Address</label>
                    <input
                      type="text"
                      className="flyer-input"
                      value={openHouseAddress}
                      onChange={(e) => setOpenHouseAddress(e.target.value)}
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>
                </div>
              </div>

              {/* Customization */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Customization</h3>
                <p className="flyer-section-description">
                  Personalize the look and feel of your flyers
                </p>
                
                <div className="customization-grid">
                  <div className="customization-item full-width">
                    <label className="customization-label">Color Scheme</label>
                    <div className="customization-description">
                      Choose from our curated professional color palettes
                    </div>
                    
                    <div className="current-theme-display">
                      <div className="current-theme-label">Current Theme:</div>
                      <div className="current-theme-name">
                        {colorPalettes.find(p => p.primary === primaryColor && p.secondary === secondaryColor)?.name || "Custom"}
                      </div>
                    </div>
                    
                    <div className="color-palettes">
                      {colorPalettes.map((palette) => (
                        <div
                          key={palette.name}
                          className={`color-palette ${palette.primary === primaryColor && palette.secondary === secondaryColor ? 'active' : ''}`}
                          onClick={() => {
                            setPrimaryColor(palette.primary);
                            setSecondaryColor(palette.secondary);
                          }}
                        >
                          <div className="palette-preview">
                            <div className="palette-primary" style={{ backgroundColor: palette.primary }}></div>
                            <div className="palette-secondary" style={{ backgroundColor: palette.secondary }}></div>
                          </div>
                          <div className="palette-info">
                            <div className="palette-name">{palette.name}</div>
                            <div className="palette-description">{palette.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="customization-item">
                    <label className="customization-label">Font Style</label>
                    <select
                      className="font-select"
                      value={fontStyle}
                      onChange={(e) => setFontStyle(e.target.value)}
                    >
                      {fontStyles.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="customization-item">
                    <label className="customization-label">Background Pattern</label>
                    <select
                      className="font-select"
                      value={backgroundPattern}
                      onChange={(e) => setBackgroundPattern(e.target.value)}
                    >
                      {backgroundPatterns.map((pattern) => (
                        <option key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="customization-item">
                    <label className="customization-label">Show Price</label>
                    <div className="toggle-container">
                      <input
                        type="checkbox"
                        className="toggle-checkbox"
                        id="showPrice"
                        checked={showPrice}
                        onChange={(e) => setShowPrice(e.target.checked)}
                      />
                      <label className="toggle-label" htmlFor="showPrice"></label>
                    </div>
                    <div className="toggle-description">
                      Include price information on the flyer
                    </div>
                  </div>
                  
                  {showPrice && (
                    <div className="customization-item">
                      <label className="customization-label">Custom Price</label>
                      <input
                        type="text"
                        className="price-input"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="$599,000"
                      />
                    </div>
                  )}
                  
                  <div className="customization-item">
                    <label className="customization-label">Signature Styling</label>
                    <div className="toggle-container">
                      <input
                        type="checkbox"
                        className="toggle-checkbox"
                        id="useSignatureStyling"
                        checked={useSignatureStyling}
                        onChange={(e) => setUseSignatureStyling(e.target.checked)}
                      />
                      <label className="toggle-label" htmlFor="useSignatureStyling"></label>
                    </div>
                    <div className="toggle-description">
                      Use elegant script fonts for headings
                    </div>
                  </div>
                </div>
              </div>

              {/* Agency Logo */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Agency Logo (Optional)</h3>
                <p className="flyer-section-description">
                  Upload your agency logo to include on the flyers
                </p>
                
                <div className="logo-upload-area">
                  <label className="logo-upload-label">
                    <input
                      type="file"
                      className="logo-upload-input"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <div className="logo-upload-content">
                      <div className="logo-upload-icon">📁</div>
                      <div>Click to upload logo</div>
                    </div>
                  </label>
                  <div className="logo-upload-hint">
                    Recommended: 200x200px, PNG or JPG
                  </div>
                </div>
                
                {agencyLogo && (
                  <div className="logo-preview">
                    <img src={agencyLogo} alt="Agency Logo" />
                    <button
                      className="remove-logo-btn"
                      onClick={() => setAgencyLogo("")}
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
              </div>

              {/* Property Photos */}
              <div className="flyer-section">
                <h3 className="flyer-section-title">Property Photos (Optional)</h3>
                <p className="flyer-section-description">
                  Upload photos of the property to include on the flyers
                </p>
                
                <div className="photo-upload-area">
                  <label className="photo-upload-label">
                    <input
                      type="file"
                      className="photo-upload-input"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                    />
                    <div className="photo-upload-content">
                      <div className="photo-upload-icon">📸</div>
                      <div>Click to upload photos</div>
                    </div>
                  </label>
                  <div className="photo-upload-hint">
                    Upload up to 3 photos. Recommended: 800x600px, JPG
                  </div>
                </div>
                
                {propertyPhotos.length > 0 && (
                  <div className="photo-grid">
                    {propertyPhotos.map((photo) => (
                      <div key={photo.id} className="photo-item">
                        <img src={photo.dataUrl} alt="Property" />
                        <button
                          className="remove-photo-btn"
                          onClick={() => removePhoto(photo.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Settings */}
              <div className="flyer-section">
                <button
                  className="save-settings-btn"
                  onClick={saveAgencyInfo}
                >
                  {showSaveConfirmation ? (
                    <span className="save-checkmark">✓ Saved!</span>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </div>

            <div className="flyer-modal-actions">
              <button
                className="flyer-modal-btn cancel"
                onClick={() => setShowFlyerModal(false)}
              >
                Cancel
              </button>
              <button
                className="flyer-modal-btn generate"
                onClick={generateFlyers}
                disabled={isGeneratingFlyers}
              >
                {isGeneratingFlyers ? (
                  <>
                    <div className="loading-spinner"></div>
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

      <div ref={messagesEndRef} />
    </div>
  );
}

function TonePill({ value, label, current, onChange }) {
  return (
    <button
      className={`tone-pill ${current === value ? "active" : ""}`}
      onClick={() => onChange(value)}
    >
      {label}
    </button>
  );
}

function displayName(key) {
  return key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function ThinkingDots() {
  return (
    <div className="thinking">
      <div className="thinking-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <div className="thinking-label">Generating...</div>
    </div>
  );
}