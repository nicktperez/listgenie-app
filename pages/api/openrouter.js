// pages/api/openrouter.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();

    res.status(200).json({ models: data.models || [] });
  } catch (error) {
    console.error("OpenRouter API error:", error);
    res.status(500).json({ error: "Failed to fetch models" });
  }
}