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
    <section className="composer bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <textarea
          rows={3}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Press ⌘+Enter to send
          </div>
          <button
            className={`send flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              isSubmitDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" />
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
