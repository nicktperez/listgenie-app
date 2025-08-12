// pages/api/flyer.js
// Generates beautiful, professional PDF flyers with agency branding, photos, and QR codes

import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Increased from 10mb to handle large image uploads
    },
  },
};

async function createPdf({ standardText, openHouseText, customization }) {
  try {
    const { PDFDocument, StandardFonts, rgb, rgba } = await import("pdf-lib");
    
    const doc = await PDFDocument.create();
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    
    // Helper function to create a beautiful page
    const makePage = async (title, body, pageType = "standard") => {
      const page = doc.addPage([612, 792]); // Letter portrait
      const { width, height } = page.getSize();
      
      // Background gradient effect
      const gradient = page.drawRectangle({
        x: 0, y: 0,
        width, height,
        color: rgb(0.98, 0.98, 0.98),
      });
      
      // Header section with gradient
      const headerHeight = 120;
      page.drawRectangle({
        x: 0, y: height - headerHeight,
        width, height: headerHeight,
        color: rgb(0.1, 0.12, 0.18),
      });
      
      // Agency logo if provided
      if (customization.agencyLogo) {
        try {
          console.log("Processing agency logo...");
          console.log("Logo data type:", typeof customization.agencyLogo);
          console.log("Logo data length:", customization.agencyLogo?.length || 0);
          console.log("Logo data starts with:", customization.agencyLogo?.substring(0, 50));
          
          // Handle both data URLs and base64 strings
          const logoData = customization.agencyLogo.includes(',') 
            ? customization.agencyLogo.split(',')[1] 
            : customization.agencyLogo;
          
          console.log("Processed logo data length:", logoData?.length || 0);
          
          const logoImage = await doc.embedPng(Buffer.from(logoData, 'base64'));
          console.log("Logo embedded successfully, dimensions:", logoImage.width, "x", logoImage.height);
          
          const logoWidth = 80;
          const logoHeight = (logoImage.height * logoWidth) / logoImage.width;
          page.drawImage(logoImage, {
            x: 36,
            y: height - 100,
            width: logoWidth,
            height: logoHeight,
          });
          console.log("Logo drawn to page");
        } catch (e) {
          console.log("Logo embedding failed, continuing without logo:", e.message);
          console.log("Logo error stack:", e.stack);
        }
      }
      
      // Title
      page.drawText(title, {
        x: customization.agencyLogo ? 140 : 36,
        y: height - 60,
        size: 28,
        font: helveticaBold,
        color: rgb(0.95, 0.97, 1),
      });
      
      // Agency name if provided
      if (customization.agencyName) {
        page.drawText(customization.agencyName, {
          x: customization.agencyLogo ? 140 : 36,
          y: height - 85,
          size: 14,
          font: helvetica,
          color: rgb(0.8, 0.85, 0.9),
        });
      }
      
      // Property photos if provided
      let photoY = height - 160;
      if (customization.propertyPhotos && customization.propertyPhotos.length > 0) {
        const photoSize = 120;
        const photosPerRow = 4;
        let photoX = 36;
        
        for (let i = 0; i < Math.min(customization.propertyPhotos.length, 8); i++) {
          try {
            const photo = customization.propertyPhotos[i];
            console.log(`Processing photo ${i + 1}/${customization.propertyPhotos.length}...`);
            console.log("Photo data type:", typeof photo.data);
            console.log("Photo data length:", photo.data?.length || 0);
            console.log("Photo data starts with:", photo.data?.substring(0, 50));
            
            // Handle both data URLs and base64 strings
            const photoData = photo.data.includes(',') 
              ? photo.data.split(',')[1] 
              : photo.data;
            
            console.log("Processed photo data length:", photoData?.length || 0);
            
            const photoImage = await doc.embedPng(Buffer.from(photoData, 'base64'));
            console.log(`Photo ${i + 1} embedded successfully, dimensions:`, photoImage.width, "x", photoImage.height);
            
            const aspectRatio = photoImage.width / photoImage.height;
            
            let drawWidth = photoSize;
            let drawHeight = photoSize;
            
            if (aspectRatio > 1) {
              drawHeight = photoSize / aspectRatio;
            } else {
              drawWidth = photoSize * aspectRatio;
            }
            
            page.drawImage(photoImage, {
              x: photoX,
              y: photoY,
              width: drawWidth,
              height: drawHeight,
            });
            
            console.log(`Photo ${i + 1} drawn to page at (${photoX}, ${photoY})`);
            
            photoX += photoSize + 12;
            if ((i + 1) % photosPerRow === 0) {
              photoX = 36;
              photoY -= photoSize + 12;
            }
          } catch (e) {
            console.log(`Photo ${i + 1} embedding failed, continuing without photo:`, e.message);
            console.log(`Photo ${i + 1} error stack:`, e.stack);
          }
        }
        
        photoY -= 20; // Add spacing after photos
      }
      
      // Content section
      const contentX = 36;
      const contentWidth = width - 72;
      const contentY = photoY;
      
      // Draw content background
      page.drawRectangle({
        x: contentX - 12,
        y: contentY - 20,
        width: contentWidth + 24,
        height: contentY + 20,
        color: rgb(1, 1, 1),
      });
      
      // Content text with word wrapping
      const words = (body || "").replace(/\r/g, "").split(/\s+/);
      const lines = [];
      let line = "";
      const maxChars = 80;
      
      for (const w of words) {
        if ((line + " " + w).trim().length > maxChars) {
          lines.push(line.trim());
          line = w;
        } else {
          line += " " + w;
        }
      }
      if (line.trim()) lines.push(line.trim());
      
      let textY = contentY;
      for (const l of lines) {
        if (textY < 100) {
          // New page if overflow
          const newPage = doc.addPage([612, 792]);
          newPage.drawRectangle({
            x: 0, y: 0,
            width, height,
            color: rgb(0.98, 0.98, 0.98),
          });
          textY = height - 100;
        }
        
        page.drawText(l, {
          x: contentX,
          y: textY,
          size: 12,
          font: helvetica,
          color: rgb(0.1, 0.1, 0.12),
        });
        textY -= 18;
      }
      
      // Footer section
      const footerY = 80;
      
      // Contact information
      if (customization.agentEmail) {
        page.drawText(`Contact: ${customization.agentEmail}`, {
          x: 36,
          y: footerY,
          size: 10,
          font: helvetica,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
      
      // QR code if website link provided
      if (customization.websiteLink) {
        try {
          const QRCode = await import('qrcode');
          const qrDataUrl = await QRCode.toDataURL(customization.websiteLink, {
            width: 60,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          const qrImage = await doc.embedPng(qrDataUrl.split(',')[1]);
          page.drawImage(qrImage, {
            x: width - 96,
            y: footerY - 10,
            width: 60,
            height: 60,
          });
          
          page.drawText("Scan for details", {
            x: width - 96,
            y: footerY - 25,
            size: 8,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        } catch (e) {
          console.log("QR code generation failed, continuing without QR code");
        }
      }
      
      // Page number
      page.drawText(`Page ${doc.getPageCount()}`, {
        x: width - 60,
        y: 20,
        size: 8,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6),
      });
    };

    // Create pages based on selected types
    if (standardText) {
      console.log("Creating standard flyer page...");
      await makePage("Property Flyer", standardText, "standard");
    }
    if (openHouseText) {
      console.log("Creating open house flyer page...");
      await makePage("Open House Flyer", openHouseText, "openHouse");
    }

    console.log("All pages created, saving PDF...");
    const pdfBytes = await doc.save();
    console.log("PDF saved successfully, size:", pdfBytes.length);
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error in createPdf:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

function cleanTextForPdf(text) {
  if (!text) return "";
  
  return text
    // Remove emojis and special Unicode characters
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional Indicator Symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc Symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    // Remove other problematic characters
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    // Remove any remaining problematic characters that might cause encoding issues
    .replace(/[^\w\s\-.,!?;:'"()]/g, '') // Only allow safe characters
    .trim();
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

    // Clean the text to remove emojis and special characters that can't be encoded in PDFs
    const cleanedText = cleanTextForPdf(baseText);
    console.log("Cleaned text length:", cleanedText?.length || 0);
    
    if (!cleanedText.trim()) {
      return res.status(400).json({ ok: false, error: "No valid content remaining after cleaning for PDF generation" });
    }

    const standardText = wantStandard ? cleanedText : "";
    const openHouseText = wantOpenHouse ? cleanedText : "";

    console.log("Starting PDF generation...");
    const pdf = await createPdf({ standardText, openHouseText, customization });
    console.log("PDF generated successfully, size:", pdf.length);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="flyer${wantStandard && wantOpenHouse ? "-bundle" : ""}.pdf"`
    );
    return res.status(200).send(pdf);
  } catch (e) {
    console.error("/api/flyer error:", e);
    console.error("Error stack:", e.stack);
    return res.status(500).json({ ok: false, error: `Failed to generate PDF: ${e.message}` });
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
