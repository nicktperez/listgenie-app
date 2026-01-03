import { GoogleGenerativeAI } from "@google/generative-ai";

export class GoogleFlyerEngine {
    constructor() {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY");
        }
        this.genAI = new GoogleGenerativeAI(apiKey || "");
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    async generateFlyer(data) {
        const { agentInfo, propertyInfo, style, photos } = data;

        const prompt = `
      You are a world-class UI/UX Designer and Real Estate Marketer. 
      Your task is to create a SINGLE, SELF-CONTAINED HTML file for a luxury real estate flyer.
      
      **CRITICAL TECHNICAL REQUIREMENT:**
      - You MUST import Tailwind CSS via this CDN link in the <head>: <script src="https://cdn.tailwindcss.com"></script>
      - Use Tailwind classes for ALL styling. Do not write custom CSS unless absolutely necessary for a specific effect.
      - The design must be responsive but optimized for a standard print ratio (roughly 8.5x11 aspect ratio) on desktop.
      - Use Google Fonts (e.g., 'Playfair Display' for headers, 'Inter' for body) via CDN.

      **DESIGN AESTHETIC:**
      - Style: **${style}** (e.g., if 'Modern', use ample whitespace, rounded corners, and sans-serifs. If 'Luxury', use dark backgrounds, golds, and serifs).
      - Visuals: Use a massive "Hero" image section at the top.
      - Features: Use grid layouts (grid-cols-2 or grid-cols-3) to show features with icons.
      - Call to Action: A distinct, high-contrast footer with the agent's profile.
      - Vibe: Expensive, Exclusive, Professional. "Apple-style" design quality.

      **CONTENT TO INCLUDE:**
      1. **Headline**: catchy and inviting based on: "${propertyInfo.address}"
      2. **Property Details**:
         - Price: ${propertyInfo.price}
         - Specs: ${propertyInfo.bedrooms} Beds | ${propertyInfo.bathrooms} Baths | ${propertyInfo.sqft} SqFt
         - Type: ${propertyInfo.type}
         - Address: ${propertyInfo.address}
      3. **Key Features**: ${propertyInfo.features?.join(', ') || 'Modern Amenities, Spacious Living, Prime Location'}
      4. **Agent Profile**:
         - Name: ${agentInfo.name}
         - Agency: ${agentInfo.agency}
         - Contact: ${agentInfo.phone} | ${agentInfo.email}
         - Website: ${agentInfo.website}
      
      **IMAGE PLACEHOLDERS (Use strictly these standard Unsplash URLs):**
      - Main Hero: https://images.unsplash.com/photo-1600596542815-2a4d04774c13?q=80&w=2000&auto=format&fit=crop
      - Kitchen: https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop
      - Living Room: https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1000&auto=format&fit=crop
      - Agent Avatar: https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500&auto=format&fit=crop

      **OUTPUT FORMAT:**
      - Return ONLY the raw HTML string. 
      - Start directly with <!DOCTYPE html>.
      - Do not wrap in markdown code blocks (\`\`\`).
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up markdown if present
            text = text.replace(/```html/g, '').replace(/```/g, '').trim();

            return {
                success: true,
                flyer: {
                    html: text,
                    css: '', // CSS is embedded in HTML
                    metadata: { model: 'gemini-1.5-pro' }
                }
            };
        } catch (error) {
            console.error("GoogleFlyerEngine error:", error);
            throw new Error("Failed to generate flyer with Google AI: " + error.message);
        }
    }
}
