// components/ListingRender.js
import { useMemo, useState } from "react";

/**
 * Pretty print of a generated listing with formatting toggles, counts,
 * copy/export actions, and optional save callback.
 *
 * Props:
 * - title?: string
 * - content: string                     // the AI output
 * - meta?: { tone?: string, created_at?: string }
 * - onSave?: (nextText: string) => void // optional
 */
export default function ListingRender({ title, content = "", meta = {}, onSave }) {
  const [mode, setMode] = useState("paragraph"); // "paragraph" | "bullets"

  // Normalize/clean the content a bit
  const cleaned = useMemo(() => normalize(content), [content]);

  // Build the display text based on mode
  const displayText = useMemo(() => {
    return mode === "bullets" ? toBullets(cleaned) : toParagraphs(cleaned);
  }, [mode, cleaned]);

  const counts = useMemo(() => {
    const plain = stripMarkdown(displayText);
    const words = (plain.match(/\b[\w’'-]+\b/g) || []).length;
    const chars = plain.replace(/\s+/g, " ").trim().length;
    return { words, chars };
  }, [displayText]);

  function copy(text) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function downloadTxt(text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `${(title || "listing").toLowerCase().replace(/[^a-z0-9]+/gi, "-")  }.txt`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const created = meta.created_at ? new Date(meta.created_at).toLocaleString() : null;

  return (
    <div className="card" style={{ padding: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div className="chat-title" style={{ fontSize: 18, lineHeight: 1.2, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title || "Generated Listing"}
          </div>
          <div className="chat-sub" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {meta.tone ? <span className="badge">{meta.tone}</span> : null}
            {created ? <span className="chat-sub">• {created}</span> : null}
            <span className="chat-sub">• {counts.words} words</span>
            <span className="chat-sub">{counts.chars} chars</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setMode("paragraph")} disabled={mode === "paragraph"}>
            Paragraph
          </button>
          <button className="btn" onClick={() => setMode("bullets")} disabled={mode === "bullets"}>
            Bullets
          </button>

          <div style={{ width: 1, background: "rgba(255,255,255,.12)" }} />

          <button className="btn" onClick={() => copy(stripMarkdown(toParagraphs(cleaned)))}>
            Copy
          </button>
          <button className="btn" onClick={() => copy(bulletOnlyLines(toBullets(cleaned)))}>
            Copy bullets
          </button>
          <button className="btn" onClick={() => downloadTxt(stripMarkdown(displayText))}>
            Download .txt
          </button>

          {onSave ? (
            <button className="btn" onClick={() => onSave(stripMarkdown(displayText))}>
              Save
            </button>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="textarea" style={{ whiteSpace: "pre-wrap" }}>
        {displayText}
      </div>
    </div>
  );
}

/* ---------------------- helpers ---------------------- */

/** Soft-clean: normalize whitespace, fix repeated newlines, trim bullets spacing */
function normalize(text) {
  if (!text) return "";
  let t = text.replace(/\r\n/g, "\n").replace(/\t/g, "  ");
  // Collapse 3+ newlines to 2
  t = t.replace(/\n{3,}/g, "\n\n");
  // Remove leading/trailing whitespace on lines
  t = t
    .split("\n")
    .map((l) => l.replace(/\s+$/g, "").replace(/^\s+/g, ""))
    .join("\n")
    .trim();
  return t;
}

function stripMarkdown(text) {
  if (!text) return "";
  // Remove simple list markers and markdown bold/italics/backticks
  return text
    .replace(/^[-*•]\s+/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

/** Convert into neat paragraphs (ensures blank lines between logical blocks) */
function toParagraphs(text) {
  if (!text) return "";
  // If already looks like bullets, collapse bullets back into sentences/paragraphs
  if (/^[-*•]\s+/m.test(text)) {
    return text
      .split(/\n+/)
      .map((l) => l.replace(/^[-*•]\s+/, ""))
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .replace(/([.!?])\s*(?=[A-Z(])/g, "$1 ")
      .trim();
  }
  // Ensure single blank line between paragraphs
  return text.replace(/\n{2,}/g, "\n\n").trim();
}

/** Convert into bullets; if text already has bullets, return normalized bullets. */
function toBullets(text) {
  if (!text) return "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // If already bulleted, normalize
  if (lines.some((l) => /^[-*•]\s+/.test(l))) {
    return lines
      .map((l) => (/^[-*•]\s+/.test(l) ? l : `- ${l}`))
      .join("\n");
  }

  // Otherwise split into sentence-ish chunks and bullet them
  const sentences = sentenceSplit(text);
  const bullets = sentences
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => `- ${s}`);
  // Fallback: if we somehow got nothing, just bullet paragraphs/lines
  if (!bullets.length) {
    return text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `- ${l}`)
      .join("\n");
  }
  return bullets.join("\n");
}

/** Return bullets-only text without markers (for “Copy bullets”). */
function bulletOnlyLines(bulleted) {
  return bulleted.replace(/^[-*•]\s+/gm, "").trim();
}

/** Lightweight sentence splitter (keeps abbreviations a bit safer). */
function sentenceSplit(t) {
  // First, normalize whitespace
  const s = t.replace(/\s+/g, " ").trim();

  // Split on punctuation followed by a space + capital or digit (very heuristic)
  const parts = s.split(/(?<=[.!?])\s+(?=[A-Z0-9])/g);

  // Combine tiny fragments with neighbors
  const merged = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (last && last.length < 40) {
      merged[merged.length - 1] = `${last} ${p}`.trim();
    } else {
      merged.push(p.trim());
    }
  }

  // Limit extremely long sentences by breaking on semicolons/commas
  const final = [];
  for (const m of merged) {
    if (m.length > 180 && /,|;/.test(m)) {
      const mini = m.split(/;|,(?=\s)/).map((x) => x.trim()).filter(Boolean);
      final.push(...mini);
    } else {
      final.push(m);
    }
  }
  return final;
}