// pages/api/flyer.js
// Generates a simple PDF flyer (Standard and/or Open House) from the latest assistant output.
// No external deps: uses pdf-lib to draw text. If both flyers selected, returns a single PDF with 2 pages.

import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

async function createPdf({ standardText, openHouseText }) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const makePage = (title, body) => {
    const page = doc.addPage([612, 792]); // Letter portrait
    const { width, height } = page.getSize();

    // Header
    page.drawRectangle({
      x: 0, y: height - 72,
      width, height: 72,
      color: rgb(0.1, 0.12, 0.18),
    });
    page.drawText(title, {
      x: 36, y: height - 48,
      size: 20, font, color: rgb(0.95, 0.97, 1),
    });

    // Body text, wrap roughly at ~80 chars/line
    const maxWidth = width - 72;
    const words = (body || "").replace(/\r/g, "").split(/\s+/);
    const lines = [];
    let line = "";
    const approxCharW = 6; // rough for Helvetica 12pt
    const maxChars = Math.floor(maxWidth / approxCharW);

    for (const w of words) {
      if ((line + " " + w).trim().length > maxChars) {
        lines.push(line.trim());
        line = w;
      } else {
        line += " " + w;
      }
    }
    if (line.trim()) lines.push(line.trim());

    let y = height - 96;
    for (const l of lines) {
      if (y < 72) {
        // new page if overflow
        y = height - 96;
        const p = doc.addPage([612, 792]);
        p.drawText(l, { x: 36, y, size: 12, font, color: rgb(0.1, 0.1, 0.12) });
        y -= 18;
      } else {
        page.drawText(l, { x: 36, y, size: 12, font, color: rgb(0.1, 0.1, 0.12) });
        y -= 18;
      }
    }
  };

  if (standardText) makePage("Property Flyer", standardText);
  if (openHouseText) makePage("Open House Flyer", openHouseText);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { flyers = [], content } = req.body || {};
    if (!flyers.length) {
      return res.status(400).json({ ok: false, error: "No flyers requested" });
    }

    const wantStandard = flyers.includes("standard");
    const wantOpenHouse = flyers.includes("openHouse");

    const baseText = pickBestText(content || {});
    const standardText = wantStandard ? baseText : "";
    const openHouseText = wantOpenHouse ? baseText : "";

    const pdf = await createPdf({ standardText, openHouseText });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="flyer${wantStandard && wantOpenHouse ? "-bundle" : ""}.pdf"`
    );
    return res.status(200).send(pdf);
  } catch (e) {
    console.error("/api/flyer error:", e);
    return res.status(500).json({ ok: false, error: "Failed to generate PDF" });
  }
}
