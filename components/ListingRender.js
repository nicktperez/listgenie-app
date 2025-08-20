// components/ListingRender.js
import { useMemo, useState } from "react";
import {
  normalize,
  stripMarkdown,
  toParagraphs,
  toBullets,
  bulletOnlyLines,
} from "../utils/listingHelpers";

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
    const filename = (title || "listing").toLowerCase().replace(/[^a-z0-9]+/gi, "-") + ".txt";
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
