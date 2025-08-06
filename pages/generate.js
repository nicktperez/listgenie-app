
import { useState } from "react";

export default function Generate() {
  const [formData, setFormData] = useState({
    address: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    style: "",
    features: "",
  });

  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOutput(null);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    setOutput(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">List Generator</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="address" placeholder="Address" onChange={handleChange} required className="input" />
        <input name="bedrooms" placeholder="Bedrooms" onChange={handleChange} required className="input" />
        <input name="bathrooms" placeholder="Bathrooms" onChange={handleChange} required className="input" />
        <input name="sqft" placeholder="Square Footage" onChange={handleChange} required className="input" />
        <input name="style" placeholder="Style (e.g., Modern, Ranch)" onChange={handleChange} required className="input" />
        <textarea name="features" placeholder="Special Features" onChange={handleChange} className="input" />

        <button type="submit" className="bg-black text-white px-6 py-2 rounded" disabled={loading}>
          {loading ? "Generating..." : "Generate Listing"}
        </button>
      </form>

      {output && (
        <div className="mt-10 space-y-4">
          <div>
            <h2 className="font-bold">📄 Listing Description</h2>
            <p>{output.listing}</p>
          </div>
          <div>
            <h2 className="font-bold">✉️ Client Email</h2>
            <p>{output.email}</p>
          </div>
          <div>
            <h2 className="font-bold">📱 Social Media Post</h2>
            <p>{output.social}</p>
          </div>
        </div>
      )}
    </div>
  );
}
