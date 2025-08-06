// /pages/openrouter.js
import Head from "next/head";

export async function getServerSideProps() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");

    // Check if it's a successful fetch
    if (!response.ok) {
      return {
        props: {
          models: [],
          error: `OpenRouter API error: ${response.status} ${response.statusText}`,
        },
      };
    }

    const data = await response.json();

    if (!Array.isArray(data.data)) {
      return {
        props: {
          models: [],
          error: "Invalid data format returned from OpenRouter",
        },
      };
    }

    return {
      props: {
        models: data.data,
        error: null,
      },
    };
  } catch (err) {
    return {
      props: {
        models: [],
        error: err.message || "Unknown error occurred",
      },
    };
  }
}

export default function OpenRouterPage({ models, error }) {
  return (
    <>
      <Head>
        <title>OpenRouter Models | ListGenie.ai</title>
      </Head>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Available Models via OpenRouter</h1>

        {error && (
          <p className="text-red-600 mb-4">Error: {error}</p>
        )}

        {models.length === 0 && !error && (
          <p className="text-gray-600">No models available at the moment.</p>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {models.map((model) => (
            <li key={model.id} className="border rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{model.id}</h2>
              <p className="text-sm text-gray-600">{model.description}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}