'use client';

import { useState, ChangeEvent } from 'react';

export default function ScanPage() {
  const [, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleScan = async () => {
    if (!preview) return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: preview }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setResult(data.result);
    } catch (error: any) {
      setResult(`Gagal menganalisis gambar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      <div className="mb-space-lg">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mb-2">
          Scanner AI (Nota &amp; Rak)
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Unggah foto nota bon supplier atau foto etalase/rak warung Anda. AI akan otomatis mengekstrak data transaksi atau mengecek stok yang habis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        {/* Upload Section */}
        <div className="bg-surface-container-lowest p-space-lg rounded-2xl border border-outline/20 shadow-sm flex flex-col gap-space-md">
          <div className="flex items-center gap-space-xs text-primary font-bold">
            <span className="material-symbols-outlined">document_scanner</span>
            <span>Upload Foto</span>
          </div>
          
          <label className="border-2 border-dashed border-outline-variant rounded-xl p-space-lg flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container/50 transition-colors h-64 relative overflow-hidden group">
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-lg">Ganti Foto</span>
                </div>
              </>
            ) : (
              <div className="text-center text-on-surface-variant flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl mb-2 text-primary">add_photo_alternate</span>
                <span className="font-label-md font-bold text-on-surface">Pilih atau Tarik Foto ke Sini</span>
                <span className="text-body-sm mt-1">Mendukung format JPG/PNG</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          <button 
            onClick={handleScan}
            disabled={!preview || loading}
            className="w-full py-4 rounded-xl font-bold text-label-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-on-primary shadow-md cursor-pointer"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                Sedang Menganalisis dengan AI...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">auto_fix_high</span>
                Mulai Ekstrak Data
              </>
            )}
          </button>
        </div>

        {/* Result Section */}
        <div className="bg-surface-container-lowest p-space-lg rounded-2xl border border-outline/20 shadow-sm flex flex-col">
          <div className="flex items-center gap-space-xs text-tertiary font-bold mb-space-md">
            <span className="material-symbols-outlined">psychology</span>
            <span>Hasil Analisis AI</span>
          </div>
          
          <div className="flex-1 bg-surface-container p-space-md rounded-xl overflow-y-auto whitespace-pre-wrap font-body-md text-on-surface">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant space-y-4">
                <div className="w-12 h-12 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-outline"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
                <p className="animate-pulse">Gemini sedang membaca gambar...</p>
              </div>
            ) : result ? (
              <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 max-w-none text-on-surface" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>') }} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-center opacity-50">
                <span className="material-symbols-outlined text-5xl mb-2">find_in_page</span>
                <p>Belum ada hasil.</p>
                <p className="text-body-sm">Upload foto nota atau rak untuk memulai.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
