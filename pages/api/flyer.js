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
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    
    const doc = await PDFDocument.create();
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    
    // Helper function to create a beautiful, engaging flyer page
    const makePage = async (title, body, pageType = "standard") => {
      const page = doc.addPage([612, 792]); // Letter portrait
      const { width, height } = page.getSize();
      
      // Fun, engaging color scheme
      const primaryColor = rgb(0.1, 0.4, 0.2); // Rich green
      const accentColor = rgb(0.95, 0.7, 0.1); // Warm gold
      const textColor = rgb(1, 1, 1); // White text
      const darkTextColor = rgb(0.1, 0.1, 0.1); // Dark text
      
      // Background - clean white
      page.drawRectangle({
        x: 0, y: 0,
        width, height,
        color: rgb(1, 1, 1),
      });
      
      // Top banner with gradient effect
      const bannerHeight = 120;
      page.drawRectangle({
        x: 0, y: height - bannerHeight,
        width, height: bannerHeight,
        color: primaryColor,
      });
      
      // Add gold accent stripe
      page.drawRectangle({
        x: 0, y: height - bannerHeight,
        width, height: 8,
        color: accentColor,
      });
      
      // Add decorative corner elements
      const cornerSize = 20;
      page.drawRectangle({
        x: 0, y: height - cornerSize,
        width: cornerSize, height: cornerSize,
        color: accentColor,
      });
      
      page.drawRectangle({
        x: width - cornerSize, y: height - cornerSize,
        width: cornerSize, height: cornerSize,
        color: accentColor,
      });
      
      // Title in banner
      page.drawText(title, {
        x: 36,
        y: height - 60,
        size: 32,
        font: helveticaBold,
        color: textColor,
      });
      
      // Agency name in banner
      if (customization.agencyName) {
        page.drawText(customization.agencyName, {
          x: 36,
          y: height - 85,
          size: 16,
          font: helvetica,
          color: textColor,
        });
      }
      
      // Main content area
      const contentStartY = height - bannerHeight - 20;
      const contentHeight = contentStartY - 100; // Leave space for footer
      
      // Content background
      page.drawRectangle({
        x: 20, y: 100,
        width: width - 40, height: contentHeight,
        color: rgb(0.98, 0.98, 0.98), // Light gray background
      });
      
      // Add border
      page.drawRectangle({
        x: 20, y: 100,
        width: width - 40, height: contentHeight,
        color: primaryColor,
        borderWidth: 2,
      });
      
      // Photo grid section
      let photoY = contentStartY - 40;
      const photoSize = 120;
      const photosPerRow = 3;
      let photoX = 40;
      let photoCount = 0;
      
      if (customization.propertyPhotos && customization.propertyPhotos.length > 0) {
        console.log(`Processing ${customization.propertyPhotos.length} photos...`);
        
        for (let i = 0; i < Math.min(customization.propertyPhotos.length, 6); i++) {
          try {
            const photo = customization.propertyPhotos[i];
            console.log(`Processing photo ${i + 1}:`, photo.name);
            
            // Handle both data URLs and base64 strings
            const photoData = photo.data.includes(',') 
              ? photo.data.split(',')[1] 
              : photo.data;
            
            console.log(`Photo ${i + 1} data length:`, photoData?.length || 0);
            
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
            
            // Center the photo in its grid cell
            const cellX = photoX + (photoSize - drawWidth) / 2;
            const cellY = photoY + (photoSize - drawHeight) / 2;
            
            page.drawImage(photoImage, {
              x: cellX,
              y: cellY,
              width: drawWidth,
              height: drawHeight,
            });
            
            console.log(`Photo ${i + 1} drawn at (${cellX}, ${cellY})`);
            
            photoCount++;
            photoX += photoSize + 20;
            
            if (photoCount % photosPerRow === 0) {
              photoX = 40;
              photoY -= photoSize + 20;
            }
          } catch (e) {
            console.log(`Photo ${i + 1} failed:`, e.message);
            console.log(`Photo ${i + 1} error stack:`, e.stack);
          }
        }
        
        photoY -= 30; // Extra spacing after photos
      } else {
        console.log("No photos provided, using placeholder");
        // Draw placeholder boxes
        for (let i = 0; i < 6; i++) {
          page.drawRectangle({
            x: photoX,
            y: photoY,
            width: photoSize,
            height: photoSize,
            color: rgb(0.9, 0.9, 0.9),
            borderColor: primaryColor,
            borderWidth: 1,
          });
          
          page.drawText("Photo", {
            x: photoX + photoSize/2 - 20,
            y: photoY + photoSize/2,
            size: 12,
            font: helvetica,
            color: rgb(0.6, 0.6, 0.6),
          });
          
          photoCount++;
          photoX += photoSize + 20;
          
          if (photoCount % photosPerRow === 0) {
            photoX = 40;
            photoY -= photoSize + 20;
          }
        }
        photoY -= 30;
      }
      
      // Content text section
      let textStartY = photoY;
      const textX = 40;
      const textWidth = width - 80;
      
      // Special Open House formatting
      if (pageType === "openHouse") {
        // Event details box
        const eventBoxY = textStartY - 60;
        page.drawRectangle({
          x: textX - 10,
          y: eventBoxY - 20,
          width: textWidth + 20,
          height: 60,
          color: accentColor,
        });
        
        page.drawText("OPEN HOUSE EVENT", {
          x: textX,
          y: eventBoxY,
          size: 18,
          font: helveticaBold,
          color: darkTextColor,
        });
        
        const eventDetails = [
          "📅 Date: December 15th, 2024",
          "⏰ Time: 2:00 PM - 5:00 PM",
          "📍 Location: Property Address"
        ];
        
        let eventY = eventBoxY - 25;
        for (const detail of eventDetails) {
          page.drawText(detail, {
            x: textX,
            y: eventY,
            size: 12,
            font: helveticaBold,
            color: darkTextColor,
          });
          eventY -= 18;
        }
        
        // Call to action
        page.drawText("🎉 Don't miss this amazing opportunity!", {
          x: textX,
          y: eventY - 10,
          size: 14,
          font: helveticaBold,
          color: primaryColor,
        });
        
        textStartY = eventY - 40; // Adjust text start position
      }
      
      // Content background
      page.drawRectangle({
        x: textX - 10,
        y: textStartY - 20,
        width: textWidth + 20,
        height: textStartY + 20,
        color: primaryColor,
      });
      
      // Content text with better formatting
      const contentText = body || "";
      const maxLineLength = 70;
      const words = contentText.split(/\s+/);
      const lines = [];
      let currentLine = "";
      
      for (const word of words) {
        if ((currentLine + " " + word).length > maxLineLength) {
          lines.push(currentLine.trim());
          currentLine = word;
        } else {
          currentLine += (currentLine ? " " : "") + word;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      
      // Draw content lines
      let textY = textStartY;
      for (const line of lines) {
        if (textY < 120) break; // Don't overflow into footer
        
        page.drawText(line, {
          x: textX,
          y: textY,
          size: 11,
          font: helvetica,
          color: textColor,
        });
        textY -= 16;
      }
      
      // Footer section
      const footerY = 80;
      
      // Footer background
      page.drawRectangle({
        x: 0, y: 0,
        width, height: footerY,
        color: primaryColor,
      });
      
      // Gold accent stripe at top of footer
      page.drawRectangle({
        x: 0, y: footerY,
        width, height: 4,
        color: accentColor,
      });
      
      // Contact information
      let contactX = 36;
      const contactY = 50;
      
      if (customization.agentEmail) {
        page.drawText(`Contact: ${customization.agentEmail}`, {
          x: contactX,
          y: contactY,
          size: 12,
          font: helveticaBold,
          color: textColor,
        });
        contactX += 200;
      }
      
      // QR code if website link provided
      if (customization.websiteLink) {
        try {
          const QRCode = await import('qrcode');
          const qrDataUrl = await QRCode.toDataURL(customization.websiteLink, {
            width: 60,
            margin: 1,
            color: {
              dark: '#FFFFFF',
              light: '#0A6628'
            }
          });
          
          const qrImage = await doc.embedPng(qrDataUrl.split(',')[1]);
          page.drawImage(qrImage, {
            x: width - 80,
            y: 10,
            width: 60,
            height: 60,
          });
          
          page.drawText("Scan for details", {
            x: width - 80,
            y: 5,
            size: 10,
            font: helvetica,
            color: textColor,
          });
        } catch (e) {
          console.log("QR code generation failed:", e.message);
        }
      }
      
      // Page number
      page.drawText(`Page ${doc.getPageCount()}`, {
        x: width - 60,
        y: 25,
        size: 10,
        font: helvetica,
        color: textColor,
      });
    };

    // Create pages based on selected types
    if (standardText) {
      console.log("Creating standard flyer page...");
      try {
        await makePage("Property Flyer", standardText, "standard");
        console.log("Standard flyer page created successfully");
      } catch (pageError) {
        console.error("Error creating standard flyer page:", pageError);
        throw new Error(`Standard flyer page creation failed: ${pageError.message}`);
      }
    }
    if (openHouseText) {
      console.log("Creating open house flyer page...");
      try {
        await makePage("Open House", openHouseText, "openHouse");
        console.log("Open house flyer page created successfully");
      } catch (pageError) {
        console.error("Error creating open house flyer page:", pageError);
        throw new Error(`Open house flyer page creation failed: ${pageError.message}`);
      }
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

