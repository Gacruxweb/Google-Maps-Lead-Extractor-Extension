import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

// Lazy initialize the SDK client to prevent startup crashes if GEMINI_API_KEY is not defined yet.
let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not available in the environment. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function scoreLeadsWithGemini(leads: Lead[]): Promise<Lead[]> {
  try {
    const ai = getAi();
    const prompt = `Analyze these business leads scraped from Google Maps. Give a score (A, B, C) and summary suggestions for outreach of each lead based on their rating, location, presence of website, and phone numbers.
    
Leads:
${JSON.stringify(leads.map(l => ({
  id: l.id,
  name: l.name,
  website: l.website,
  phone: l.phone,
  rating: l.rating,
  reviewsCount: l.reviewsCount,
  query: l.query,
  address: l.address
})), null, 2)}

Provide a JSON response containing an array of scored leads. Keep responses focused and efficient.
Include:
- id: match the lead id
- score: "A", "B", or "C"
- explanation: a short (1-2 sentence) reason for this score
- suggestions: dynamic tactical outreach suggestion (e.g. "needs SEO", "pitch website redesign", "excellent prospects for Google review boosting").`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scoredLeads: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  score: { type: Type.STRING, enum: ["A", "B", "C"] },
                  explanation: { type: Type.STRING },
                  suggestions: { type: Type.STRING }
                },
                required: ["id", "score", "explanation", "suggestions"]
              }
            }
          },
          required: ["scoredLeads"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini AI.");
    }

    const data = JSON.parse(text);
    const scoredList = data.scoredLeads || [];
    
    // Map scores back to original leads
    return leads.map(lead => {
      const match = scoredList.find((item: any) => item.id === lead.id);
      if (match) {
        return {
          ...lead,
          aiScore: match.score,
          aiScoreExplanation: match.explanation,
          aiSuggestedApproach: match.suggestions
        };
      }
      return lead;
    });
  } catch (error) {
    console.error("Gemini Lead Scoring Error:", error);
    throw error;
  }
}

export async function generateColdEmailDraft(lead: Lead, servicePitch: string): Promise<string> {
  try {
    const ai = getAi();
    
    const prompt = `Write a highly engaging, personalized cold outreach email for this Google Maps business lead:
- Business Name: ${lead.name}
- Industry/Query: ${lead.query}
- Phone: ${lead.phone || "No phone listed"}
- Website: ${lead.website || "No website"}
- Rating: ${lead.rating} out of 5 (${lead.reviewsCount} reviews)
- Address: ${lead.address}

The service/product we want to pitch is: "${servicePitch}"

Keep the email short, friendly, and non-spammy. Ensure it has:
1. An incredibly catchy, hyper-relevant subject line related to their specific rating or local presence.
2. A warm personalized opening reference to their Google reviews (e.g. congrats on ${lead.reviewsCount} reviews!).
3. A clear transition to why we're reaching out: "${servicePitch}".
4. A low-friction call to action (like a quick 5-min phone call or responding with a 'yes').
5. Professional placeholder for sender signature.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, warm B2B sales copywriter specializing in highly personalized, conversion-optimized local business outreach."
      }
    });

    return response.text || "Failed to generate pitch.";
  } catch (error) {
    console.error("Gemini Pitch Generation Error:", error);
    throw error;
  }
}
