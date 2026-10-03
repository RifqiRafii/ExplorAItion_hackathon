import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const genAI = new GoogleGenerativeAI(apiKey);

export const CANDIDATE_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];

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
  options: FallbackOptions & { tools?: any; executeFunction?: (name: string, args: any) => Promise<any> } = {}
): Promise<{ text: string; modelName: string }> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemInstruction,
        tools: options.tools,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      
      // Handle Function Calling
      const functionCalls = result.response.functionCalls();
      if (functionCalls && functionCalls.length > 0 && options.executeFunction) {
        const call = functionCalls[0];
        const apiResponse = await options.executeFunction(call.name, call.args);
        
        // Alih-alih memanggil Gemini lagi yang rawan 503/error,
        // kita langsung kembalikan pesan sukses dari eksekusi fungsi ke user.
        return { 
          text: apiResponse.message || "Fungsi berhasil dijalankan.", 
          modelName 
        };
      }

      return { text: result.response.text(), modelName };
    } catch (err: any) {
      console.warn(`Chat model ${modelName} failed, trying next candidate:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Semua model AI sedang sibuk. Silakan coba sesaat lagi.');
}
