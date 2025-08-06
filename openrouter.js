// pages/openrouter.js

import Head from "next/head";
import React from "react";

// ✅ This gets called *before* rendering the page
export async function getServerSideProps() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");

    if (!res.ok) {
      return {
        props: {
          models: [],
          error: `OpenRouter API error: ${res.status} ${res.statusText}`,
        },
      };
    }

    const data = await res.json();

    // Defensive check
    const models = Array.isArray(data.data) ? data.data : [];

    return {
      props: {
        models,
        error: null,
      },
    };
  } catch (err) {
    return {
      props: {
        models: [],
        error: `Fetch failed: ${err.message}`,
      },
    };
  }
}

export default function OpenRouterPage({ models, error }) {
  return (
    <>
      <Head>
        <title>OpenRouter Models</title>
      </Head>
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Available OpenRouter Models</h1>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        {!error && models.length === 0 && (
          <p>No models available at the moment.</p>
        )}

        <ul className="space-y-4">
          {models.map((model) => (
            <li key={model.id} className="p-4 bg-white border rounded shadow">
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