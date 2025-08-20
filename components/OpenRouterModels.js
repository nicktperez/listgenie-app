"use client";

import { useEffect, useState } from "react";

export default function OpenRouterModels() {
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/openrouter/models");
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        setModels(data.data || []);
      } catch (err) {
        setError("Failed to load models.");
        console.error("Error fetching models:", err);
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
    return <p className="text-red-500">{error}</p>;
  }

  if (!models.length) {
    return <p className="text-gray-500">No models found.</p>;
  }

  return (
    <ul className="space-y-2">
      {models.map((model) => (
        <li key={model.id} className="border p-3 rounded shadow-sm">
          <strong>{model.name || model.id}</strong>
          <p className="text-sm text-gray-600">{model.description}</p>
        </li>
      ))}
    </ul>
  );
}
