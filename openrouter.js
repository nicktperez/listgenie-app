// pages/openrouter.js
"use client"; // Only needed in app directory, but safe here

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Head from "next/head";

export const dynamic = "force-dynamic"; // 💥 Tell Vercel NOT to prerender this page

export default function OpenRouterPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/models");
        if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
        const json = await res.json();
        setModels(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  return (
    <>
      <Head>
        <title>OpenRouter Models</title>
      </Head>
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Available OpenRouter Models</h1>

        {loading && <p>Loading models...</p>}
        {error && (
          <div className="bg-red-100 text-red-800 p-4 mb-4 rounded">{error}</div>
        )}

        {!loading && !error && models.length === 0 && (
          <p>No models available at the moment.</p>
        )}

        <ul className="space-y-4">
          {models.map((model) => (
            <li
              key={model.id}
              className="p-4 bg-white border rounded shadow"
            >
              <h2 className="text-lg font-semibold">{model.id}</h2>
              {model.description && (
                <p className="text-gray-700">{model.description}</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}