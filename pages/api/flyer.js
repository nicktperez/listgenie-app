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
  
  // Create a beautiful HTML template matching the Studio Shodwe design
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isOpenHouse ? 'Open House Flyer' : 'Property Flyer'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background: #f7fafc;
            font-weight: 400;
        }
        
        .flyer-container {
            max-width: 900px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            border-radius: 0;
            overflow: hidden;
            position: relative;
        }
        
        /* Hero Section */
        .hero-section {
            position: relative;
            height: 400px;
            overflow: hidden;
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        }
        
        .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.9;
        }
        
        .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(45, 55, 72, 0.8) 0%, rgba(74, 85, 104, 0.6) 100%);
        }
        
        .logo-section {
            position: absolute;
            top: 30px;
            right: 30px;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .logo-text {
            font-size: 1.2rem;
            font-weight: 700;
            color: #2d3748;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .logo-icon {
            font-size: 1.5rem;
        }
        
        /* Main Content Section */
        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            min-height: 500px;
        }
        
        .left-column {
            padding: 50px 40px;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .right-column {
            padding: 50px 40px;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        /* Typography and Content */
        .listing-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: #2d3748;
            margin-bottom: 20px;
            line-height: 1.2;
            letter-spacing: -0.02em;
        }
        
        .listing-subtitle {
            font-size: 1.1rem;
            color: #718096;
            margin-bottom: 30px;
            font-weight: 400;
            line-height: 1.6;
        }
        
        .price-box {
            background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
            color: white;
            padding: 25px 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(246, 173, 85, 0.3);
        }
        
        .price-label {
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            opacity: 0.9;
        }
        
        .price-amount {
            font-size: 2.8rem;
            font-weight: 800;
            line-height: 1;
        }
        
        .features-list {
            list-style: none;
            margin-top: 20px;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.1rem;
            color: #2d3748;
            margin-bottom: 15px;
            font-weight: 500;
        }
        
        .feature-icon {
            width: 24px;
            height: 24px;
            background: #48bb78;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        /* Photo Grid */
        .photo-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .photo-item {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border: 3px solid #f6ad55;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .photo-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        
        .photo-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            color: white;
            padding: 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            align-items: center;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 1.1rem;
            font-weight: 500;
        }
        
        .contact-icon {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        /* Open House Special Styling */
        .open-house-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            margin: 0 40px 40px 40px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .open-house-title {
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 25px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .event-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 25px;
            margin-bottom: 25px;
        }
        
        .event-detail {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        
        .event-icon {
            font-size: 2rem;
            margin-bottom: 5px;
        }
        
        .event-label {
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.8;
        }
        
        .event-value {
            font-size: 1.1rem;
            font-weight: 700;
        }
        
        .cta-button {
            background: white;
            color: #667eea;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .left-column, .right-column {
                padding: 30px 25px;
            }
            
            .hero-section {
                height: 300px;
            }
            
            .listing-title {
                font-size: 2rem;
            }
            
            .price-amount {
                font-size: 2.2rem;
            }
            
            .footer {
                grid-template-columns: 1fr;
                text-align: center;
            }
        }
        
        @media print {
            body { background: white; }
            .flyer-container { 
                margin: 0; 
                box-shadow: none;
                border-radius: 0;
            }
            .hero-section { height: 300px; }
        }
    </style>
</head>
<body>
    <div class="flyer-container">
        <!-- Hero Section with Large Image -->
        <div class="hero-section">
            ${customization.propertyPhotos && customization.propertyPhotos.length > 0 ? 
                `<img src="${customization.propertyPhotos[0].data}" alt="Property Hero" class="hero-image">` : 
                '<div class="hero-image" style="background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);"></div>'
            }
            <div class="hero-overlay"></div>
            
            <!-- Logo Section -->
            <div class="logo-section">
                <div class="logo-text">
                    <span class="logo-icon">🏠</span>
                    ${customization.agencyName || 'STUDIO SHODWE'}
                </div>
            </div>
        </div>
        
        <!-- Open House Banner (if applicable) -->
        ${isOpenHouse ? `
        <div class="open-house-banner">
            <h2 class="open-house-title">🎉 OPEN HOUSE EVENT</h2>
            <div class="event-details">
                <div class="event-detail">
                    <div class="event-icon">📅</div>
                    <div class="event-label">Date</div>
                    <div class="event-value">December 15th, 2024</div>
                </div>
                <div class="event-detail">
                    <div class="event-icon">⏰</div>
                    <div class="event-label">Time</div>
                    <div class="event-value">2:00 PM - 5:00 PM</div>
                </div>
                <div class="event-detail">
                    <div class="event-icon">📍</div>
                    <div class="event-label">Location</div>
                    <div class="event-value">Property Address</div>
                </div>
            </div>
            <a href="mailto:${customization.agentEmail || 'hello@example.com'}?subject=Open House Inquiry&body=Hi, I'm interested in learning more about this property. Please contact me with additional details." class="cta-button">🎉 Don't Miss This Opportunity!</a>
        </div>
        ` : ''}
        
        <!-- Main Content Section -->
        <div class="main-content">
            <!-- Left Column - Text Content -->
            <div class="left-column">
                <h1 class="listing-title">NEW LISTING</h1>
                <p class="listing-subtitle">Don't miss the opportunity to make this beautiful house your new home!</p>
                
                <div class="price-box">
                    <div class="price-label">Price</div>
                    <div class="price-amount">$850,000</div>
                </div>
                
                <ul class="features-list">
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>4 Bedrooms</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>3 Bathrooms</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Gourmet Kitchen</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Private Backyard</span>
                    </li>
                </ul>
            </div>
            
            <!-- Right Column - Photos -->
            <div class="right-column">
                <div class="photo-grid">
                    ${customization.propertyPhotos && customization.propertyPhotos.length > 1 ? 
                        customization.propertyPhotos.slice(1, 3).map((photo, index) => `
                            <div class="photo-item">
                                <img src="${photo.data}" alt="Property Photo ${index + 2}" />
                            </div>
                        `).join('') : 
                        '<div class="photo-item"><div style="height: 200px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #718096;">Photo Placeholder</div></div>'
                    }
                </div>
                
                <div class="content-text" style="margin-top: 20px; color: #4a5568; line-height: 1.7;">
                    ${standardText || openHouseText || 'Beautiful property with modern amenities and prime location. Contact us for more details!'}
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
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

