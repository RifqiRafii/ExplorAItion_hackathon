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
    let userId = null;

    if (sessionCookie) {
      const user: UserSession = JSON.parse(sessionCookie.value);
      userId = user.id;

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
    // ======== MULAI IMPLEMENTASI TOOLS RAG ========
    const tools = [{
      functionDeclarations: [
        {
          name: "kurangi_stok",
          description: "Gunakan fungsi ini setiap kali ada barang keluar dari warung (baik terjual lunas maupun kasbon). Ini akan mengurangi stok di database secara otomatis dan mencatatnya ke Buku Besar (Transaksi).",
          parameters: {
            type: "OBJECT",
            properties: {
              nama_barang: { type: "STRING", description: "Nama barang yang terjual. Harus cocok dengan nama di INFORMASI TOKO." },
              jumlah_terjual: { type: "INTEGER", description: "Jumlah kuantitas barang yang terjual/keluar" },
              metode_pembayaran: { type: "STRING", description: "Isi dengan 'CASH' jika tunai lunas, atau 'CREDIT' jika kasbon/berutang." }
            },
            required: ["nama_barang", "jumlah_terjual", "metode_pembayaran"]
          }
        },
        {
          name: "catat_kasbon",
          description: "Gunakan fungsi ini BERSAMAAN dengan kurangi_stok jika ada pelanggan yang berutang/kasbon (misalnya '1 beras kasbon zaki'). Hitung jumlah_utang dari (jumlah_barang * harga_satuan) berdasarkan data produk.",
          parameters: {
            type: "OBJECT",
            properties: {
              nama_pelanggan: { type: "STRING", description: "Nama pelanggan yang mengutang." },
              jumlah_utang: { type: "INTEGER", description: "Total nilai utang dalam Rupiah (dihitung otomatis oleh AI dari jumlah barang x harga)." },
              nama_barang: { type: "STRING", description: "Nama barang yang diutang (opsional)." }
            },
            required: ["nama_pelanggan", "jumlah_utang"]
          }
        }
      ]
    }];

    const executeFunction = async (name: string, args: any) => {
      if (name === 'kurangi_stok') {
        const { nama_barang, jumlah_terjual, metode_pembayaran } = args;
        
        // Cari barang di database
        const { data: item } = await supabase
          .from('products')
          .select('*')
          .eq('umkm_id', userId)
          .ilike('name', `%${nama_barang}%`)
          .single();
          
        if (item) {
          const newStock = Math.max(0, item.stock - jumlah_terjual);
          
          // 1. Kurangi stok barang
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id);
            
          // 2. Catat ke tabel transactions agar masuk Buku Besar
          const totalAmount = item.price * jumlah_terjual;
          await supabase
            .from('transactions')
            .insert({
              umkm_id: userId,
              type: 'IN',
              category: 'PENJUALAN',
              payment_method: metode_pembayaran === 'CREDIT' ? 'CREDIT' : 'CASH',
              total_amount: totalAmount,
              items: [{ name: item.name, quantity: jumlah_terjual, price: item.price }]
            });
            
          return { success: true, message: `Stok ${item.name} berhasil dikurangi ${jumlah_terjual}. Transaksi penjualan tercatat di Buku Besar sebagai ${metode_pembayaran || 'CASH'}. Sisa stok: ${newStock} ${item.unit}` };
        }
        return { success: false, message: `Barang ${nama_barang} tidak ditemukan di database.` };
      } else if (name === 'catat_kasbon') {
        const { nama_pelanggan, jumlah_utang, nama_barang } = args;
        
        // Asumsi jatuh tempo 7 hari dari sekarang
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const { error } = await supabase
          .from('debts')
          .insert({
            umkm_id: userId,
            customer_name: nama_pelanggan,
            amount: jumlah_utang,
            status: 'UNPAID',
            due_date: dueDate.toISOString().split('T')[0]
          });
          
        if (!error) {
          return { success: true, message: `Berhasil mencatat kasbon baru:\n- Pelanggan: ${nama_pelanggan}\n- Nominal: Rp${jumlah_utang}\n- Keterangan: ${nama_barang || 'Utang warung'}` };
        }
        return { success: false, message: `Gagal mencatat kasbon untuk ${nama_pelanggan}.` };
      }
      return null;
    };
    // ======== SELESAI IMPLEMENTASI TOOLS RAG ========
    
    // Format history percakapan untuk Gemini
    // Gemini mewajibkan turn pertama di history adalah role 'user'
    // serta tidak boleh ada dua role yang sama secara berurutan.
    const rawHistory = messages.slice(0, -1);
    const firstUserIdx = rawHistory.findIndex(m => m.role === 'user');
    const validHistoryMessages = firstUserIdx === -1 ? [] : rawHistory.slice(firstUserIdx);

    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const msg of validHistoryMessages) {
      const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
      if (history.length > 0 && history[history.length - 1].role === role) {
        history[history.length - 1].parts[0].text += '\n' + msg.content;
      } else {
        history.push({
          role,
          parts: [{ text: msg.content }]
        });
      }
    }

    // Start Chat dan Kirim Prompt dengan Fallback Otomatis
    const { text } = await startChatWithFallback(history, prompt, { 
      systemInstruction: contextData,
      tools,
      executeFunction
    });

    return new Response(JSON.stringify({ role: 'assistant', content: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in Gemini API:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to communicate with AI' }), { status: 500 });
  }
}
