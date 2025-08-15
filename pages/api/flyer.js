// pages/api/flyer.js
// Generates beautiful, professional HTML flyers with agency branding, photos, and QR codes

import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Increased for photos
    },
  },
};

function createHtmlFlyer({ standardText, openHouseText, customization, pageType }) {
  const isOpenHouse = pageType === "openHouse";
  
  // Debug logging
  console.log("Creating flyer with customization:", {
    propertyPhotos: customization.propertyPhotos,
    agencyLogo: customization.agencyLogo,
    primaryColor: customization.primaryColor,
    fontStyle: customization.fontStyle
  });
  
  // Get customization values with defaults
  const primaryColor = customization.primaryColor || "#2d4a3e";
  const secondaryColor = customization.secondaryColor || "#8b9d83";
  const fontStyle = customization.fontStyle || "modern";
  const showPrice = customization.showPrice !== false; // Default to true
  const customPrice = customization.customPrice || "$399,900";
  const useSignatureStyling = customization.useSignatureStyling || false;
  
  // Background pattern option
  const backgroundPattern = customization.backgroundPattern || "none";
  
  // Open house details
  const openHouseDate = customization.openHouseDate || "December 15th, 2024";
  const openHouseTime = customization.openHouseTime || "2:00 PM - 5:00 PM";
  const openHouseAddress = customization.openHouseAddress || "123 Anywhere St., Any City, ST 12345";
  
  // Font family mapping
  const getFontFamily = (style) => {
    switch (style) {
      case "elegant":
        return "'Playfair Display', serif";
      case "playful":
        return "'Comic Sans MS', cursive";
      case "professional":
        return "'Georgia', serif";
      case "modern":
      default:
        return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    }
  };
  
  // Generate CSS custom properties for dynamic colors and background patterns
  const generateDynamicCSS = () => {
    // Create lighter/darker variations of the primary color
    const primaryLight = adjustColor(primaryColor, 20);
    const primaryDark = adjustColor(primaryColor, -20);
    const secondaryLight = adjustColor(secondaryColor, 15);
    
    // Generate background pattern CSS
    const getBackgroundPattern = () => {
      switch (backgroundPattern) {
        case "checkerboard":
          return `
            background-image: 
              linear-gradient(45deg, var(--primary-light) 25%, transparent 25%),
              linear-gradient(-45deg, var(--primary-light) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, var(--primary-light) 75%),
              linear-gradient(-45deg, transparent 75%, var(--primary-light) 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          `;
        case "floral":
          return `
            background-image: 
              radial-gradient(circle at 20% 80%, var(--secondary) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, var(--secondary-light) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, var(--primary-light) 0%, transparent 50%);
            background-size: 60px 60px, 40px 40px, 80px 80px;
            background-position: 0 0, 30px 30px, 15px 15px;
          `;
        case "geometric":
          return `
            background-image: 
              linear-gradient(30deg, var(--primary-light) 12%, transparent 12.5%, transparent 87%, var(--primary-light) 87.5%, var(--primary-light)),
              linear-gradient(150deg, var(--secondary) 12%, transparent 12.5%, transparent 87%, var(--secondary) 87.5%, var(--secondary)),
              linear-gradient(30deg, var(--primary-light) 12%, transparent 12.5%, transparent 87%, var(--primary-light) 87.5%, var(--primary-light)),
              linear-gradient(150deg, var(--secondary) 12%, transparent 12.5%, transparent 87%, var(--secondary) 87.5%, var(--secondary)),
              linear-gradient(60deg, var(--secondary-light) 25%, transparent 25.5%, transparent 75%, var(--secondary-light) 75%, var(--secondary-light)),
              linear-gradient(60deg, var(--secondary-light) 25%, transparent 25.5%, transparent 75%, var(--secondary-light) 75%, var(--secondary-light));
            background-size: 40px 70px, 40px 70px, 40px 70px, 40px 70px, 70px 40px, 70px 40px;
            background-position: 0 0, 0 0, 20px 35px, 20px 35px, 0 0, 35px 20px;
          `;
        case "dots":
          return `
            background-image: radial-gradient(circle, var(--secondary) 1px, transparent 1px);
            background-size: 20px 20px;
          `;
        case "stripes":
          return `
            background-image: 
              linear-gradient(45deg, var(--primary-light) 25%, transparent 25%),
              linear-gradient(-45deg, var(--primary-light) 25%, transparent 25%);
            background-size: 30px 30px;
            background-position: 0 0, 15px 15px;
          `;
        default:
          return '';
      }
    };
    
    return `
      :root {
        --primary: ${primaryColor};
        --primary-light: ${primaryLight};
        --primary-dark: ${primaryDark};
        --secondary: ${secondaryColor};
        --secondary-light: ${secondaryLight};
        --text-on-primary: ${getContrastColor(primaryColor)};
        --text-on-secondary: ${getContrastColor(secondaryColor)};
      }
      
      .pattern-background {
        ${getBackgroundPattern()}
      }
    `;
  };
  
  // Helper function to adjust color brightness
  const adjustColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };
  
  // Helper function to determine text color based on background
  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };
  
  // Create a beautiful HTML template with dynamic customization
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isOpenHouse ? 'Open House Flyer' : 'Property Flyer'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Great+Vibes:wght@400&family=Dancing+Script:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${generateDynamicCSS()}
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${getFontFamily(fontStyle)};
            line-height: 1.6;
            color: var(--text-on-primary);
            background: var(--primary);
            font-weight: 400;
        }
        
        .flyer-container {
            max-width: 900px;
            margin: 20px auto;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, var(--primary) 100%);
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            border-radius: 0;
            overflow: hidden;
            position: relative;
        }
        
        .flyer-container.pattern-background {
            ${backgroundPattern !== "none" ? `background: var(--primary);` : ''}
        }
        
        /* Property Header */
        .property-header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: var(--text-on-primary);
            padding: 30px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }
        
        .header-agency-logo {
            width: 60px;
            height: 60px;
            border-radius: 10px;
            overflow: hidden;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border: 2px solid var(--secondary);
            flex-shrink: 0;
        }
        
        .header-agency-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 6px;
        }
        
        .header-content {
            flex: 1;
            text-align: center;
            margin: 0 20px;
        }
        
        .header-title {
            font-family: ${useSignatureStyling ? "'Great Vibes', cursive" : "'Playfair Display', serif"};
            font-size: ${useSignatureStyling ? '2.5rem' : '2.2rem'};
            font-weight: ${useSignatureStyling ? '400' : '600'};
            margin-bottom: 8px;
            line-height: 1.1;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            ${useSignatureStyling ? 'letter-spacing: 0.05em;' : ''}
        }
        
        .header-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            opacity: 0.8;
            font-weight: 400;
        }
        
        /* Main Content Section - Two Column Layout */
        .main-content {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 0;
            min-height: 600px;
            background: var(--primary);
        }
        
        /* Left Column - Photos */
        .left-column {
            padding: 30px 20px;
            background: linear-gradient(180deg, var(--primary) 0%, var(--primary-light) 100%);
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .left-column.pattern-background {
            ${backgroundPattern !== "none" ? `background: var(--primary);` : ''}
        }
        
        .photo-item {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            border: 2px solid var(--secondary);
            transition: transform 0.3s ease;
            background: linear-gradient(135deg, var(--primary-light) 0%, var(--secondary) 100%);
        }
        
        .photo-item:hover {
            transform: translateY(-3px);
        }
        
        .photo-item img {
            width: 100%;
            height: 180px;
            object-fit: cover;
            border-radius: 12px;
        }
        
        .photo-caption {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.7));
            color: white;
            padding: 20px 15px 15px 15px;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
            border-radius: 0 0 12px 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .photo-item:hover .photo-caption {
            opacity: 1;
        }
        
        /* Right Column - Content */
        .right-column {
            padding: 40px 35px;
            background: linear-gradient(135deg, var(--primary-light) 0%, var(--secondary) 20%, var(--primary-light) 100%);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        
        .right-column.pattern-background {
            ${backgroundPattern !== "none" ? `background: var(--primary-light);` : ''}
        }
        
        /* Typography and Content */
        .flyer-title {
            font-family: ${useSignatureStyling ? "'Great Vibes', cursive" : (fontStyle === "elegant" ? "'Playfair Display', serif" : getFontFamily(fontStyle))};
            font-size: ${useSignatureStyling ? '4rem' : '3.5rem'};
            font-weight: ${useSignatureStyling ? '400' : '700'};
            color: var(--text-on-primary);
            margin-bottom: 15px;
            line-height: 1.1;
            text-shadow: ${useSignatureStyling ? '3px 3px 6px rgba(0,0,0,0.4)' : '2px 2px 4px rgba(0,0,0,0.3)'};
            ${useSignatureStyling ? 'letter-spacing: 0.05em;' : ''}
        }
        
        .event-details {
            margin-bottom: 25px;
        }
        
        .event-detail {
            font-size: 1.2rem;
            color: var(--text-on-primary);
            margin-bottom: 8px;
            font-weight: 400;
            ${useSignatureStyling ? 'font-family: "Dancing Script", cursive; font-size: 1.4rem;' : ''}
        }
        
        .price-section {
            margin-bottom: 30px;
            ${!showPrice ? 'display: none;' : ''}
        }
        
        .price-label {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-on-primary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            ${useSignatureStyling ? 'font-family: "Dancing Script", cursive; font-size: 1.3rem;' : ''}
        }
        
        .price-amount {
            font-family: ${useSignatureStyling ? "'Great Vibes', cursive" : 'inherit'};
            font-size: ${useSignatureStyling ? '3.5rem' : '3rem'};
            font-weight: ${useSignatureStyling ? '400' : '700'};
            color: var(--text-on-primary);
            line-height: 1;
            text-shadow: ${useSignatureStyling ? '3px 3px 6px rgba(0,0,0,0.4)' : '2px 2px 4px rgba(0,0,0,0.3)'};
            ${useSignatureStyling ? 'letter-spacing: 0.02em;' : ''}
        }
        
        .about-section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--text-on-primary);
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            ${useSignatureStyling ? 'font-family: "Dancing Script", cursive; font-size: 1.5rem; text-transform: none;' : ''}
        }
        
        .property-description {
            font-size: 1.1rem;
            color: var(--text-on-primary);
            line-height: 1.7;
            margin-bottom: 20px;
            ${useSignatureStyling ? 'font-family: "Dancing Script", cursive; font-size: 1.2rem;' : ''}
        }
        
        .features-section {
            margin-bottom: 25px;
        }
        
        /* Property Details Grid */
        .property-details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            padding: 25px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.3s ease;
        }
        
        .detail-item:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        .detail-icon {
            font-size: 1.8rem;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-on-secondary);
            flex-shrink: 0;
        }
        
        .detail-content {
            flex: 1;
        }
        
        .detail-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-on-primary);
            line-height: 1;
            margin-bottom: 4px;
            ${useSignatureStyling ? 'font-family: "Great Vibes", cursive; font-size: 1.8rem;' : ''}
        }
        
        .detail-label {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }
        
        /* Enhanced Features Grid */
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px 15px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .feature-card:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            border-color: var(--secondary);
        }
        
        .feature-card .feature-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 12px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--secondary);
        }
        
        .feature-card .feature-icon svg {
            width: 100%;
            height: 100%;
        }
        
        .feature-card .feature-text {
            font-size: 0.9rem;
            color: var(--text-on-primary);
            font-weight: 500;
            line-height: 1.3;
        }
        
        /* CTA Section */
        .cta-section {
            text-align: center;
            margin-top: 35px;
            padding: 30px;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%);
            border-radius: 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .cta-button {
            background: var(--primary);
            color: white;
            padding: 18px 36px;
            border-radius: 50px;
            font-family: 'Inter', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            border: 2px solid var(--primary);
        }
        
        .cta-button:hover {
            background: white;
            color: var(--primary);
            transform: translateY(-3px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        
        /* Open House Special Styling - Clean & Simple */
        .open-house-header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 0;
        }
        
        .open-house-title-section {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .open-house-main-title {
            font-family: ${useSignatureStyling ? "'Great Vibes', cursive" : "'Playfair Display', serif"};
            font-size: ${useSignatureStyling ? '3.5rem' : '3rem'};
            font-weight: ${useSignatureStyling ? '400' : '300'};
            margin-bottom: 15px;
            line-height: 1.1;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            ${useSignatureStyling ? 'letter-spacing: 0.05em;' : ''}
        }
        
        .open-house-date-info {
            font-family: 'Inter', sans-serif;
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .open-house-location {
            font-family: 'Inter', sans-serif;
            font-size: 1.1rem;
            opacity: 0.8;
        }
        
        .open-house-content-section {
            padding: 40px 20px;
        }
        
        .open-house-description-section {
            margin-bottom: 30px;
        }
        
        .open-house-features-section {
            margin-bottom: 30px;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .feature-item {
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 12px;
            text-align: center;
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            font-weight: 500;
            color: #333;
            border: 1px solid #e9ecef;
            transition: all 0.3s ease;
        }
        
        .feature-item:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .open-house-cta-section {
            text-align: center;
            margin-top: 30px;
        }
        
        .open-house-cta {
            background: var(--primary);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-family: 'Inter', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            border: 2px solid var(--primary);
        }
        
        .open-house-cta:hover {
            background: white;
            color: var(--primary);
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        
        /* Website Link Styling */
        .listing-website-section {
            margin-top: 20px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .website-label {
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .listing-website-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--secondary);
            text-decoration: none;
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            font-weight: 500;
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        
        .listing-website-link:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-dark) 100%);
            color: var(--text-on-primary);
            padding: 30px 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 25px;
            align-items: center;
            border-top: 3px solid var(--secondary);
        }
        
        .footer-logo {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            border: 2px solid var(--secondary);
            grid-column: 1 / -1;
            justify-self: center;
            margin-bottom: 15px;
        }
        
        .footer-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 6px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1rem;
            font-weight: 500;
            ${useSignatureStyling ? 'font-family: "Dancing Script", cursive; font-size: 1.1rem;' : ''}
        }
        
        .contact-icon {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            color: var(--text-on-secondary);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .left-column, .right-column {
                padding: 25px 20px;
            }
            
            .property-header {
                padding: 20px 15px;
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            
            .header-agency-logo {
                width: 50px;
                height: 50px;
            }
            
            .header-title {
                font-size: ${useSignatureStyling ? '2rem' : '1.8rem'};
            }
            
            .header-subtitle {
                font-size: 0.9rem;
            }
            
            .flyer-title {
                font-size: ${useSignatureStyling ? '3rem' : '2.5rem'};
            }
            
            .price-amount {
                font-size: ${useSignatureStyling ? '2.8rem' : '2.2rem'};
            }
            
            .footer {
                grid-template-columns: 1fr;
                text-align: center;
            }
            
            /* Property Details Grid Mobile */
            .property-details-grid {
                grid-template-columns: 1fr;
                gap: 15px;
                padding: 20px;
            }
            
            .detail-item {
                padding: 12px;
            }
            
            .detail-icon {
                width: 40px;
                height: 40px;
                font-size: 1.5rem;
            }
            
            .detail-value {
                font-size: 1.3rem;
            }
            
            /* Features Grid Mobile */
            .features-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            .feature-card {
                padding: 15px 10px;
            }
            
            .feature-card .feature-icon {
                width: 40px;
                height: 40px;
                margin-bottom: 8px;
            }
            
            .feature-card .feature-text {
                font-size: 0.8rem;
            }
            
            /* CTA Section Mobile */
            .cta-section {
                padding: 25px 20px;
            }
            
            .cta-button {
                padding: 15px 30px;
                font-size: 1rem;
            }
            
            /* Open House Mobile Styles */
            .open-house-header {
                padding: 30px 15px;
            }
            
            .open-house-main-title {
                font-size: ${useSignatureStyling ? '2.8rem' : '2.5rem'};
            }
            
            .open-house-date-info {
                font-size: 1.1rem;
            }
            
            .open-house-location {
                font-size: 1rem;
            }
            
            .open-house-content-section {
                padding: 30px 15px;
            }
            
            .listing-website-section {
                padding: 15px;
            }
        }
        
        @media print {
            body { background: var(--primary); }
            .flyer-container { 
                margin: 0; 
                box-shadow: none;
                border-radius: 0;
            }
            .property-header { padding: 20px 15px; }
            .open-house-header { padding: 30px 15px; }
        }
    </style>
</head>
<body>
    <div class="flyer-container ${backgroundPattern !== "none" ? 'pattern-background' : ''}">
        <!-- Standard Property Header (if applicable) -->
        ${!isOpenHouse ? `
        <div class="property-header">
            ${customization.agencyLogo ? `
            <div class="header-agency-logo">
                <img src="${customization.agencyLogo.data || customization.agencyLogo.src || customization.agencyLogo}" alt="Agency Logo" onerror="this.parentElement.style.display='none';" />
            </div>
            ` : ''}
            <div class="header-content">
                <h1 class="header-title">Property Listing</h1>
                <div class="header-subtitle">Professional Real Estate Marketing</div>
            </div>
        </div>
        ` : ''}
        
        <!-- Open House Header (if applicable) -->
        ${isOpenHouse ? `
        <div class="open-house-header">
            <div class="open-house-title-section">
                <h1 class="open-house-main-title">Open House</h1>
                <div class="open-house-date-info">${openHouseDate} • ${openHouseTime}</div>
                <div class="open-house-location">${openHouseAddress}</div>
            </div>
        </div>
        ` : ''}
        
        <!-- Main Content Section -->
        <div class="main-content">
            <!-- Left Column - Photos -->
            <div class="left-column ${backgroundPattern !== "none" ? 'pattern-background' : ''}">
                ${customization.propertyPhotos && customization.propertyPhotos.length > 0 ? 
                    customization.propertyPhotos.slice(0, 3).map((photo, index) => `
                        <div class="photo-item">
                            <img src="${photo.data || photo.src || photo}" alt="Property Photo ${index + 1}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                            <div class="photo-caption">${index === 0 ? 'Main Living Area' : index === 1 ? 'Kitchen & Dining' : 'Master Suite'}</div>
                            <div style="height: 180px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--secondary); border: 2px solid var(--secondary); border-radius: 12px; display: none;">
                                <div style="text-align: center;">
                                    <div style="font-size: 2rem; margin-bottom: 8px;">📷</div>
                                    <div style="font-size: 0.9rem;">${index === 0 ? 'Main Living Area' : index === 1 ? 'Kitchen & Dining' : 'Master Suite'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('') : 
                    Array(3).fill().map((_, index) => `
                        <div class="photo-item">
                            <div style="height: 180px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--secondary); border: 2px solid var(--secondary); border-radius: 12px;">
                                <div style="text-align: center;">
                                    <div style="font-size: 2rem; margin-bottom: 8px;">📷</div>
                                    <div style="font-size: 0.9rem;">${index === 0 ? 'Main Living Area' : index === 1 ? 'Kitchen & Dining' : 'Master Suite'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
            
            <!-- Right Column - Content -->
            <div class="right-column ${backgroundPattern !== "none" ? 'pattern-background' : ''}">
                ${!isOpenHouse ? `
                <h1 class="flyer-title">Property Flyer</h1>
                
                ${showPrice ? `
                <div class="price-section">
                    <div class="price-label">Offered At</div>
                    <div class="price-amount">${customPrice}</div>
                </div>
                ` : ''}
                
                ${customization.propertyDetails && (customization.propertyDetails.bedrooms || customization.propertyDetails.bathrooms || customization.propertyDetails.sqft || customization.propertyDetails.yearBuilt) ? `
                <div class="property-details-grid">
                    ${customization.propertyDetails.bedrooms ? `
                    <div class="detail-item">
                        <div class="detail-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 12H7v-1c0-1.1.9-2 2-2s2 .9 2 2v1h4v-1c0-1.1.9-2 2-2s2 .9 2 2v1z"/>
                            </svg>
                        </div>
                        <div class="detail-content">
                            <div class="detail-value">${customization.propertyDetails.bedrooms}</div>
                            <div class="detail-label">Bedrooms</div>
                        </div>
                    </div>
                    ` : ''}
                    ${customization.propertyDetails.bathrooms ? `
                    <div class="detail-item">
                        <div class="detail-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                        </div>
                        <div class="detail-content">
                            <div class="detail-value">${customization.propertyDetails.bathrooms}</div>
                            <div class="detail-label">Bathrooms</div>
                        </div>
                    </div>
                    ` : ''}
                    ${customization.propertyDetails.sqft ? `
                    <div class="detail-item">
                        <div class="detail-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                            </svg>
                        </div>
                        <div class="detail-content">
                            <div class="detail-value">${customization.propertyDetails.sqft}</div>
                            <div class="detail-label">Sq. Ft.</div>
                        </div>
                    </div>
                    ` : ''}
                    ${customization.propertyDetails.yearBuilt ? `
                    <div class="detail-item">
                        <div class="detail-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                        </div>
                        <div class="detail-content">
                            <div class="detail-value">${customization.propertyDetails.yearBuilt}</div>
                            <div class="detail-label">Year Built</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="about-section">
                    <div class="section-title">About This Property</div>
                    <div class="property-description">
                        Come and see this beautiful house with so much to offer! This house has high ceilings, crown and base molding, and upgraded tile flooring. It has lush landscaping with a variety of trees and gorgeous lawns. Book an appointment today!
                        
                        ${customization.websiteLink ? `
                        <div class="listing-website-section">
                            <div class="website-label">View Full Listing:</div>
                            <a href="${customization.websiteLink.startsWith('http') ? customization.websiteLink : 'https://' + customization.websiteLink}" 
                               target="_blank" 
                               class="listing-website-link">
                                🌐 ${customization.websiteLink}
                            </a>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                ${customization.propertyHighlights && Object.values(customization.propertyHighlights).some(Boolean) ? `
                <div class="features-section">
                    <div class="section-title">Property Highlights</div>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                                </svg>
                            </div>
                            <div class="feature-text">High Ceilings</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                            </div>
                            <div class="feature-text">Crown Molding</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                                </svg>
                            </div>
                            <div class="feature-text">Updated Kitchen</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25z"/>
                                </svg>
                            </div>
                            <div class="feature-text">Lush Landscaping</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                                </svg>
                            </div>
                            <div class="feature-text">2-Car Garage</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zM22 17c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.47.27-1.07.64-2.18.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zM22 13c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.47.27-1.07.64-2.18.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zM7 15c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
                                </svg>
                            </div>
                            <div class="feature-text">Community Pool</div>
                        </div>
                        ${customization.propertyHighlights.solarPanels ? `
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                                </svg>
                            </div>
                            <div class="feature-text">Solar Panels</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="cta-section">
                    <a href="mailto:${customization.agentEmail || 'hello@example.com'}?subject=Property Inquiry&body=Hi, I'm interested in learning more about this property. Please contact me with additional details." class="cta-button">
                        📧 Contact Agent Today
                    </a>
                </div>
                ` : `
                <div class="open-house-content-section">
                    <h2 class="flyer-title">Join Us for the Open House</h2>
                    
                    <div class="open-house-description-section">
                        <div class="section-title">About This Property</div>
                        <div class="property-description">
                            ${content?.openHouseText || content?.standardText || 'Come and see this beautiful house with so much to offer! This house has high ceilings, crown and base molding, and upgraded tile flooring. It has lush landscaping with a variety of trees and gorgeous lawns. Book an appointment today!'}
                        </div>
                        
                        ${customization.websiteLink ? `
                        <div class="listing-website-section">
                            <div class="website-label">View Full Listing:</div>
                            <a href="${customization.websiteLink.startsWith('http') ? customization.websiteLink : 'https://' + customization.websiteLink}" 
                               target="_blank" 
                               class="listing-website-link">
                                🌐 ${customization.websiteLink}
                            </a>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${customization.propertyDetails && (customization.propertyDetails.bedrooms || customization.propertyDetails.bathrooms || customization.propertyDetails.sqft || customization.propertyDetails.yearBuilt) ? `
                    <div class="property-details-grid">
                        ${customization.propertyDetails.bedrooms ? `
                        <div class="detail-item">
                            <div class="detail-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 12H7v-1c0-1.1.9-2 2-2s2 .9 2 2v1h4v-1c0-1.1.9-2 2-2s2 .9 2 2v1z"/>
                                </svg>
                            </div>
                            <div class="detail-content">
                                <div class="detail-value">${customization.propertyDetails.bedrooms}</div>
                                <div class="detail-label">Bedrooms</div>
                            </div>
                        </div>
                        ` : ''}
                        ${customization.propertyDetails.bathrooms ? `
                        <div class="detail-item">
                            <div class="detail-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                            </div>
                            <div class="detail-content">
                                <div class="detail-value">${customization.propertyDetails.bathrooms}</div>
                                <div class="detail-label">Bathrooms</div>
                            </div>
                        </div>
                        ` : ''}
                        ${customization.propertyDetails.sqft ? `
                        <div class="detail-item">
                            <div class="detail-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                            </div>
                            <div class="detail-content">
                                <div class="detail-value">${customization.propertyDetails.sqft}</div>
                                <div class="detail-label">Sq. Ft.</div>
                            </div>
                        </div>
                        ` : ''}
                        ${customization.propertyDetails.yearBuilt ? `
                        <div class="detail-item">
                            <div class="detail-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                </svg>
                            </div>
                            <div class="detail-content">
                                <div class="detail-value">${customization.propertyDetails.yearBuilt}</div>
                                <div class="detail-label">Year Built</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    ${customization.propertyHighlights && Object.values(customization.propertyHighlights).some(Boolean) ? `
                    <div class="open-house-features-section">
                        <div class="section-title">Property Highlights</div>
                        <div class="features-grid">
                            ${customization.propertyHighlights.highCeilings ? `
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                                    </svg>
                                </div>
                                <div class="feature-text">High Ceilings</div>
                            </div>
                            ` : ''}
                            ${customization.propertyHighlights.crownMolding ? `
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                    </svg>
                                </div>
                                <div class="feature-text">Crown Molding</div>
                            </div>
                            ` : ''}
                            ${customization.propertyHighlights.updatedKitchen ? `
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                                    </svg>
                                </div>
                                <div class="feature-text">Updated Kitchen</div>
                            </div>
                            ` : ''}
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25z"/>
                                    </svg>
                                </div>
                                <div class="feature-text">Lush Landscaping</div>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                                    </svg>
                                </div>
                                <div class="feature-text">2-Car Garage</div>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zM22 17c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.47.27-1.07.64-2.18.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zM22 13c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.47.27-1.07.64-2.18.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zM7 15c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
                                    </svg>
                                </div>
                                <div class="feature-text">Community Pool</div>
                            </div>
                            ${customization.propertyHighlights.solarPanels ? `
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                                    </svg>
                                </div>
                                <div class="feature-text">Solar Panels</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="open-house-cta-section">
                        <a href="mailto:${customization.agentEmail || 'hello@example.com'}?subject=Open House Inquiry&body=Hi, I'm interested in learning more about this property. Please contact me with additional details." class="open-house-cta">
                            🎉 Don't Miss This Opportunity!
                        </a>
                    </div>
                </div>
                `}
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <!-- Agency Logo in Footer -->
            ${customization.agencyLogo ? `
            <div class="footer-logo">
                <img src="${customization.agencyLogo.data || customization.agencyLogo.src || customization.agencyLogo}" alt="Agency Logo" onerror="this.parentElement.style.display='none';" />
            </div>
            ` : ''}
            
            ${customization.agentPhone ? `
            <div class="contact-item">
                <div class="contact-icon">📞</div>
                <span>${customization.agentPhone}</span>
            </div>
            ` : ''}
            ${customization.websiteLink ? `
            <div class="contact-item">
                <div class="contact-icon">🌐</div>
                <span>${customization.websiteLink}</span>
            </div>
            ` : ''}
            ${customization.officeAddress ? `
            <div class="contact-item">
                <div class="contact-icon">📍</div>
                <span>${customization.officeAddress}</span>
            </div>
            ` : ''}
            ${!customization.agentPhone && !customization.websiteLink && !customization.officeAddress ? `
            <div class="contact-item">
                <div class="contact-icon">📞</div>
                <span>+123-456-7890</span>
            </div>
            <div class="contact-item">
                <div class="contact-icon">🌐</div>
                <span>www.reallygreatsite.com</span>
            </div>
            <div class="contact-item">
                <div class="contact-icon">📍</div>
                <span>123 Anywhere St., Any City</span>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

  return html;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    console.log("Flyer API request received");
    console.log("Request body keys:", Object.keys(req.body || {}));
    
    const { flyers = [], content, customization = {} } = req.body || {};
    console.log("Flyers requested:", flyers);
    console.log("Customization keys:", Object.keys(customization));
    console.log("Property photos:", customization.propertyPhotos);
    console.log("Agency logo:", customization.agencyLogo);
    
    if (!flyers.length) {
      return res.status(400).json({ ok: false, error: "No flyers requested" });
    }

    if (!content) {
      return res.status(400).json({ ok: false, error: "No content provided" });
    }

    const wantStandard = flyers.includes("standard");
    const wantOpenHouse = flyers.includes("openHouse");
    console.log("Will generate standard:", wantStandard, "openHouse:", wantOpenHouse);

    const baseText = pickBestText(content || {});
    console.log("Base text length:", baseText?.length || 0);
    
    if (!baseText.trim()) {
      return res.status(400).json({ ok: false, error: "No valid content found to generate flyer from" });
    }

    // Clean the text but keep emojis and special characters
    const cleanedText = baseText.trim();
    console.log("Cleaned text length:", cleanedText?.length || 0);
    
    if (!cleanedText.trim()) {
      return res.status(400).json({ ok: false, error: "No valid content remaining after cleaning for flyer generation" });
    }

    const standardText = wantStandard ? cleanedText : "";
    const openHouseText = wantOpenHouse ? cleanedText : "";

    console.log("Starting HTML flyer generation...");
    
    // Generate separate HTML content for each flyer type
    const generatedFlyers = {};
    
    if (standardText) {
      console.log("Creating standard flyer...");
      generatedFlyers.standard = createHtmlFlyer({ standardText, openHouseText: "", customization, pageType: "standard" });
    }
    
    if (openHouseText) {
      console.log("Creating open house flyer...");
      generatedFlyers.openHouse = createHtmlFlyer({ standardText: "", openHouseText, customization, pageType: "openHouse" });
    }

    console.log("HTML flyers generated successfully");

    // Return JSON with separate flyer content
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ 
      success: true, 
      flyers: generatedFlyers,
      message: `Generated ${Object.keys(generatedFlyers).length} flyer(s) successfully`
    });
  } catch (e) {
    console.error("/api/flyer error:", e);
    console.error("Error stack:", e.stack);
    return res.status(500).json({ ok: false, error: `Failed to generate flyer: ${e.message}` });
  }
}

function pickBestText(contentObj) {
  // content can be:
  //  - { mls: '...', social:'...', luxury:'...', concise:'...' }
  //  - { single: '...' }
  //  - string
  if (!contentObj) return "";
  if (typeof contentObj === "string") return contentObj;
  if (contentObj.mls) return contentObj.mls;
  if (contentObj.single) return contentObj.single;
  // fallback: concatenate any values
  const vals = Object.values(contentObj).filter(Boolean);
  return vals.join("\n\n");
}

