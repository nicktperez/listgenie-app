import React, { useState, forwardRef, useImperativeHandle } from "react";

function Composer({ onSend, loading }, ref) {
  const [input, setInput] = useState("");

  useImperativeHandle(ref, () => ({
    setInput,
    clearInput: () => setInput(""),
  }));

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <section className="composer">
      <textarea
        rows={2}
        placeholder="Paste a property description or type details…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className="send" disabled={loading || !input.trim()} onClick={handleSubmit}>
        {loading ? "Generating…" : "Generate Listing"}
      </button>
    </section>
  );
}

export default forwardRef(Composer);
