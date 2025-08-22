import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function FlyerModal({ open, onClose, messages, isPro, listing }) {
  const router = useRouter();
  
  // Debug logging
  console.log("🎭 ===== FLYERMODAL RENDER DEBUG =====");
  console.log("🎭 FlyerModal props received:", { open, isPro, listing: listing ? listing.substring(0, 50) : 'NO LISTING', messagesLength: messages?.length });
  console.log("🎭 Modal should be:", open ? 'OPEN' : 'CLOSED');
  console.log("🎭 ===== FLYERMODAL RENDER DEBUG END =====");

  const [flyerTypes, setFlyerTypes] = useState({ standard: true, openHouse: false });
  const [flyerBusy, setFlyerBusy] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [agencyLogo, setAgencyLogo] = useState(null);
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#2d4a3e");
  const [secondaryColor, setSecondaryColor] = useState("#8b9d83");
  const [fontStyle, setFontStyle] = useState("modern");
  const [showPrice, setShowPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState("$399,900");
  const [openHouseDate, setOpenHouseDate] = useState("December 15th, 2024");
  const [openHouseTime, setOpenHouseTime] = useState("2:00 PM - 5:00 PM");
  const [openHouseAddress, setOpenHouseAddress] = useState("123 Anywhere St., Any City, ST 12345");
  const [useSignatureStyling, setUseSignatureStyling] = useState(false);
  const [backgroundPattern, setBackgroundPattern] = useState("none");
  const [propertyDetails, setPropertyDetails] = useState({
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    yearBuilt: "",
  });
  const [propertyHighlights, setPropertyHighlights] = useState({
    highCeilings: false,
    crownMolding: false,
    updatedKitchen: false,
    lushLandscaping: false,
    twoCarGarage: false,
    communityPool: false,
    solarPanels: false,
  });
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const savedAgencyInfo = localStorage.getItem("listgenie_agency_info");
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
        console.log("Error loading saved agency info:", e);
      }
    }
  }, [open]);

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
      propertyHighlights,
    };
    localStorage.setItem("listgenie_agency_info", JSON.stringify(agencyInfo));
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 2000);
  };

  async function generateFlyers() {
    console.log("🎨 ===== GENERATEFLYERS DEBUG START =====");
    console.log("🎨 generateFlyers called with:", { isPro, listing: listing ? listing.substring(0, 100) : 'NO LISTING' });
    
    if (!isPro) {
      console.log("❌ User not Pro, redirecting to upgrade");
      router.push("/upgrade");
      return;
    }

    // Use the listing prop directly
    if (!listing || !listing.trim()) {
      console.log("❌ No listing found, setting error");
      setError("No listing found to generate flyers from. Please generate a listing first.");
      return;
    }

    console.log("✅ Listing found, proceeding with generation");
    console.log("🎨 Starting flyer generation with listing:", listing.substring(0, 100));

    const payload = {
      listing: listing,
      propertyDetails: propertyDetails
    };
    
    console.log("🎨 Payload prepared:", { listingLength: listing.length, propertyDetails });

    try {
      console.log("🎨 ===== API CALL DEBUG START =====");
      setFlyerBusy(true);
      setError("");
      console.log("🎨 Generating AI flyer...");
      console.log("🎨 Making API call to /api/flyer");
      console.log("🎨 Payload being sent:", JSON.stringify(payload, null, 2));
      
      const res = await fetch("/api/flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log("🎨 API response received:", { status: res.status, statusText: res.statusText, ok: res.ok });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.log("❌ API error response:", errorData);
        throw new Error(errorData.error || `Flyer API error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("🎨 API success response:", data);
      
      if (data.success && data.flyer && data.flyer.imageUrl) {
        console.log("✅ Flyer generated successfully!");
        console.log("🎨 Image URL:", data.flyer.imageUrl);
        
        // Open the flyer image in a new tab for viewing/downloading
        console.log("🎨 Opening flyer in new tab...");
        const newWindow = window.open(data.flyer.imageUrl, '_blank');
        if (newWindow) {
          newWindow.focus();
          console.log("✅ New tab opened successfully");
        } else {
          console.log("⚠️ New tab blocked by popup blocker");
        }
        
        // Also trigger download
        console.log("🎨 Triggering download...");
        const a = document.createElement("a");
        a.href = data.flyer.imageUrl;
        a.download = "ai-generated-flyer.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        console.log("✅ Download triggered");
        
        alert("✅ AI flyer generated successfully! Opening in new tab and downloading...");
        
        // Close modal after successful generation
        console.log("🎨 Closing modal...");
        onClose();
      } else {
        console.log("❌ API response missing required data:", data);
        throw new Error(data.error || "Failed to generate flyer");
      }
    } catch (e) {
      console.error("❌ ===== FLYER GENERATION ERROR =====");
      console.error("❌ Error details:", e);
      console.error("❌ Error message:", e?.message);
      console.error("❌ Error stack:", e?.stack);
      const errorMessage = e?.message || e?.error || "Could not generate flyer";
      console.error("❌ Setting error message:", errorMessage);
      setError(errorMessage);
    } finally {
      console.log("🎨 Setting flyerBusy to false");
      setFlyerBusy(false);
      console.log("🎨 ===== API CALL DEBUG END =====");
    }
  }

  function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo file is too large. Please use an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        compressImage(e.target.result, 800, 600, 0.7).then((compressed) => {
          setAgencyLogo(compressed);
          setError("");
        });
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      setError("Total photo size is too large. Please use images under 20MB total.");
      return;
    }
    imageFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`Photo "${file.name}" is too large. Please use images under 5MB each.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        compressImage(e.target.result, 600, 400, 0.6).then((compressed) => {
          setPropertyPhotos((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), data: compressed, name: file.name },
          ]);
          setError("");
        });
      };
      reader.readAsDataURL(file);
    });
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
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  }

  function removePhoto(photoId) {
    setPropertyPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  }

  if (!open) {
    console.log("🎭 Modal not open, returning null");
    return null;
  }
  
  console.log("🎭 Modal is open, rendering content");

  return (
    <div className="flyer-modal">
      <div className="flyer-modal-content">
        <div className="flyer-modal-header">
          <h2 className="flyer-modal-title">🎨 AI Flyer Generator</h2>
          <button className="flyer-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="flyer-modal-body">
          {error && (
            <div className="flyer-error">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          <div className="flyer-section">
            <div className="ai-flyer-hero">
              <div className="ai-flyer-icon">🎨</div>
              <h3 className="ai-flyer-title">AI-Powered Flyer Generation</h3>
              <p className="ai-flyer-description">
                Our AI will automatically create a stunning, professional real estate flyer based on your listing content. 
                No design skills required!
              </p>
            </div>
            
            <div className="ai-flyer-features">
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span>Professional design templates</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Property details automatically extracted</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Optimized for both print and digital sharing</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Generated in seconds</span>
              </div>
            </div>
          </div>

          <div className="flyer-preview-section">
            <div className="preview-info">
              <h4>🔍 Preview Information</h4>
              <p>The AI will analyze your listing and automatically include:</p>
              <ul>
                <li>Property address and key details</li>
                <li>Number of bedrooms and bathrooms</li>
                <li>Square footage and special features</li>
                <li>Professional styling and layout</li>
              </ul>
            </div>
          </div>

          <div className="flyer-modal-actions">
            <button className="flyer-modal-btn cancel" onClick={onClose} disabled={flyerBusy}>
              Cancel
            </button>
            <button
              className="flyer-modal-btn generate"
              onClick={generateFlyers}
              disabled={flyerBusy}
            >
              {flyerBusy ? "🎨 Generating AI Flyer..." : "🚀 Generate AI Flyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
