import { GoogleGenAI } from "@google/genai";

export const generateBio = async (apiKey: string, currentBio: string, context?: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    You are a professional copywriter for personal portfolios.
    
    Current Bio: "${currentBio}"
    Additional Context/Keywords: "${context || 'Make it professional yet creative'}"
    
    Task: Rewrite the current bio to be more engaging, concise, and professional. 
    It should be suitable for a minimalist 'Link in Bio' page. 
    Keep it under 15 words if possible. Do not add quotes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};