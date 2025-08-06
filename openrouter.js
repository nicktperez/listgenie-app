// /pages/openrouter.js

import Head from "next/head";

export async function getServerSideProps() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    const data = await response.json();

    if (!Array.isArray(data.data)) {
      throw new Error("Invalid data format from OpenRouter");
    }

    return {
      props: {
        models: data.data,
        error: null,
      },
    };
  } catch (err) {
    console.error("Error fetching models:", err);
    return {
      props: {
        models: [],
        error: err.message || "Unknown error",
      },
    };
  }
}

export default function OpenRouterPage({ models, error }) {
  return (
    <>
      <Head>
        <title>OpenRouter AI Models</title>
      </Head>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">OpenRouter AI Models</h1>

        {error && (
          <div className="text-red-500 font-medium mb-4">
            Failed to load models: {error}
          </div>
        )}

        {!error && models.length === 0 && (
          <div className="text-gray-500">No models available.</div>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {models.map((model) => (
            <li
              key={model.id}
              className="border rounded-xl p-4 hover:shadow transition"
            >
              <h2 className="text-lg font-semibold">{model.id}</h2>
              <p className="text-sm text-gray-600">{model.description}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}