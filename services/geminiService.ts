
import { GoogleGenAI, Type } from "@google/genai";
import { MODELS, SYSTEM_INSTRUCTIONS } from "../constants";
import { Confidence, Flashcard, StudyCategory } from "../types";

export const geminiService = {
  // Generate high-fidelity educational content from user notes
  async generateStudyContent(topic: string, rawText: string, category: StudyCategory) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: MODELS.COMPLEX_REASONING,
      contents: `Generate a study set for the topic: "${topic}" within the field of ${category}. 
      Use the following source material to extract key concepts and create high-quality flashcards:
      
      "${rawText}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS.GENERATOR,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: Object.values(Confidence) }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  // Socratic mentor interaction using chat history and context
  async getSocraticTutorResponse(history: { role: string, parts: { text: string }[] }[], context: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const chat = ai.chats.create({
      model: MODELS.TEXT_TASKS,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTIONS.SOCRATIC_TUTOR}\nContext for the lesson: ${context}`,
      }
    });

    const lastMessage = history[history.length - 1]?.parts[0].text;
    const response = await chat.sendMessage({ message: lastMessage || '' });
    return response.text || '';
  },

  // Dedicated hint generation logic
  async getSocraticHint(history: { role: string, parts: { text: string }[] }[], context: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const chat = ai.chats.create({
      model: MODELS.TEXT_TASKS,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTIONS.SOCRATIC_TUTOR}\nContext for the lesson: ${context}\n\nTask: The student is asking for a hint. Do NOT give the answer. Instead, provide a small nudge, an analogy, or a guiding question that helps them move forward from where they are stuck.`,
      }
    });

    const response = await chat.sendMessage({ message: "Can you give me a small hint to help me think about this correctly?" });
    return response.text || '';
  }
};
