import { useEffect, useState } from 'react';

export default function useAgencyInfo(storageKey = 'listgenie_agency_info') {
  const [agencyName, setAgencyName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [agencyLogo, setAgencyLogo] = useState(null);
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [primaryColor, setPrimaryColor] = useState('#2d4a3e');
  const [secondaryColor, setSecondaryColor] = useState('#8b9d83');
  const [fontStyle, setFontStyle] = useState('modern');
  const [showPrice, setShowPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState('$399,900');
  const [openHouseDate, setOpenHouseDate] = useState('');
  const [openHouseTime, setOpenHouseTime] = useState('');
  const [openHouseAddress, setOpenHouseAddress] = useState('');
  const [useSignatureStyling, setUseSignatureStyling] = useState(false);
  const [backgroundPattern, setBackgroundPattern] = useState('none');
  const [propertyDetails, setPropertyDetails] = useState({
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: ''
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

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.agencyName) setAgencyName(parsed.agencyName);
      if (parsed.agentEmail) setAgentEmail(parsed.agentEmail);
      if (parsed.agentPhone) setAgentPhone(parsed.agentPhone);
      if (parsed.websiteLink) setWebsiteLink(parsed.websiteLink);
      if (parsed.officeAddress) setOfficeAddress(parsed.officeAddress);
      if (parsed.agencyLogo) setAgencyLogo(parsed.agencyLogo);
      if (parsed.propertyPhotos) setPropertyPhotos(parsed.propertyPhotos);
      if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
      if (parsed.secondaryColor) setSecondaryColor(parsed.secondaryColor);
      if (parsed.fontStyle) setFontStyle(parsed.fontStyle);
      if (parsed.showPrice !== undefined) setShowPrice(parsed.showPrice);
      if (parsed.customPrice) setCustomPrice(parsed.customPrice);
      if (parsed.openHouseDate) setOpenHouseDate(parsed.openHouseDate);
      if (parsed.openHouseTime) setOpenHouseTime(parsed.openHouseTime);
      if (parsed.openHouseAddress) setOpenHouseAddress(parsed.openHouseAddress);
      if (parsed.useSignatureStyling) setUseSignatureStyling(parsed.useSignatureStyling);
      if (parsed.backgroundPattern) setBackgroundPattern(parsed.backgroundPattern);
      if (parsed.propertyDetails) setPropertyDetails(parsed.propertyDetails);
      if (parsed.propertyHighlights) setPropertyHighlights(parsed.propertyHighlights);
    } catch (e) {
      console.log('Error loading saved agency info:', e);
    }
  }, [storageKey]);

  const saveAgencyInfo = () => {
    const data = {
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
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 2000);
    } catch (e) {
      console.log('Error saving agency info:', e);
    }
  };

  return {
    agencyName, setAgencyName,
    agentEmail, setAgentEmail,
    agentPhone, setAgentPhone,
    websiteLink, setWebsiteLink,
    officeAddress, setOfficeAddress,
    agencyLogo, setAgencyLogo,
    propertyPhotos, setPropertyPhotos,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    fontStyle, setFontStyle,
    showPrice, setShowPrice,
    customPrice, setCustomPrice,
    openHouseDate, setOpenHouseDate,
    openHouseTime, setOpenHouseTime,
    openHouseAddress, setOpenHouseAddress,
    useSignatureStyling, setUseSignatureStyling,
    backgroundPattern, setBackgroundPattern,
    propertyDetails, setPropertyDetails,
    propertyHighlights, setPropertyHighlights,
    showSaveConfirmation,
    saveAgencyInfo
  };
}

