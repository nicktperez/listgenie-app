export default async function handler(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    res.status(500).json({ error: "Failed to load models" });
  }
}