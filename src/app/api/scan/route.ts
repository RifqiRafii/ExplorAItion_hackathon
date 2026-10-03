import { NextRequest } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in .env.local' }), { status: 500 });
    }

    const { imageBase64 }: { imageBase64: string } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Tidak ada gambar yang diunggah' }), { status: 400 });
    }

    // Ekstrak tipe mime dan data base64
    const mimeTypeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.split(',')[1];

    const systemInstruction = 'Kamu adalah asisten ahli untuk pemilik warung. Analisis gambar yang dikirim pengguna. Jika itu adalah NOTA/STRUK BELANJA, ekstrak daftar barang beserta harganya secara terstruktur. Jika itu adalah FOTO RAK/ETALASE, analisis barang apa yang stoknya mulai menipis atau kosong. Jawab menggunakan bahasa Indonesia yang rapi, dan format hasilnya menggunakan Markdown.';

    const { text } = await generateContentWithFallback([
      'Tolong analisis gambar ini dan berikan laporannya.',
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ], { systemInstruction });

    return new Response(JSON.stringify({ result: text }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in Scan API:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Gagal menganalisis gambar dengan AI' }), { status: 500 });
  }
}
