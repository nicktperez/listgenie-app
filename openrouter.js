// pages/openrouter.js
import { useState, useEffect } from 'react';

export default function OpenRouterPage() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const res = await fetch('/api/openrouter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: 'Write a real estate listing for a 3-bedroom house with ocean views.',
              },
            ],
          }),
        });

        const data = await res.json();
        setResponse(data);
      } catch (err) {
        setResponse({ error: 'Something went wrong: ' + err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchResponse();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>OpenRouter API Test</h1>
      {loading && <p>Loading...</p>}
      {response && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}