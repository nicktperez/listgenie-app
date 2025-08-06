// pages/openrouter.js
import { useState, useEffect } from 'react';

export default function OpenRouterPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
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
        setResult(data);
      } catch (error) {
        setResult({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchAI();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">OpenRouter Test</h1>
      {loading && <p>Loading...</p>}
      {result && (
        <pre className="bg-gray-100 p-4 rounded max-w-2xl text-left overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
