// pages/openrouter.js

import Head from "next/head";

export async function getServerSideProps() {
  let models = [];
  let error = null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");

    // Confirm that `res` is a valid Response object
    if (!res.ok) {
      error = `API responded with status ${res.status}`;
    } else {
      const data = await res.json();

      // Ensure data format is as expected
      if (Array.isArray(data.data)) {
        models = data.data;
      } else {
        error = "Unexpected response format from OpenRouter API.";
      }
    }
  } catch (err) {
    error = "Failed to fetch models: " + err.message;
  }

  return {
    props: {
      models,
      error,
    },
  };
}

export default function OpenRouterPage({ models, error }) {
  return (
    <>
      <Head>
        <title>OpenRouter Models</title>
      </Head>
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-4">Available OpenRouter Models</h1>

        {error && (
          <div className="text-red-500 border p-4 rounded bg-red-50">
            Error: {error}
          </div>
        )}

        {!error && models.length === 0 && <p>No models found.</p>}

        <ul className="space-y-4">
          {models.map((model) => (
            <li
              key={model.id}
              className="p-4 bg-white rounded shadow border border-gray-200"
            >
              <h2 className="text-lg font-semibold">{model.id}</h2>
              {model.description && (
                <p className="text-sm text-gray-700">{model.description}</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}