"use client";

import React, { useEffect, useState } from "react";

export default function OpenRouterModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/openrouter");
        const data = await res.json();

        if (!data || !Array.isArray(data.models)) {
          throw new Error("Unexpected API response format");
        }

        setModels(data.models);
      } catch (err) {
        console.error("Failed to fetch OpenRouter models:", err);
        setError("Failed to load models.");
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading models...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!models.length) {
    return <p className="text-gray-600">No models found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map((model) => (
        <div
          key={model.id}
          className="border border-gray-300 rounded-md p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold">{model.id}</h2>
          <p className="text-sm text-gray-600">{model.description || "No description available."}</p>
        </div>
      ))}
    </div>
  );
}
