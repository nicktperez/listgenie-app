import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FiSend, FiLoader } from 'react-icons/fi';

interface ComposerProps {
  onSend: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
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
  disabled = false,
  compact = false
}, ref) => {
  const [input, setInput] = useState('');

  useImperativeHandle(ref, () => ({
    setInput,
    clearInput: () => setInput(''),
    focus: () => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    }
  }), []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || disabled) return;
    
    onSend(input.trim());
    setInput('');
  }, [input, loading, disabled, onSend]);

  return (
    <form onSubmit={handleSubmit} className={`composer ${compact ? 'composer-compact' : ''}`}>
      <div className="composer-input-wrapper">
        <textarea
          ref={(el) => {
            if (el) el.style.height = 'auto';
            if (el) el.style.height = el.scrollHeight + 'px';
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="composer-textarea"
          rows={compact ? 2 : 4}
          style={{ resize: 'none' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || disabled}
          className="composer-send-btn"
        >
          {loading ? (
            <>
              <FiLoader className="loading-icon" />
            </>
          ) : (
            <>
              <FiSend />
              <span className="button-text">
                {input.trim() ? 'Generate Listing' : 'Send'}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
});

Composer.displayName = 'Composer';

export default Composer;
