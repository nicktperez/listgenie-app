// Utility functions for listing rendering

/** Soft-clean: normalize whitespace, fix repeated newlines, trim bullets spacing */
export function normalize(text) {
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

/** Remove simple list markers and markdown formatting. */
export function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^[-*•]\s+/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

/** Convert into neat paragraphs (ensures blank lines between logical blocks) */
export function toParagraphs(text) {
  if (!text) return "";
  if (/^[-*•]\s+/m.test(text)) {
    return text
      .split(/\n+/)
      .map((l) => l.replace(/^[-*•]\s+/, ""))
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .replace(/([.!?])\s*(?=[A-Z(])/g, "$1 ")
      .trim();
  }
  return text.replace(/\n{2,}/g, "\n\n").trim();
}

/** Convert into bullets; if text already has bullets, return normalized bullets. */
export function toBullets(text) {
  if (!text) return "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.some((l) => /^[-*•]\s+/.test(l))) {
    return lines
      .map((l) => (/^[-*•]\s+/.test(l) ? l : `- ${l}`))
      .join("\n");
  }

  const sentences = sentenceSplit(text);
  const bullets = sentences
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => `- ${s}`);
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

/** Return bullets-only text without markers. */
export function bulletOnlyLines(bulleted) {
  return bulleted.replace(/^[-*•]\s+/gm, "").trim();
}

/** Lightweight sentence splitter (keeps abbreviations a bit safer). */
function sentenceSplit(t) {
  let s = t.replace(/\s+/g, " ").trim();
  const parts = s.split(/(?<=[.!?])\s+(?=[A-Z0-9])/g);
  const merged = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (last && last.length < 40) {
      merged[merged.length - 1] = `${last} ${p}`.trim();
    } else {
      merged.push(p.trim());
    }
  }
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
