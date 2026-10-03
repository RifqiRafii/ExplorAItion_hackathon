import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { startChatWithFallback } from '@/lib/gemini';
import type { ChatMessage, UserSession } from '@/types';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in .env.local' }), { status: 500 });
    }

    const { messages }: { messages: ChatMessage[] } = await req.json();
    
    // Get the latest message
    const prompt = messages[messages.length - 1].content;
    
    // ======== MULAI IMPLEMENTASI RAG ========
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('userSession');
    let contextData = '';

    if (sessionCookie) {
      const user: UserSession = JSON.parse(sessionCookie.value);
      const userId = user.id;

      // Ambil data stok barang dari Supabase
      const { data: products } = await supabase
        .from('products')
        .select('name, stock, price, unit')
        .eq('umkm_id', userId);

      // Ambil data pelanggan yang kasbon dari Supabase
      const { data: debts } = await supabase
        .from('debts')
        .select('customer_name, amount, status, due_date')
        .eq('umkm_id', userId)
        .eq('status', 'UNPAID');

      // Susun Konteks (Prompt Engineering / RAG System Instructions)
      contextData = `
INFORMASI TOKO / UMKM:
- Nama Toko: ${user.store_name || user.warung_name || 'Toko Anda'}
- Pemilik: ${user.owner_name || 'Anda'}

DATA STOK BARANG SAAT INI:
${products && products.length > 0 ? products.map(p => `- ${p.name}: ${p.stock} ${p.unit} (Harga: Rp${p.price})`).join('\n') : 'Belum ada data barang.'}

DATA PIUTANG BELUM LUNAS (KASBON):
${debts && debts.length > 0 ? debts.map(d => `- ${d.customer_name} berutang Rp${d.amount} (Jatuh tempo: ${new Date(d.due_date).toLocaleDateString()})`).join('\n') : 'Tidak ada piutang yang belum lunas.'}

INSTRUKSI UNTUK AI:
Kamu adalah asisten pintar bernama WarungCopilot khusus untuk pemilik warung. 
Selalu gunakan data "INFORMASI TOKO", "DATA STOK BARANG", dan "DATA PIUTANG" di atas untuk menjawab pertanyaan pengguna dengan akurat (Jangan mengarang data!).
Gunakan bahasa Indonesia yang santai, ramah, dan sehari-hari (seperti mengobrol di WhatsApp).
Jika ditanya tentang sisa stok atau tagihan pelanggan, langsung sebutkan detail dari data di atas.
`;
    } else {
      contextData = 'Kamu adalah asisten pintar bernama WarungCopilot. Jawab pertanyaan pengguna dengan ramah dalam bahasa Indonesia yang santai.';
    }
    // ======== SELESAI IMPLEMENTASI RAG ========
    
    // Format history percakapan untuk Gemini
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start Chat dan Kirim Prompt dengan Fallback Otomatis
    const { text } = await startChatWithFallback(history, prompt, { systemInstruction: contextData });

    return new Response(JSON.stringify({ role: 'assistant', content: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in Gemini API:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to communicate with AI' }), { status: 500 });
  }
}
