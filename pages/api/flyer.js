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
  
  // Create a beautiful HTML template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isOpenHouse ? 'Open House Flyer' : 'Property Flyer'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .flyer-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 15px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #0a6628 0%, #0d8a35 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
        }
        
        .title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .agency-name {
            font-size: 1.5rem;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .open-house-banner {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            color: #333;
            padding: 25px;
            margin: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .open-house-title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .event-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .event-detail {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .cta {
            font-size: 1.3rem;
            font-weight: bold;
            color: #0a6628;
        }
        
        .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .photo-item {
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .photo-item:hover {
            transform: translateY(-5px);
        }
        
        .photo-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        
        .content-section {
            padding: 40px;
            background: white;
        }
        
        .content-title {
            font-size: 2rem;
            color: #0a6628;
            margin-bottom: 20px;
            border-bottom: 3px solid #ffd700;
            padding-bottom: 10px;
        }
        
        .content-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #555;
            margin-bottom: 20px;
        }
        
        .footer {
            background: linear-gradient(135deg, #0a6628 0%, #0d8a35 100%);
            color: white;
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .contact-info {
            font-size: 1.1rem;
        }
        
        .qr-section {
            text-align: center;
        }
        
        .qr-code {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 10px;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            color: #333;
        }
        
        .qr-text {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        @media print {
            body { background: white; }
            .flyer-container { 
                margin: 0; 
                box-shadow: none;
                border-radius: 0;
            }
        }
        
        @media (max-width: 768px) {
            .title { font-size: 2rem; }
            .photo-grid { grid-template-columns: 1fr; }
            .footer { flex-direction: column; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="flyer-container">
        <div class="header">
            <h1 class="title">${isOpenHouse ? '🏠 Open House' : '🏡 Property Flyer'}</h1>
            ${customization.agencyName ? `<p class="agency-name">${customization.agencyName}</p>` : ''}
        </div>
        
        ${isOpenHouse ? `
        <div class="open-house-banner">
            <h2 class="open-house-title">🎉 OPEN HOUSE EVENT</h2>
            <div class="event-details">
                <div class="event-detail">
                    <span>📅</span>
                    <span>Date: December 15th, 2024</span>
                </div>
                <div class="event-detail">
                    <span>⏰</span>
                    <span>Time: 2:00 PM - 5:00 PM</span>
                </div>
                <div class="event-detail">
                    <span>📍</span>
                    <span>Location: Property Address</span>
                </div>
            </div>
            <p class="cta">🎉 Don't miss this amazing opportunity!</p>
        </div>
        ` : ''}
        
        ${customization.propertyPhotos && customization.propertyPhotos.length > 0 ? `
        <div class="photo-grid">
            ${customization.propertyPhotos.map((photo, index) => `
                <div class="photo-item">
                    <img src="${photo.data}" alt="Property Photo ${index + 1}" />
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="content-section">
            <h2 class="content-title">${isOpenHouse ? 'Property Details' : 'About This Property'}</h2>
            <div class="content-text">
                ${standardText || openHouseText || 'No content provided'}
            </div>
        </div>
        
        <div class="footer">
            <div class="contact-info">
                ${customization.agentEmail ? `<p>📧 Contact: ${customization.agentEmail}</p>` : ''}
                ${customization.websiteLink ? `<p>🌐 Website: ${customization.websiteLink}</p>` : ''}
            </div>
            <div class="qr-section">
                ${customization.websiteLink ? `
                <div class="qr-code">
                    QR Code
                </div>
                <p class="qr-text">Scan for details</p>
                ` : ''}
            </div>
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
    
    // Generate HTML content
    let htmlContent = "";
    
    if (standardText) {
      console.log("Creating standard flyer...");
      htmlContent += createHtmlFlyer({ standardText, openHouseText: "", customization, pageType: "standard" });
    }
    
    if (openHouseText) {
      console.log("Creating open house flyer...");
      if (htmlContent) htmlContent += "<hr style='page-break-before: always;'>";
      htmlContent += createHtmlFlyer({ standardText: "", openHouseText, customization, pageType: "openHouse" });
    }

    console.log("HTML flyer generated successfully");

    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="flyer${wantStandard && wantOpenHouse ? "-bundle" : ""}.html"`
    );
    return res.status(200).send(htmlContent);
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

