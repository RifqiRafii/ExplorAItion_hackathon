import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const genAI = new GoogleGenerativeAI(apiKey);

export const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash'];

export interface FallbackOptions {
  systemInstruction?: string;
}

export async function generateContentWithFallback(
  contents: any,
  options: FallbackOptions = {}
): Promise<{ text: string; modelName: string }> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemInstruction,
      });

      const result = await model.generateContent(contents);
      const response = await result.response;
      return { text: response.text(), modelName };
    } catch (err: any) {
      console.warn(`Model ${modelName} failed, trying next candidate:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Semua model AI sedang sibuk. Silakan coba sesaat lagi.');
}

export async function startChatWithFallback(
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  prompt: string,
  options: FallbackOptions = {}
): Promise<{ text: string; modelName: string }> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemInstruction,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return { text: response.text(), modelName };
    } catch (err: any) {
      console.warn(`Chat model ${modelName} failed, trying next candidate:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Semua model AI sedang sibuk. Silakan coba sesaat lagi.');
}
