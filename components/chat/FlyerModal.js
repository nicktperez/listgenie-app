import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function FlyerModal({ open, onClose, messages, isPro }) {
  const router = useRouter();

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
    if (!isPro) {
      router.push("/upgrade");
      return;
    }

    saveAgencyInfo();

    const lastAssistant = [...messages].reverse().find(
      (m) => m.role === "assistant" && m.pretty && m.pretty.includes("**")
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
        showAdvancedOptions,
      },
    };

    try {
      setFlyerBusy(true);
      setError("");
      const res = await fetch("/api/flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Flyer API error: ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.flyers) {
          const downloadedFiles = [];
          for (const [flyerType, htmlContent] of Object.entries(data.flyers)) {
            const filename = flyerType === "standard" ? "property-flyer.html" : "open-house-flyer.html";
            downloadedFiles.push(filename);
            const blob = new Blob([htmlContent], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
            if (downloadedFiles.length < Object.keys(data.flyers).length) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
          alert(`✅ Successfully generated and downloaded: ${downloadedFiles.join(', ')}`);
        } else {
          throw new Error(data.message || "Failed to generate flyers");
        }
      } else if (contentType?.includes("text/html")) {
        const htmlText = await res.text();
        const blob = new Blob([htmlText], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "flyer.html";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
      } else if (contentType?.includes("application/pdf")) {
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
      setError(e?.message || "Could not generate flyers");
    } finally {
      setFlyerBusy(false);
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

  if (!open) return null;

  return (
    <div className="flyer-modal">
      <div className="flyer-modal-content">
        <div className="flyer-modal-header">
          <h2 className="flyer-modal-title">Create Beautiful Flyers</h2>
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
                    value={propertyDetails.bedrooms || ""}
                    onChange={(e) => setPropertyDetails((prev) => ({ ...prev, bedrooms: e.target.value }))}
                    className="flyer-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Bathrooms</label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    value={propertyDetails.bathrooms || ""}
                    onChange={(e) => setPropertyDetails((prev) => ({ ...prev, bathrooms: e.target.value }))}
                    className="flyer-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Square Feet</label>
                  <input
                    type="number"
                    placeholder="e.g., 1650"
                    value={propertyDetails.sqft || ""}
                    onChange={(e) => setPropertyDetails((prev) => ({ ...prev, sqft: e.target.value }))}
                    className="flyer-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Year Built</label>
                  <input
                    type="number"
                    placeholder="e.g., 1998"
                    value={propertyDetails.yearBuilt || ""}
                    onChange={(e) => setPropertyDetails((prev) => ({ ...prev, yearBuilt: e.target.value }))}
                    className="flyer-input"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flyer-section">
              <h3 className="flyer-section-title">Property Highlights (Optional)</h3>
              <p className="flyer-section-description">
                Select key features to showcase on your flyer.
              </p>
              <div className="highlights-grid">
                {Object.entries(propertyHighlights).map(([key, value]) => (
                  <label key={key} className="highlight-option">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setPropertyHighlights((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                    />
                    <span>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flyer-section">
              <h3 className="flyer-section-title">Photos (Optional)</h3>
              <div className="form-group">
                <label>Upload Property Photos</label>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
                <small className="input-hint">Up to 20MB total, 5MB per photo</small>
              </div>
              {propertyPhotos.length > 0 && (
                <div className="photo-preview-grid">
                  {propertyPhotos.map((photo) => (
                    <div key={photo.id} className="photo-preview-item">
                      <img src={photo.data} alt="Property" />
                      <button className="remove-photo" onClick={() => removePhoto(photo.id)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flyer-section">
              <h3 className="flyer-section-title">Agency Logo (Optional)</h3>
              <div className="form-group">
                <label>Upload Logo</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
                <small className="input-hint">Max 5MB, will be resized automatically</small>
              </div>
              {agencyLogo && (
                <div className="logo-preview">
                  <img src={agencyLogo} alt="Logo" />
                </div>
              )}
            </div>

            <div className="flyer-section">
              <h3 className="flyer-section-title">Customization</h3>
              <div className="flyer-form-grid">
                <div className="form-group">
                  <label>Primary Color</label>
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Secondary Color</label>
                  <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Font Style</label>
                  <select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} className="flyer-input">
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="elegant">Elegant</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Background Pattern</label>
                  <select value={backgroundPattern} onChange={(e) => setBackgroundPattern(e.target.value)} className="flyer-input">
                    <option value="none">None</option>
                    <option value="dots">Dots</option>
                    <option value="grid">Grid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Show Price</label>
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                  />
                </div>
                {showPrice && (
                  <div className="form-group">
                    <label>Custom Price</label>
                    <input
                      type="text"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Signature Styling</label>
                  <input
                    type="checkbox"
                    checked={useSignatureStyling}
                    onChange={(e) => setUseSignatureStyling(e.target.checked)}
                  />
                </div>
              </div>
            </div>

            {flyerTypes.openHouse && (
              <div className="flyer-section">
                <h3 className="flyer-section-title">Open House Details</h3>
                <div className="flyer-form-grid">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="text"
                      value={openHouseDate}
                      onChange={(e) => setOpenHouseDate(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="text"
                      value={openHouseTime}
                      onChange={(e) => setOpenHouseTime(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={openHouseAddress}
                      onChange={(e) => setOpenHouseAddress(e.target.value)}
                      className="flyer-input"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flyer-section">
              <button className="save-info-btn" onClick={saveAgencyInfo}>Save Agency Info</button>
              {showSaveConfirmation && (
                <span className="save-confirmation">Saved!</span>
              )}
            </div>
          </div>

          <div className="flyer-modal-actions">
            <button className="flyer-modal-btn cancel" onClick={onClose} disabled={flyerBusy}>
              Cancel
            </button>
            <button
              className="flyer-modal-btn generate"
              onClick={generateFlyers}
              disabled={flyerBusy || (!flyerTypes.standard && !flyerTypes.openHouse)}
            >
              {flyerBusy ? "Generating..." : "Generate Flyers"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
