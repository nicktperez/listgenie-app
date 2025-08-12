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
    
    // Helper function to create a beautiful, professional flyer page
    const makePage = async (title, body, pageType = "standard") => {
      const page = doc.addPage([612, 792]); // Letter portrait
      const { width, height } = page.getSize();
      
      // Professional color scheme matching the reference design
      const primaryColor = rgb(0.2, 0.25, 0.15); // Dark olive green
      const accentColor = rgb(0.9, 0.9, 0.9); // Light gray
      const textColor = rgb(1, 1, 1); // White text
      const darkTextColor = rgb(0.1, 0.1, 0.1); // Dark text for content
      
      // Background - clean white
      page.drawRectangle({
        x: 0, y: 0,
        width, height,
        color: rgb(1, 1, 1),
      });
      
      // Subtle watermark pattern (optional)
      for (let i = 0; i < 5; i++) {
        page.drawText("ListGenie", {
          x: 50 + (i * 120),
          y: 50 + (i * 40),
          size: 8,
          font: helvetica,
          color: rgb(0.95, 0.96, 0.95), // Very light watermark
        });
      }
      
      // Header section with large hero image area
      const headerHeight = height * 0.4; // 40% of page height for hero image
      
      // Hero image background (placeholder if no photos)
      if (customization.propertyPhotos && customization.propertyPhotos.length > 0) {
        try {
          const heroPhoto = customization.propertyPhotos[0];
          const photoData = heroPhoto.data.includes(',') 
            ? heroPhoto.data.split(',')[1] 
            : heroPhoto.data;
          
          const heroImage = await doc.embedPng(Buffer.from(photoData, 'base64'));
          const imageAspectRatio = heroImage.width / heroImage.height;
          
          let imageWidth = width;
          let imageHeight = headerHeight;
          
          if (imageAspectRatio > 1) {
            imageHeight = width / imageAspectRatio;
          } else {
            imageWidth = headerHeight * imageAspectRatio;
          }
          
          // Center the image
          const imageX = (width - imageWidth) / 2;
          const imageY = height - imageHeight;
          
          page.drawImage(heroImage, {
            x: imageX,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
          });
        } catch (e) {
          console.log("Hero image failed, using placeholder:", e.message);
        }
      }
      
      // Content section below hero image
      const contentStartY = height - headerHeight - 20;
      const contentHeight = contentStartY - 80; // Leave space for footer
      
      // Main content background - dark olive green
      page.drawRectangle({
        x: 0, y: 80,
        width, height: contentHeight,
        color: primaryColor,
      });
      
      // Add subtle border accent
      page.drawRectangle({
        x: 0, y: 80,
        width: 3, height: contentHeight,
        color: rgb(0.9, 0.85, 0.7), // Gold accent
      });
      
      // Content layout - two columns
      const leftColumnWidth = width * 0.35;
      const rightColumnWidth = width * 0.65;
      const leftColumnX = 20;
      const rightColumnX = leftColumnX + leftColumnWidth + 20;
      const contentY = contentStartY - 40;
      
      // Left column - additional photos
      if (customization.propertyPhotos && customization.propertyPhotos.length > 1) {
        const photoSize = 80;
        let photoY = contentY;
        
        for (let i = 1; i < Math.min(customization.propertyPhotos.length, 4); i++) {
          try {
            const photo = customization.propertyPhotos[i];
            const photoData = photo.data.includes(',') 
              ? photo.data.split(',')[1] 
              : photo.data;
            
            const photoImage = await doc.embedPng(Buffer.from(photoData, 'base64'));
            const aspectRatio = photoImage.width / photoImage.height;
            
            let drawWidth = photoSize;
            let drawHeight = photoSize;
            
            if (aspectRatio > 1) {
              drawHeight = photoSize / aspectRatio;
            } else {
              drawWidth = photoSize * aspectRatio;
            }
            
            page.drawImage(photoImage, {
              x: leftColumnX,
              y: photoY,
              width: drawWidth,
              height: drawHeight,
            });
            
            photoY -= photoSize + 15;
          } catch (e) {
            console.log(`Additional photo ${i} failed:`, e.message);
          }
        }
      }
      
      // Right column - content text
      let textY = contentY;
      
      // Title
      page.drawText(title, {
        x: rightColumnX,
        y: textY,
        size: 24,
        font: helveticaBold,
        color: textColor,
      });
      textY -= 35;
      
      // Special formatting for Open House flyers
      if (pageType === "openHouse") {
        // Event details section
        page.drawText("OPEN HOUSE EVENT", {
          x: rightColumnX,
          y: textY,
          size: 16,
          font: helveticaBold,
          color: textColor,
        });
        textY -= 25;
        
        // Add some sample event details (you can customize these)
        const eventDetails = [
          "Date: December 15th, 2024",
          "Time: 2:00 PM - 5:00 PM",
          "Location: Property Address"
        ];
        
        for (const detail of eventDetails) {
          page.drawText(detail, {
            x: rightColumnX,
            y: textY,
            size: 12,
            font: helvetica,
            color: textColor,
          });
          textY -= 18;
        }
        
        textY -= 15; // Extra spacing
      }
      
      // Agency name if provided
      if (customization.agencyName) {
        page.drawText(customization.agencyName, {
          x: rightColumnX,
          y: textY,
          size: 14,
          font: helvetica,
          color: textColor,
        });
        textY -= 25;
      }
      
      // Content text with better formatting
      const contentText = body || "";
      const maxLineLength = 60;
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
      for (const line of lines) {
        if (textY < 120) break; // Don't overflow into footer
        
        page.drawText(line, {
          x: rightColumnX,
          y: textY,
          size: 11,
          font: helvetica,
          color: textColor,
        });
        textY -= 16;
      }
      
      // Footer section
      const footerY = 80;
      
      // Footer background - dark olive green
      page.drawRectangle({
        x: 0, y: 0,
        width, height: footerY,
        color: primaryColor,
      });
      
      // Contact information
      let contactX = 36;
      const contactY = 50;
      
      if (customization.agentEmail) {
        page.drawText(`Contact: ${customization.agentEmail}`, {
          x: contactX,
          y: contactY,
          size: 10,
          font: helvetica,
          color: textColor,
        });
        contactX += 150;
      }
      
      // QR code if website link provided
      if (customization.websiteLink) {
        try {
          const QRCode = await import('qrcode');
          const qrDataUrl = await QRCode.toDataURL(customization.websiteLink, {
            width: 50,
            margin: 1,
            color: {
              dark: '#FFFFFF',
              light: '#2A4026'
            }
          });
          
          const qrImage = await doc.embedPng(qrDataUrl.split(',')[1]);
          page.drawImage(qrImage, {
            x: width - 70,
            y: 15,
            width: 50,
            height: 50,
          });
          
          page.drawText("Scan for details", {
            x: width - 70,
            y: 10,
            size: 8,
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
        size: 8,
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

