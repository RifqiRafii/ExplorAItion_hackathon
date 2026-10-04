'use client';

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { addProduct, updateProduct, adjustProductStock, deleteProduct } from '@/app/actions/stok';
import { buatPesanOrder, linkWa, normalisasiNomor } from '@/lib/penagih';
import type { Product } from '@/types';

interface StokClientProps {
  initialProducts: Product[];
}

export default function StokClient({ initialProducts = [] }: StokClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'OK'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [previewOrder, setPreviewOrder] = useState<boolean>(false);
  const [previewOrderMsg, setPreviewOrderMsg] = useState('');
  const [agenPhone, setAgenPhone] = useState('');

  // Barcode scanner states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [, setScannerActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerTab, setScannerTab] = useState<'camera' | 'manual' | 'photo'>('camera');
  const [scanAiLoading, setScanAiLoading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const isLow = p.stock <= p.min_stock;
    if (filter === 'LOW') return matchSearch && isLow;
    if (filter === 'OK') return matchSearch && !isLow;
    return matchSearch;
  });

  // Sound beep on barcode detection
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not permitted
    }
  };

  const handleBarcodeDetected = async (code: string) => {
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsBarcodeModalOpen(false);

    // Check if product exists in current store
    const existing = products.find(p => p.name?.toLowerCase().includes(code.toLowerCase()));
    if (existing) {
      setSearch(existing.name.replace(/\s*\[.*?\]/g, '').trim());
      setSuccessMessage(`Barcode ditemukan: ${existing.name.replace(/\s*\[.*?\]/g, '').trim()} (Stok: ${existing.stock} ${existing.unit})`);
    } else {
      // Open add product modal pre-filled
      setErrorMessage('');
      setScannedBarcode(code);
      setIsAddModalOpen(true);
      setSuccessMessage(`Mencari database untuk barcode ${code}...`);

      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const data = await res.json();
        
        let fetchedName = '';
        if (data.status === 1 && data.product && data.product.product_name) {
          fetchedName = data.product.product_name;
        }

        setTimeout(() => {
          const nameInput = document.getElementById('product-name-input') as HTMLInputElement | null;
          if (nameInput) {
            nameInput.value = fetchedName;
            nameInput.focus();
            if (fetchedName) {
              setSuccessMessage(`Info produk otomatis ditemukan: ${fetchedName}`);
            } else {
              setSuccessMessage(`Barcode baru (${code}) terdeteksi! Silakan lengkapi nama dan harga.`);
            }
          }
        }, 100);
      } catch (err) {
        setTimeout(() => {
          const nameInput = document.getElementById('product-name-input') as HTMLInputElement | null;
          if (nameInput) {
            nameInput.value = '';
            nameInput.focus();
          }
        }, 100);
        setSuccessMessage(`Barcode baru (${code}) terdeteksi! Silakan lengkapi nama dan harga.`);
      }
    }
  };

  // Camera Barcode Scanning logic
  useEffect(() => {
    let codeReader: any = null;

    if (isBarcodeModalOpen && scannerTab === 'camera') {
      const startCamera = async () => {
        try {
          setScannerStatus('Mengaktifkan kamera...');
          const { BrowserMultiFormatReader } = await import('@zxing/library');
          codeReader = new BrowserMultiFormatReader();
          setScannerActive(true);
          setScannerStatus('Arahkan kamera ke barcode produk...');

          if (videoRef.current) {
            codeReader.decodeFromConstraints(
              { video: { facingMode: 'environment' } },
              videoRef.current,
              (result: any, err: any) => {
                if (result) {
                  const detectedCode = result.getText();
                  playBeep();
                  handleBarcodeDetected(detectedCode);
                  if (codeReader) {
                    codeReader.reset();
                  }
                }
              }
            ).catch((err: any) => {
              console.log('ZXing scan frame error:', err);
            });
          }
        } catch (err) {
          console.error('Camera error:', err);
          setScannerStatus('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
          setScannerActive(false);
        }
      };

      startCamera();
    } else {
      if (codeReader) {
        codeReader.reset();
      }
      setScannerActive(false);
    }

    return () => {
      if (codeReader) {
        codeReader.reset();
      }
    };
  }, [isBarcodeModalOpen, scannerTab]);

  const handleManualBarcodeLookup = (e: FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleBarcodeDetected(barcodeInput.trim());
    setBarcodeInput('');
  };

  const handleBarcodePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanAiLoading(true);
    setScannerStatus('AI sedang menganalisis foto produk/barcode...');

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setIsBarcodeModalOpen(false);
        setIsAddModalOpen(true);
        setSuccessMessage('AI berhasil membaca info produk dari foto!');
      } catch (err: any) {
        alert('Gagal mendeteksi barcode dari foto: ' + err.message);
      } finally {
        setScanAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const barcode = formData.get('barcode') as string;
    if (barcode) {
      const name = formData.get('name') as string;
      formData.set('name', `${name} [${barcode}]`);
    }
    const res = await addProduct(formData);

    if (res?.error) {
      setErrorMessage(res.error);
      setLoading(false);
    } else {
      setSuccessMessage('Barang berhasil ditambahkan ke inventaris!');
      setIsAddModalOpen(false);
      setScannedBarcode('');
      form.reset();
      setLoading(false);
      window.location.reload();
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const barcode = formData.get('barcode') as string;
    if (barcode) {
      const name = formData.get('name') as string;
      formData.set('name', `${name} [${barcode}]`);
    }
    const res = await updateProduct(formData);

    if (res?.error) {
      setErrorMessage(res.error);
      setLoading(false);
    } else {
      setSuccessMessage('Data barang berhasil diperbarui!');
      setIsEditModalOpen(false);
      setLoading(false);
      window.location.reload();
    }
  };

  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const res = await adjustProductStock(product.id, delta);
    if (res?.success && res.newStock !== undefined) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: res.newStock! } : p));
    } else if (res?.error) {
      alert(res.error);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Yakin ingin menghapus ${product.name} dari inventaris warung?`)) return;

    const res = await deleteProduct(product.id);
    if (res?.success) {
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setSuccessMessage(`Barang ${product.name} telah dihapus.`);
    } else if (res?.error) {
      alert(res.error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto">
      {/* Header & Warning Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mb-2">
            Stok & Restock
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Pantau ketersediaan barang di warung Anda. Dapatkan peringatan otomatis jika stok mulai habis!
          </p>
        </div>
        
        {lowStockProducts.length > 0 && (
          <div className="flex flex-col gap-2">
            <div 
              onClick={() => setFilter(filter === 'LOW' ? 'ALL' : 'LOW')}
              className="cursor-pointer bg-error-container border border-error/30 hover:border-error p-space-md rounded-2xl flex flex-col min-w-[250px] shadow-sm transition-all"
              title="Klik untuk filter hanya barang yang menipis"
            >
              <span className="flex items-center gap-2 font-label-sm uppercase text-on-error-container font-bold mb-1">
                <span className="material-symbols-outlined text-sm">warning</span> Stok Menipis
              </span>
              <span className="font-headline-sm text-error font-extrabold">
                {lowStockProducts.length} Barang Perlu Restock
              </span>
              <span className="text-xs text-on-error-container/80 mt-1">
                {filter === 'LOW' ? 'Menampilkan stok tipis (Klik reset)' : 'Klik untuk filter stok tipis'}
              </span>
            </div>
            <button
              onClick={() => {
                const itemsToOrder = lowStockProducts.map(p => ({
                  nama: p.name,
                  jumlah: p.min_stock * 2,
                  satuan: p.unit
                }));
                const msg = buatPesanOrder({ agen: 'Bapak/Ibu Agen', toko: 'WarungCopilot', items: itemsToOrder });
                setPreviewOrderMsg(msg);
                setPreviewOrder(true);
              }}
              className="w-full bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">send</span> Pesan ke Agen via WA
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span className="font-medium text-sm">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:opacity-75 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-space-md border-b border-outline/20 flex flex-col md:flex-row justify-between items-center gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                placeholder="Cari barang di warung..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex bg-surface-container-low p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'ALL' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}
              >
                Semua ({products.length})
              </button>
              <button
                onClick={() => setFilter('LOW')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'LOW' ? 'bg-surface-container-lowest shadow-sm text-error' : 'text-on-surface-variant'}`}
              >
                Kritis ({lowStockProducts.length})
              </button>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => { setIsBarcodeModalOpen(true); setScannerTab('camera'); }}
              className="flex-1 md:flex-initial bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span> Scan Barcode
            </button>
            <button 
              onClick={() => { setIsAddModalOpen(true); setErrorMessage(''); setScannedBarcode(''); }}
              className="flex-1 md:flex-initial bg-primary hover:bg-primary/90 text-on-primary px-space-md py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span> Tambah Barang
            </button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline/20">
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Nama Barang</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Harga Jual</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-center">Stok Saat Ini</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-center">Batas Minimum</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isLowStock = product.stock <= product.min_stock;
                  return (
                    <tr key={product.id} className={`hover:bg-surface-container/30 transition-colors ${isLowStock ? 'bg-error-container/10' : ''}`}>
                      <td className="p-space-md font-body-lg text-on-surface font-semibold flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">inventory_2</span>
                        </div>
                        <div>
                          <div>{product.name?.replace(/\s*\[.*?\]/g, '').trim() || product.name}</div>
                          <span className="text-xs text-on-surface-variant font-normal">Satuan: {product.unit}</span>
                        </div>
                      </td>
                      <td className="p-space-md font-body-lg text-primary font-bold">
                        Rp {product.price.toLocaleString('id-ID')}
                      </td>
                      <td className="p-space-md text-center">
                        <div className="inline-flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-xl border border-outline/10">
                          <button
                            onClick={() => handleQuickAdjustStock(product, -1)}
                            title="Kurang 1 stok"
                            className="w-6 h-6 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className={`min-w-[40px] font-extrabold ${isLowStock ? 'text-error' : 'text-on-surface'}`}>
                            {product.stock}
                          </span>
                          <button
                            onClick={() => handleQuickAdjustStock(product, 1)}
                            title="Tambah 1 stok"
                            className="w-6 h-6 rounded-lg bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-space-md font-body-md text-on-surface-variant text-center">
                        {product.min_stock} {product.unit}
                      </td>
                      <td className="p-space-md text-center">
                        <span className={`px-3 py-1 rounded-full font-label-sm font-bold inline-flex items-center gap-1 ${
                          isLowStock ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'
                        }`}>
                          <span className="material-symbols-outlined text-xs">
                            {isLowStock ? 'warning' : 'check_circle'}
                          </span>
                          {isLowStock ? 'PERLU RESTOCK' : 'AMAN'}
                        </span>
                      </td>
                      <td className="p-space-md text-right">
                        <div className="inline-flex items-center gap-1">
                          <button 
                            onClick={() => { setSelectedProduct(product); setIsEditModalOpen(true); setErrorMessage(''); }}
                            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-container cursor-pointer"
                            title="Edit Barang"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(product)}
                            className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-lg hover:bg-surface-container cursor-pointer"
                            title="Hapus Barang"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-space-xl text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-5xl opacity-40">inventory</span>
                      <p className="font-label-lg">
                        {search || filter !== 'ALL' ? 'Tidak ada barang yang cocok dengan pencarian.' : 'Belum ada barang di inventaris warung Anda.'}
                      </p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-primary hover:underline text-sm font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> Tambah Barang Sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview Order WA */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-6 w-full max-w-lg shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">shopping_cart_checkout</span>
                <h3 className="font-headline-sm font-bold text-on-surface">Pesan Restock ke Agen</h3>
              </div>
              <button 
                onClick={() => setPreviewOrder(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nomor WhatsApp Agen
                </label>
                <input
                  type="tel"
                  value={agenPhone}
                  onChange={(e) => setAgenPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Pesan WhatsApp
                </label>
                <textarea
                  value={previewOrderMsg}
                  onChange={(e) => setPreviewOrderMsg(e.target.value)}
                  className="w-full h-48 px-4 py-3 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md resize-none"
                />
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  onClick={() => setPreviewOrder(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline/20 text-on-surface-variant hover:bg-surface-container font-bold text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                {agenPhone && normalisasiNomor(agenPhone) ? (
                  <a
                    href={linkWa(agenPhone, previewOrderMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setPreviewOrder(false);
                      setSuccessMessage('Pesan order telah disiapkan di tab WA baru.');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">send</span> Kirim Pesanan
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">block</span> Isi Nomor Agen Dulu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scan Barcode */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <h3 className="font-headline-sm font-bold text-on-surface">Scan Barcode Produk</h3>
              </div>
              <button 
                onClick={() => setIsBarcodeModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-outline/10 mt-3">
              <button
                onClick={() => setScannerTab('camera')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  scannerTab === 'camera' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base">photo_camera</span> Kamera
              </button>
              <button
                onClick={() => setScannerTab('manual')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  scannerTab === 'manual' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base">keyboard</span> Input / Gun
              </button>
              <button
                onClick={() => setScannerTab('photo')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  scannerTab === 'photo' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base">upload_file</span> Foto / AI
              </button>
            </div>

            <div className="mt-4">
              {scannerTab === 'camera' && (
                <div className="flex flex-col items-center">
                  <div className="w-full h-64 bg-black rounded-xl overflow-hidden relative flex items-center justify-center border-2 border-primary/50">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    <div className="absolute inset-0 border-2 border-dashed border-primary/70 pointer-events-none rounded-xl m-6 animate-pulse"></div>
                    <div className="absolute bottom-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white">
                      {scannerStatus || 'Memindai barcode...'}
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2 text-center">
                    Pegang barcode produk stabil di dalam kotak pandu merah/hijau.
                  </p>
                </div>
              )}

              {scannerTab === 'manual' && (
                <form onSubmit={handleManualBarcodeLookup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Nomor Barcode atau Nama Produk
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Ketik angka barcode atau scan dengan Barcode Gun..."
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline/20 rounded-xl text-base font-mono focus:outline-none focus:border-primary"
                    />
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      Cocok untuk alat scanner USB/Bluetooth fisik (barcode gun langsung menekan enter otomatis).
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">search</span> Cari / Tambah Barang
                  </button>
                </form>
              )}

              {scannerTab === 'photo' && (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container/50 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">add_photo_alternate</span>
                    <span className="text-sm font-bold text-on-surface">Pilih Foto Barcode atau Kemasan</span>
                    <span className="text-xs text-on-surface-variant mt-1">AI akan membaca nama produk dan nomor barcode</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBarcodePhotoUpload} disabled={scanAiLoading} />
                  </label>
                  {scanAiLoading && (
                    <div className="flex items-center justify-center gap-2 text-primary text-sm font-bold py-2">
                      <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                      Sedang memproses dengan Gemini AI...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Barang */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-6 w-full max-w-lg shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">add_box</span>
                <h3 className="font-headline-sm font-bold text-on-surface">Tambah Barang Inventaris</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-error-container/40 border border-error/20 text-error rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {scannedBarcode && (
                <div className="bg-primary-container/30 border border-primary/20 text-primary px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">qr_code</span>
                  Barcode terlampir otomatis
                  <input type="hidden" name="barcode" value={scannedBarcode} />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nama Barang <span className="text-error">*</span>
                </label>
                <input
                  id="product-name-input"
                  type="text"
                  name="name"
                  required
                  placeholder="Contoh: Beras Ramos 5kg / Minyak Kita 1L"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Harga Jual (Rp) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="100"
                    step="100"
                    placeholder="Contoh: 14000"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md font-bold text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Satuan Barang <span className="text-error">*</span>
                  </label>
                  <select
                    name="unit"
                    defaultValue="Pcs"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Bungkus">Bungkus</option>
                    <option value="Botol">Botol</option>
                    <option value="Sak">Sak</option>
                    <option value="Dus">Dus</option>
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Butir">Butir</option>
                    <option value="Renceng">Renceng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Stok Awal <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    placeholder="Contoh: 24"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Batas Minimum Restock <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    required
                    min="1"
                    defaultValue="5"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">Peringatan muncul jika stok di bawah angka ini.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline/20 text-on-surface-variant hover:bg-surface-container font-bold text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Simpan Barang
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Barang */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-6 w-full max-w-lg shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">edit</span>
                <h3 className="font-headline-sm font-bold text-on-surface">Edit Data Barang</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-error-container/40 border border-error/20 text-error rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={selectedProduct.id} />

              {(() => {
                const barcodeMatch = selectedProduct.name.match(/\[(.*?)\]/);
                const barcode = barcodeMatch ? barcodeMatch[1] : '';
                return barcode ? (
                  <div className="bg-primary-container/30 border border-primary/20 text-primary px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">qr_code</span>
                    Barcode terlampir otomatis
                    <input type="hidden" name="barcode" value={barcode} />
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nama Barang <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={selectedProduct.name.replace(/\s*\[.*?\]/g, '').trim()}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Harga Jual (Rp) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="100"
                    step="100"
                    defaultValue={selectedProduct.price}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md font-bold text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Satuan Barang <span className="text-error">*</span>
                  </label>
                  <select
                    name="unit"
                    defaultValue={selectedProduct.unit || 'Pcs'}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Bungkus">Bungkus</option>
                    <option value="Botol">Botol</option>
                    <option value="Sak">Sak</option>
                    <option value="Dus">Dus</option>
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Butir">Butir</option>
                    <option value="Renceng">Renceng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Stok Saat Ini <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    defaultValue={selectedProduct.stock}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Batas Minimum Restock <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    required
                    min="1"
                    defaultValue={selectedProduct.min_stock}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline/20 text-on-surface-variant hover:bg-surface-container font-bold text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
