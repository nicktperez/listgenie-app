export default function FlyerModal({
  open,
  onClose,
  flyerTypes,
  setFlyerTypes,
  generateFlyers,
  busy,
  agencyInfo
}) {
  if (!open) return null;
  const {
    agencyName, setAgencyName,
    agentEmail, setAgentEmail,
    agentPhone, setAgentPhone,
    websiteLink, setWebsiteLink,
    officeAddress, setOfficeAddress,
    showSaveConfirmation,
    saveAgencyInfo
  } = agencyInfo || {};

  return (
    <div className="flyer-modal">
      <div className="flyer-modal-content">
        <div className="flyer-modal-header">
          <h2 className="flyer-modal-title">Create Beautiful Flyers</h2>
          <button className="flyer-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="flyer-section">
          <h3 className="flyer-section-title">Flyer Types</h3>
          <label className="flyer-checkbox">
            <input
              type="checkbox"
              checked={flyerTypes.standard}
              onChange={(e) => setFlyerTypes((s) => ({ ...s, standard: e.target.checked }))}
            />
            Standard Property Flyer
          </label>
          <label className="flyer-checkbox">
            <input
              type="checkbox"
              checked={flyerTypes.openHouse}
              onChange={(e) => setFlyerTypes((s) => ({ ...s, openHouse: e.target.checked }))}
            />
            Open House Flyer
          </label>
        </div>

        <div className="flyer-section">
          <h3 className="flyer-section-title">Agency Details</h3>
          <input
            className="flyer-input"
            placeholder="Agency Name"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
          />
          <input
            className="flyer-input"
            placeholder="Agent Email"
            value={agentEmail}
            onChange={(e) => setAgentEmail(e.target.value)}
          />
          <input
            className="flyer-input"
            placeholder="Agent Phone"
            value={agentPhone}
            onChange={(e) => setAgentPhone(e.target.value)}
          />
          <input
            className="flyer-input"
            placeholder="Website Link"
            value={websiteLink}
            onChange={(e) => setWebsiteLink(e.target.value)}
          />
          <input
            className="flyer-input"
            placeholder="Office Address"
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
          />
          <button className="flyer-modal-btn secondary" onClick={saveAgencyInfo}>
            Save Defaults
          </button>
          {showSaveConfirmation && <div className="save-confirmation">Saved!</div>}
        </div>

        <div className="flyer-modal-actions">
          <button className="flyer-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="flyer-modal-btn primary" onClick={generateFlyers} disabled={busy}>
            {busy ? 'Generating...' : 'Generate Flyer'}
          </button>
        </div>
      </div>
    </div>
  );
}

