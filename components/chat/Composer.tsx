import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FiSend, FiLoader } from 'react-icons/fi';

interface ComposerProps {
  onSend: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

interface ComposerRef {
  setInput: (input: string) => void;
  clearInput: () => void;
  focus: () => void;
}

const Composer = forwardRef<ComposerRef, ComposerProps>(({
  onSend,
  loading = false,
  placeholder = "Paste a property description or type details…",
  disabled = false
}, ref) => {
  const [input, setInput] = useState('');

  useImperativeHandle(ref, () => ({
    setInput,
    clearInput: () => setInput(''),
    focus: () => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    },
  }));

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setInput('');
  }, [input, onSend, loading, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isSubmitDisabled = !input.trim() || loading || disabled;

  return (
    <section className="composer-field">
      <div className="field-card">
        <textarea
          rows={4}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="chat-textarea"
        />
        <div className="field-actions">
          <div className="keyboard-hint">
            Press ⌘+Enter to send
          </div>
          <button
            className={`send-btn ${isSubmitDisabled ? 'disabled' : ''}`}
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <FiLoader className="spinner" />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <FiSend className="send-icon" />
                <span>Generate Listing</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
});

Composer.displayName = 'Composer';

export default Composer;
