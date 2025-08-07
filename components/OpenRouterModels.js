"use client";

import { useEffect, useState } from "react";

export default function OpenRouterModels() {
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/openrouter");
        const data = await res.json();

        // ✅ FIX: use `data.data`, not `data.models`
        setModels(data.models || data.data || []);
      } catch (err) {
        setError("Failed to load models.");
        console.error("Error fetching models:", err);
      }
    };

    fetchModels();
  }, []);

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