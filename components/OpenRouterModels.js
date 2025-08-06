"use client";

import { useEffect, useState } from "react";

export default function OpenRouterModels() {
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();
        setModels(data.data || []);
      } catch (err) {
        setError("Failed to fetch models.");
      }
    };

    fetchModels();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!models.length) return <p>Loading models...</p>;

  return (
    <ul className="space-y-4">
      {models.map((model) => (
        <li key={model.id} className="p-4 border rounded">
          <h2 className="font-bold">{model.id}</h2>
          <p>{model.description}</p>
        </li>
      ))}
    </ul>
  );
}