
import { GoogleGenAI } from "@google/genai";
import { Language } from "../translations";

// Always use named parameter for apiKey and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPhotographyConsultation = async (prompt: string, budget: number, lang: Language) => {
  const languageNames = {
    en: "English",
    mk: "Macedonian",
    sq: "Albanian"
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional media consultant for 'DRIM TEAMS'. 
      A client is interested in our photography or videography services. 
      
      Our Photography pricing: 25 €/hour, 100 €/session, 200 €/photo-book.
      Our Videography pricing: 25 €/hour, 250 €/Love-Story, 300 €/Crane (per location).
      Drone services are 100 € per session for both.
      
      The client's current selected budget for the active service is ${budget} €.
      
      IMPORTANT: Respond ONLY in ${languageNames[lang]}.
      
      User request: "${prompt}"
      
      Provide a creative and helpful response in ${languageNames[lang]}. Suggest how they can best spend their ${budget} € budget based on their request. 
      Be encouraging, professional, and concise. Keep formatting clean with bullet points if needed.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    // The text content is obtained by accessing the .text property directly
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    const errorMessages = {
      en: "I'm sorry, I'm having a bit of trouble connecting to our creative database. Please feel free to reach out to us directly!",
      mk: "Се извинувам, имам проблем со поврзувањето со нашата база на податоци. Ве молиме контактирајте нè директно!",
      sq: "Më vjen keq, po kam pak vështirësi në lidhjen me bazën tonë të të dhënave kreative. Ju lutemi na kontaktoni drejtpërdrejt!"
    };
    return errorMessages[lang];
  }
};
