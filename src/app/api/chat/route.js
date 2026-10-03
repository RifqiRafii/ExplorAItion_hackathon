import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in .env.local' }), { status: 500 });
    }

    const { messages } = await req.json();
    
    // Get the latest message
    const prompt = messages[messages.length - 1].content;
    
    // Convert previous messages to Gemini history format if needed
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // For simplicity, we just pass the latest prompt
    // In a real app, you would use startChat() with history
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ role: 'assistant', content: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in Gemini API:', error);
    return new Response(JSON.stringify({ error: 'Failed to communicate with AI' }), { status: 500 });
  }
}
