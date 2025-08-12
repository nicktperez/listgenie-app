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
  
  // Create a beautiful HTML template matching the cozy open house flyer design
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isOpenHouse ? 'Open House Flyer' : 'Property Flyer'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #f8f9fa;
            background: #2d4a3e;
            font-weight: 400;
        }
        
        .flyer-container {
            max-width: 900px;
            margin: 20px auto;
            background: #2d4a3e;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            border-radius: 0;
            overflow: hidden;
            position: relative;
        }
        
        /* Hero Section with Large Image */
        .hero-section {
            position: relative;
            height: 350px;
            overflow: hidden;
            background: #2d4a3e;
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
            background: linear-gradient(135deg, rgba(45, 74, 62, 0.8) 0%, rgba(45, 74, 62, 0.6) 100%);
        }
        
        /* Main Content Section - Two Column Layout */
        .main-content {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 0;
            min-height: 600px;
            background: #2d4a3e;
        }
        
        /* Left Column - Photos */
        .left-column {
            padding: 30px 20px;
            background: #2d4a3e;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .photo-item {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            border: 2px solid #8b9d83;
            transition: transform 0.3s ease;
        }
        
        .photo-item:hover {
            transform: translateY(-3px);
        }
        
        .photo-item img {
            width: 100%;
            height: 180px;
            object-fit: cover;
        }
        
        /* Right Column - Content */
        .right-column {
            padding: 40px 35px;
            background: #3a5a4a;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        
        /* Typography and Content */
        .flyer-title {
            font-family: 'Playfair Display', serif;
            font-size: 3.5rem;
            font-weight: 700;
            color: #f8f9fa;
            margin-bottom: 15px;
            line-height: 1.1;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .event-details {
            margin-bottom: 25px;
        }
        
        .event-detail {
            font-size: 1.2rem;
            color: #e9ecef;
            margin-bottom: 8px;
            font-weight: 400;
        }
        
        .price-section {
            margin-bottom: 30px;
        }
        
        .price-label {
            font-size: 1.1rem;
            font-weight: 600;
            color: #e9ecef;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }
        
        .price-amount {
            font-size: 3rem;
            font-weight: 700;
            color: #f8f9fa;
            line-height: 1;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .about-section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #f8f9fa;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .property-description {
            font-size: 1.1rem;
            color: #e9ecef;
            line-height: 1.7;
            margin-bottom: 20px;
        }
        
        .features-section {
            margin-bottom: 25px;
        }
        
        .features-list {
            list-style: none;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.1rem;
            color: #e9ecef;
            margin-bottom: 12px;
            font-weight: 500;
        }
        
        .feature-icon {
            width: 20px;
            height: 20px;
            background: #8b9d83;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #2d4a3e;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        /* Open House Special Styling */
        .open-house-banner {
            background: linear-gradient(135deg, #8b9d83 0%, #6b7c63 100%);
            color: #2d4a3e;
            padding: 25px 30px;
            margin: 0 20px 30px 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(139, 157, 131, 0.3);
        }
        
        .open-house-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .event-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .event-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        
        .event-icon {
            font-size: 1.8rem;
            margin-bottom: 3px;
        }
        
        .event-label {
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.8;
        }
        
        .event-value {
            font-size: 1rem;
            font-weight: 600;
        }
        
        .cta-button {
            background: #2d4a3e;
            color: #f8f9fa;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            border: 2px solid #2d4a3e;
        }
        
        .cta-button:hover {
            background: #f8f9fa;
            color: #2d4a3e;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        /* Footer */
        .footer {
            background: #2d4a3e;
            color: #f8f9fa;
            padding: 30px 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 25px;
            align-items: center;
            border-top: 3px solid #8b9d83;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1rem;
            font-weight: 500;
        }
        
        .contact-icon {
            width: 35px;
            height: 35px;
            background: #8b9d83;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            color: #2d4a3e;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .left-column, .right-column {
                padding: 25px 20px;
            }
            
            .hero-section {
                height: 250px;
            }
            
            .flyer-title {
                font-size: 2.5rem;
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
            body { background: #2d4a3e; }
            .flyer-container { 
                margin: 0; 
                box-shadow: none;
                border-radius: 0;
            }
            .hero-section { height: 250px; }
        }
    </style>
</head>
<body>
    <div class="flyer-container">
        <!-- Hero Section with Large Image -->
        <div class="hero-section">
            ${customization.propertyPhotos && customization.propertyPhotos.length > 0 ? 
                `<img src="${customization.propertyPhotos[0].data}" alt="Property Hero" class="hero-image">` : 
                '<div class="hero-image" style="background: linear-gradient(135deg, #2d4a3e 0%, #3a5a4a 100%);"></div>'
            }
            <div class="hero-overlay"></div>
        </div>
        
        <!-- Open House Banner (if applicable) -->
        ${isOpenHouse ? `
        <div class="open-house-banner">
            <h2 class="open-house-title">🎉 Open House</h2>
            <div class="event-grid">
                <div class="event-item">
                    <div class="event-icon">📅</div>
                    <div class="event-label">Date</div>
                    <div class="event-value">December 15th, 2024</div>
                </div>
                <div class="event-item">
                    <div class="event-icon">⏰</div>
                    <div class="event-label">Time</div>
                    <div class="event-value">2:00 PM - 5:00 PM</div>
                </div>
                <div class="event-item">
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
            <!-- Left Column - Photos -->
            <div class="left-column">
                ${customization.propertyPhotos && customization.propertyPhotos.length > 1 ? 
                    customization.propertyPhotos.slice(1, 4).map((photo, index) => `
                        <div class="photo-item">
                            <img src="${photo.data}" alt="Property Photo ${index + 2}" />
                        </div>
                    `).join('') : 
                    Array(3).fill().map((_, index) => `
                        <div class="photo-item">
                            <div style="height: 180px; background: #3a5a4a; display: flex; align-items: center; justify-content: center; color: #8b9d83; border: 2px solid #8b9d83;">Photo ${index + 1}</div>
                        </div>
                    `).join('')
                }
            </div>
            
            <!-- Right Column - Content -->
            <div class="right-column">
                <h1 class="flyer-title">${isOpenHouse ? 'Open House' : 'Property Flyer'}</h1>
                
                ${isOpenHouse ? `
                <div class="event-details">
                    <div class="event-detail">December 15th, 2024</div>
                    <div class="event-detail">2:00 PM - 7:00 PM</div>
                    <div class="event-detail">123 Anywhere St., Any City, ST 12345</div>
                </div>
                ` : ''}
                
                <div class="price-section">
                    <div class="price-label">Offered At</div>
                    <div class="price-amount">$399,900</div>
                </div>
                
                <div class="about-section">
                    <div class="section-title">About This Property</div>
                    <div class="property-description">
                        ${standardText || openHouseText || 'Come and see this beautiful house with so much to offer! This house has high ceilings, crown and base molding, and upgraded tile flooring. It has lush landscaping with a variety of trees and gorgeous lawns. Book an appointment today!'}
                    </div>
                </div>
                
                <div class="features-section">
                    <div class="section-title">Features</div>
                    <ul class="features-list">
                        <li class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>4 Bedrooms</span>
                        </li>
                        <li class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>3 Full Baths</span>
                        </li>
                        <li class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>2,528 Sq. Ft.</span>
                        </li>
                    </ul>
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

