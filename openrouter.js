import Head from "next/head";

// SERVER-SIDE: fetch model data from OpenRouter
export async function getServerSideProps() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");

    if (!res.ok) {
      return {
        props: {
          models: [],
          error: `Failed to fetch OpenRouter models: ${res.status} ${res.statusText}`,
        },
      };
    }

    const data = await res.json();

    // Sanity check
    if (!Array.isArray(data.data)) {
      return {
        props: {
          models: [],
          error: "OpenRouter returned invalid model data.",
        },
      };
    }

    return {
      props: {
        models: data.data,
        error: null,
      },
    };
  } catch (error) {
    return {
      props: {
        models: [],
        error: error.message || "Unexpected error occurred",
      },
    };
  }
}

// CLIENT-SIDE: render passed model data
export default function OpenRouterPage({ models, error }) {
  return (
    <>
      <Head>
        <title>OpenRouter Models | ListGenie.ai</title>
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">OpenRouter Models</h1>

        {error && (
          <div className="text-red-600 mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!error && models.length === 0 && (
          <p>No models found.</p>
        )}

        <ul className="space-y-4">
          {models.map((model) => (
            <li
              key={model.id}
              className="p-4 border border-gray-200 rounded shadow-sm"
            >
              <h2 className="text-lg font-semibold">{model.id}</h2>
              {model.description && (
                <p className="text-sm text-gray-600">{model.description}</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}