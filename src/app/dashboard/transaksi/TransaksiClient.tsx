'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { UserSession, Product, Transaction } from '@/types';
import { createSaleTransaction, createRestockTransaction, deleteTransaction } from '@/app/actions/transaksi';
import { linkWa, normalisasiNomor } from '@/lib/penagih';

interface TransaksiClientProps {
  user: UserSession | null;
  initialProducts: Product[];
  initialRecentTransactions: Transaction[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function TransaksiClient({
  user,
  initialProducts,
  initialRecentTransactions,
}: TransaksiClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(initialRecentTransactions);
  
  // Mode: Penjualan (Stok Berkurang) vs Kulakan (Stok Bertambah)
  const [mode, setMode] = useState<'SALE' | 'RESTOCK'>('SALE');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<'ALL' | 'READY' | 'LOW'>('ALL');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH');
  
  // Cash details
  const [cashReceived, setCashReceived] = useState<string>('');

  // Credit / Kasbon details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{
    transactionId: string;
    totalAmount: number;
    items: { name: string; quantity: number; price: number; unit?: string }[];
    paymentMethod: 'CASH' | 'CREDIT';
    customerName?: string;
    customerPhone?: string;
    cashReceived?: number;
    change?: number;
    updatedStocks?: { name: string; newStock: number; unit: string }[];
  } | null>(null);

  // Barcode Scanner Modal States
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [scannerTab, setScannerTab] = useState<'camera' | 'manual'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerStatus, setScannerStatus] = useState('');
  const [lastScannedToast, setLastScannedToast] = useState<{ name: string; price: number; stock: number; unit: string; qty: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  // Audio Beep Feedback
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Add to cart with atomic functional state update (allows scanning same item multiple times reliably)
  const addToCart = (product: Product): { success: boolean; newQty: number } => {
    setErrorMessage('');
    let resultQty = 1;
    let allowed = true;

    setCart((prevCart) => {
      const existing = prevCart.find(c => c.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;

      if (mode === 'SALE') {
        if (product.stock <= 0) {
          setErrorMessage(`Stok "${product.name}" habis (0 ${product.unit}). Tidak dapat ditambahkan.`);
          allowed = false;
          return prevCart;
        }
        if (currentQty >= product.stock) {
          setErrorMessage(`Stok "${product.name}" maksimal ${product.stock} ${product.unit}.`);
          allowed = false;
          return prevCart;
        }
      }

      if (existing) {
        resultQty = existing.quantity + 1;
        return prevCart.map(c => 
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        resultQty = 1;
        return [...prevCart, { product, quantity: 1 }];
      }
    });

    return { success: allowed, newQty: resultQty };
  };

  // Barcode Handler (Both Camera & Manual)
  const handleBarcodeDetected = (code: string) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim().toLowerCase();

    // Cari produk berdasarkan nama yang mengandung barcode atau pencocokan nama
    const found = products.find(p => p.name.toLowerCase().includes(cleanCode));

    if (found) {
      if (mode === 'SALE' && found.stock <= 0) {
        setScannerStatus(`⚠️ Barang "${found.name}" stoknya habis (0 ${found.unit}).`);
        return;
      }

      const res = addToCart(found);
      if (!res.success) {
        setScannerStatus(`⚠️ Stok "${found.name}" sudah mencapai batas maksimal.`);
        return;
      }

      const displayPrice = mode === 'SALE' ? found.price : (found.cost_price || found.price * 0.8);
      setScannerStatus(`✅ Berhasil scan: ${found.name} (Jumlah di keranjang: ${res.newQty} ${found.unit})`);
      setLastScannedToast({
        name: found.name,
        price: displayPrice,
        stock: found.stock,
        unit: found.unit,
        qty: res.newQty
      });

      // Clear toast after 3 seconds
      setTimeout(() => {
        setLastScannedToast(null);
      }, 3000);
    } else {
      setScannerStatus(`❌ Barcode "${code}" tidak ditemukan di daftar barang.`);
    }
  };

  // ZXing Camera Barcode Decoder Lifecycle
  useEffect(() => {
    let codeReader: any = null;

    if (isBarcodeOpen && scannerTab === 'camera') {
      const startCamera = async () => {
        try {
          setScannerStatus('Mengaktifkan kamera...');
          const { BrowserMultiFormatReader } = await import('@zxing/library');
          codeReader = new BrowserMultiFormatReader();

          if (videoRef.current) {
            codeReader.decodeFromConstraints(
              { video: { facingMode: { ideal: facingMode } } },
              videoRef.current,
              (result: any, err: any) => {
                if (result) {
                  const text = result.getText();
                  if (text) {
                    const now = Date.now();
                    // Debounce 850ms agar scan barcode yang sama 2x langsung bertambah jadi 2
                    if (text === lastScannedCodeRef.current && (now - lastScanTimeRef.current) < 850) {
                      return;
                    }
                    lastScannedCodeRef.current = text;
                    lastScanTimeRef.current = now;
                    playBeep();
                    handleBarcodeDetected(text);
                  }
                }
              }
            ).catch((err: any) => {
              console.log('ZXing scan error:', err);
            });

            setScannerStatus('Arahkan kamera ke barcode produk...');
          }
        } catch (err: any) {
          console.error('Camera access error:', err);
          setScannerStatus('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan tab Input Manual.');
        }
      };

      startCamera();
    }

    return () => {
      if (codeReader) {
        try {
          codeReader.reset();
        } catch {}
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isBarcodeOpen, scannerTab, facingMode, products, mode]);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const isLow = p.stock <= p.min_stock;
    const isReady = p.stock > 0;

    if (filterStock === 'READY') return matchSearch && isReady;
    if (filterStock === 'LOW') return matchSearch && isLow;
    return matchSearch;
  });

  // Cart Calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => {
    const price = mode === 'SALE' ? item.product.price : (item.product.cost_price || item.product.price * 0.8);
    return sum + (item.quantity * price);
  }, 0);

  const numCashReceived = parseInt(cashReceived.replace(/[^\d]/g, '') || '0', 10);
  const changeAmount = Math.max(0, numCashReceived - totalAmount);
  const isCashInsufficient = paymentMethod === 'CASH' && numCashReceived > 0 && numCashReceived < totalAmount;

  // Update Qty
  const updateQuantity = (productId: string, newQty: number) => {
    setErrorMessage('');
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(c => c.product.id === productId);
    if (!item) return;

    if (mode === 'SALE' && newQty > item.product.stock) {
      setErrorMessage(`Stok untuk "${item.product.name}" hanya tersedia ${item.product.stock} ${item.product.unit}.`);
      return;
    }

    setCart(cart.map(c => 
      c.product.id === productId ? { ...c, quantity: newQty } : c
    ));
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCashReceived('');
    setErrorMessage('');
  };

  // Quick cash buttons
  const setQuickCash = (amount: number) => {
    setCashReceived(amount.toString());
  };

  // Submit Transaction
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Keranjang belanja masih kosong.');
      return;
    }

    if (paymentMethod === 'CREDIT' && !customerName.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi untuk transaksi Kasbon/Kredit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (mode === 'SALE') {
        const payload = {
          items: cart.map(c => ({
            productId: c.product.id,
            name: c.product.name,
            quantity: c.quantity,
            price: c.product.price,
            unit: c.product.unit,
          })),
          paymentMethod,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          dueDate,
          notes,
          paidAmount: paymentMethod === 'CASH' ? numCashReceived : 0,
        };

        const res = await createSaleTransaction(payload);
        if (res.error) {
          setErrorMessage(res.error);
          setIsSubmitting(false);
          return;
        }

        // Update local products state with updated stocks
        if (res.updatedStocks) {
          const stockUpdates = new Map(res.updatedStocks.map(u => [u.id, u.newStock]));
          setProducts(prev => prev.map(p => {
            if (stockUpdates.has(p.id)) {
              return { ...p, stock: stockUpdates.get(p.id)! };
            }
            return p;
          }));
        }

        // Show Success Modal
        setSuccessData({
          transactionId: res.transactionId || 'TRX-' + Date.now().toString().slice(-6),
          totalAmount,
          items: cart.map(c => ({
            name: c.product.name,
            quantity: c.quantity,
            price: c.product.price,
            unit: c.product.unit
          })),
          paymentMethod,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          cashReceived: paymentMethod === 'CASH' && numCashReceived > 0 ? numCashReceived : totalAmount,
          change: paymentMethod === 'CASH' ? changeAmount : 0,
          updatedStocks: res.updatedStocks
        });

        // Add to recent transactions preview
        const newTrx: Transaction = {
          id: res.transactionId || Date.now().toString(),
          created_at: new Date().toISOString(),
          type: 'IN',
          category: 'PENJUALAN',
          payment_method: paymentMethod,
          total_amount: totalAmount,
          items: cart.map(c => ({
            productId: c.product.id,
            name: c.product.name,
            quantity: c.quantity,
            price: c.product.price,
            unit: c.product.unit,
            subtotal: c.quantity * c.product.price
          }))
        };
        setRecentTransactions([newTrx, ...recentTransactions]);

        // Reset cart
        clearCart();
        setCustomerName('');
        setCustomerPhone('');
      } else {
        // Restock Mode
        const payload = {
          items: cart.map(c => ({
            productId: c.product.id,
            name: c.product.name,
            quantity: c.quantity,
            costPrice: c.product.cost_price || c.product.price * 0.8,
            unit: c.product.unit
          })),
          notes
        };

        const res = await createRestockTransaction(payload);
        if (res.error) {
          setErrorMessage(res.error);
          setIsSubmitting(false);
          return;
        }

        // Update local products state (add stock)
        setProducts(prev => prev.map(p => {
          const cartItem = cart.find(c => c.product.id === p.id);
          if (cartItem) {
            return { ...p, stock: p.stock + cartItem.quantity };
          }
          return p;
        }));

        setSuccessData({
          transactionId: res.transactionId || 'KUL-' + Date.now().toString().slice(-6),
          totalAmount,
          items: cart.map(c => ({
            name: c.product.name,
            quantity: c.quantity,
            price: c.product.cost_price || c.product.price * 0.8,
            unit: c.product.unit
          })),
          paymentMethod: 'CASH',
        });

        clearCart();
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan saat memproses transaksi: ' + (err?.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Barcode Manual Form Handler
  const handleBarcodeSubmit = (code: string) => {
    if (!code.trim()) return;
    playBeep();
    handleBarcodeDetected(code);
    setBarcodeInput('');
  };

  // WhatsApp receipt sender
  const handleSendWaReceipt = () => {
    if (!successData) return;
    const phone = successData.customerPhone || '';
    const norm = normalisasiNomor(phone);
    if (!norm) {
      alert('Nomor WhatsApp pelanggan belum diisi.');
      return;
    }

    const itemsText = successData.items
      .map(i => `• ${i.name} (${i.quantity} ${i.unit || 'Pcs'}) - Rp ${(i.quantity * i.price).toLocaleString('id-ID')}`)
      .join('\n');

    const message = 
      `*STRUK PEMBELIAN ${user?.store_name || user?.warung_name || 'WARUNG'}*\n` +
      `No: #${successData.transactionId.slice(-6).toUpperCase()}\n` +
      `Tanggal: ${new Date().toLocaleString('id-ID')}\n` +
      `--------------------------------\n` +
      `${itemsText}\n` +
      `--------------------------------\n` +
      `*Total: Rp ${successData.totalAmount.toLocaleString('id-ID')}*\n` +
      `Pembayaran: ${successData.paymentMethod === 'CASH' ? 'TUNAI' : 'KASBON / UTANG'}\n` +
      (successData.paymentMethod === 'CASH' && successData.cashReceived 
        ? `Bayar: Rp ${successData.cashReceived.toLocaleString('id-ID')}\nKembali: Rp ${(successData.change || 0).toLocaleString('id-ID')}\n` 
        : '') +
      `\nTerima kasih sudah berbelanja di warung kami! 🙏`;

    window.open(linkWa(norm, message), '_blank');
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">point_of_sale</span>
            <span>Kasir Digital &amp; Pengurangan Stok Otomatis</span>
          </div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Input Transaksi &amp; Kasir
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Pilih belanjaan pelanggan. Stok inventaris akan <strong className="text-on-surface">otomatis berkurang</strong> dan langsung dicatat ke <strong className="text-on-surface">Buku Besar Pembukuan</strong>.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/laporan"
            className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-container border border-outline/20 text-on-surface font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-primary">receipt_long</span>
            Lihat Pembukuan &amp; Laporan
          </Link>
          <Link
            href="/dashboard/stok"
            className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-container border border-outline/20 text-on-surface font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-amber-600">inventory_2</span>
            Cek Sisa Stok
          </Link>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-container-low border border-outline/20 rounded-2xl w-fit mb-6 shadow-sm">
        <button
          onClick={() => {
            setMode('SALE');
            clearCart();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            mode === 'SALE'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">shopping_cart</span>
          <span>Penjualan / Belanja Pelanggan (Kurangi Stok)</span>
        </button>
        <button
          onClick={() => {
            setMode('RESTOCK');
            clearCart();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            mode === 'RESTOCK'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">add_business</span>
          <span>Kulakan / Tambah Stok (Kas Keluar)</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Selection & Catalog (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Search & Action Bar */}
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Cari nama barang atau barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setFilterStock('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStock === 'ALL'
                    ? 'bg-surface-container-high text-on-surface'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterStock('READY')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStock === 'READY'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tersedia
              </button>
              <button
                onClick={() => setFilterStock('LOW')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStock === 'LOW'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Menipis
              </button>

              <button
                onClick={() => {
                  setIsBarcodeOpen(true);
                  setScannerTab('camera');
                }}
                className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Buka Scanner Barcode Kamera"
              >
                <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                <span>Scan Barcode</span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-sm min-h-[460px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Daftar Barang ({filteredProducts.length} Produk)
              </span>
              <span className="text-xs text-on-surface-variant">
                Klik kartu atau tombol <strong>+</strong> untuk masukkan keranjang
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => {
                  const inCart = cart.find(c => c.product.id === p.id);
                  const isOutOfStock = mode === 'SALE' && p.stock <= 0;
                  const isLow = p.stock <= p.min_stock;
                  const displayPrice = mode === 'SALE' ? p.price : (p.cost_price || p.price * 0.8);

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`relative p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between select-none ${
                        isOutOfStock
                          ? 'opacity-50 bg-surface-container-low/50 border-outline/10 cursor-not-allowed'
                          : inCart
                          ? 'bg-primary/5 border-primary shadow-sm hover:shadow cursor-pointer'
                          : 'bg-surface-container-low/30 border-outline/15 hover:border-primary/50 hover:bg-surface-container-low cursor-pointer hover:shadow-sm'
                      }`}
                    >
                      {/* Top Tag: In Cart or Low Stock */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.stock <= 0
                              ? 'bg-error-container text-on-error-container'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Sisa: {p.stock} {p.unit}
                        </span>

                        {inCart && (
                          <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shadow-sm">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <div className="font-bold text-on-surface text-sm line-clamp-2 leading-tight mb-2">
                        {p.name}
                      </div>

                      {/* Price & Add Action */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline/10">
                        <div>
                          <div className="text-[10px] text-on-surface-variant">
                            {mode === 'SALE' ? 'Harga Jual' : 'Estimasi Modal'}
                          </div>
                          <div className="font-extrabold text-primary text-sm">
                            Rp {displayPrice.toLocaleString('id-ID')}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) addToCart(p);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-transform active:scale-90 ${
                            isOutOfStock
                              ? 'bg-outline/20 text-on-surface-variant cursor-not-allowed'
                              : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm cursor-pointer'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl opacity-40 mb-2">search_off</span>
                <p className="font-bold text-sm">Tidak ada barang yang cocok dengan pencarian.</p>
                <p className="text-xs text-on-surface-variant mt-1">Coba kata kunci lain atau tambahkan barang baru di menu Stok.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cart & Checkout Summary (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-sm flex flex-col justify-between min-h-[550px]">
            
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-outline/15 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">shopping_cart_checkout</span>
                  <h2 className="font-bold text-on-surface text-base">
                    {mode === 'SALE' ? 'Keranjang Belanja Pelanggan' : 'Daftar Kulakan Barang'}
                  </h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-error hover:underline font-bold cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-xs flex items-start gap-2 animate-shake">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Cart Items List */}
              {cart.length > 0 ? (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const price = mode === 'SALE' ? item.product.price : (item.product.cost_price || item.product.price * 0.8);
                    const subtotal = item.quantity * price;

                    return (
                      <div
                        key={item.product.id}
                        className="p-3 bg-surface-container-low/40 rounded-xl border border-outline/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-on-surface truncate">{item.product.name}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            Rp {price.toLocaleString('id-ID')} &times; {item.quantity} {item.product.unit}
                          </p>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={mode === 'SALE' ? item.product.stock : 999}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                            className="w-10 text-center py-0.5 bg-surface-container-lowest border border-outline/20 rounded text-xs font-bold focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-xs text-on-surface">Rp {subtotal.toLocaleString('id-ID')}</p>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[10px] text-error hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-on-surface-variant flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl opacity-30 mb-2">production_quantity_limits</span>
                  <p className="text-xs font-bold">Keranjang masih kosong</p>
                  <p className="text-[11px] mt-0.5">Pilih produk di sebelah kiri untuk memulai transaksi.</p>
                </div>
              )}
            </div>

            {/* Bottom Checkout Section */}
            <div className="pt-4 border-t border-outline/15 mt-4 space-y-4">
              
              {/* Payment Method Selector (Only for Penjualan) */}
              {mode === 'SALE' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'bg-primary/10 border-primary text-primary shadow-sm'
                          : 'bg-surface-container-low border-outline/15 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">payments</span>
                      <span>Tunai (CASH)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'CREDIT'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                          : 'bg-surface-container-low border-outline/15 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">menu_book</span>
                      <span>Kasbon / Utang</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cash Details: Quick Amounts & Calculator */}
              {mode === 'SALE' && paymentMethod === 'CASH' && cart.length > 0 && (
                <div className="p-3 bg-surface-container-low/50 rounded-xl space-y-2 border border-outline/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface-variant">Uang Diterima:</span>
                    <input
                      type="text"
                      placeholder="Rp 0"
                      value={cashReceived ? `Rp ${numCashReceived.toLocaleString('id-ID')}` : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setCashReceived(raw);
                      }}
                      className="w-32 px-2.5 py-1 text-right bg-surface-container-lowest border border-outline/20 rounded-lg text-xs font-extrabold focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickCash(totalAmount)}
                      className="px-2 py-0.5 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-bold text-on-surface"
                    >
                      Uang Pas
                    </button>
                    {[10000, 20000, 50000, 100000].map(amt => {
                      if (amt >= totalAmount || amt === 100000) {
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setQuickCash(amt)}
                            className="px-2 py-0.5 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-bold text-on-surface"
                          >
                            {(amt / 1000)}k
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Kembalian */}
                  {numCashReceived > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-outline/10 text-xs">
                      <span className="font-bold text-on-surface-variant">Kembalian:</span>
                      <span className={`font-extrabold text-sm ${isCashInsufficient ? 'text-error' : 'text-emerald-600'}`}>
                        {isCashInsufficient ? `Kurang Rp ${(totalAmount - numCashReceived).toLocaleString('id-ID')}` : `Rp ${changeAmount.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Kasbon / Kredit Details */}
              {mode === 'SALE' && paymentMethod === 'CREDIT' && (
                <div className="p-3 bg-amber-500/10 rounded-xl space-y-2.5 border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span>Otomatis dicatat ke Buku Piutang &amp; Pembukuan</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Nama Pelanggan *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pak Budi / Bu Siti"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline/20 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface mb-1">No. WhatsApp</label>
                      <input
                        type="text"
                        placeholder="08123456789"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline/20 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface mb-1">Jatuh Tempo</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline/20 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-on-surface-variant block">Total Belanja</span>
                  <span className="text-xs text-on-surface-variant font-medium">{totalItemsCount} item dipilih</span>
                </div>
                <div className="text-2xl font-black text-primary tracking-tight font-currency-display">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleCheckout}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  cart.length === 0 || isSubmitting
                    ? 'bg-outline/30 text-on-surface-variant cursor-not-allowed'
                    : mode === 'SALE'
                    ? 'bg-primary hover:bg-primary/90 text-on-primary active:scale-[0.99]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                    <span>Memproses &amp; Memotong Stok...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">
                      {mode === 'SALE' ? 'check_circle' : 'inventory'}
                    </span>
                    <span>
                      {mode === 'SALE'
                        ? 'Selesaikan & Potong Stok Otomatis'
                        : 'Simpan Kulakan & Tambah Stok'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KONEKSI BUKU BESAR SUMMARY WIDGET */}
      <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-surface-container-low to-emerald-500/10 border border-primary/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-on-surface">Terkoneksi Otomatis ke Buku Besar &amp; Laporan</h3>
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Sinkron Real-time
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Setiap kali Anda menekan tombol selesaikan transaksi, uang masuk dicatat sebagai mutasi Debit di <strong>Buku Besar</strong> dan langsung memperbarui <strong>Laporan Laba Rugi</strong> warung.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/laporan"
          className="px-4 py-2.5 bg-surface-container-lowest hover:bg-surface-container border border-outline/20 text-primary font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shrink-0 self-stretch md:self-auto justify-center"
        >
          <span className="material-symbols-outlined text-base">receipt_long</span>
          Lihat Buku Besar &amp; Jurnal Kas
        </Link>
      </div>

      {/* Recent Transactions List Section */}
      <div className="mt-6 bg-surface-container-lowest rounded-2xl border border-outline/20 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">history</span>
            <h2 className="font-bold text-base text-on-surface">Riwayat Transaksi Terakhir</h2>
          </div>
          <Link
            href="/dashboard/laporan"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Buka Buku Besar Lengkap <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline/15 bg-surface-container-low/40">
                  <th className="p-3 font-bold">Waktu</th>
                  <th className="p-3 font-bold">Tipe &amp; Kategori</th>
                  <th className="p-3 font-bold">Item Terjual / Masuk</th>
                  <th className="p-3 font-bold">Metode</th>
                  <th className="p-3 font-bold text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {recentTransactions.slice(0, 5).map((trx) => (
                  <tr key={trx.id} className="hover:bg-surface-container-low/20">
                    <td className="p-3 whitespace-nowrap text-on-surface-variant font-medium">
                      {new Date(trx.transaction_date || trx.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          trx.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trx.type === 'IN' ? 'Penjualan' : 'Kulakan'}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate">
                      {trx.items && trx.items.length > 0
                        ? trx.items.map((i: any) => `${i.name} (${i.quantity || 1})`).join(', ')
                        : '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          trx.payment_method === 'CASH'
                            ? 'bg-surface-container text-on-surface font-semibold'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {trx.payment_method === 'CASH' ? 'Tunai' : 'Kasbon'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-extrabold text-sm text-on-surface">
                      Rp {trx.total_amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-on-surface-variant">
            Belum ada transaksi tercatat hari ini.
          </div>
        )}
      </div>

      {/* SUCCESS RECEIPT MODAL */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/20 p-6 w-full max-w-md shadow-2xl relative">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <h3 className="font-headline-sm text-xl font-extrabold text-on-surface">
                Transaksi Berhasil!
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Stok otomatis berkurang dan dicatat ke Buku Besar.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline/10 text-xs space-y-2 mb-4">
              <div className="flex justify-between text-on-surface-variant pb-2 border-b border-outline/10">
                <span>ID Transaksi:</span>
                <span className="font-mono font-bold text-on-surface">
                  #{successData.transactionId.slice(-6).toUpperCase()}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-1">
                {successData.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-medium text-on-surface">
                      {i.name} &times; {i.quantity} {i.unit || 'Pcs'}
                    </span>
                    <span className="font-bold text-on-surface">
                      Rp {(i.quantity * i.price).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Payment Method */}
              <div className="pt-2 border-t border-outline/10 space-y-1">
                <div className="flex justify-between font-bold text-sm text-primary">
                  <span>Total Transaksi:</span>
                  <span>Rp {successData.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Metode:</span>
                  <span className="font-bold text-on-surface">
                    {successData.paymentMethod === 'CASH' ? 'Tunai (CASH)' : `Kasbon (${successData.customerName})`}
                  </span>
                </div>
                {successData.paymentMethod === 'CASH' && successData.cashReceived && (
                  <>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Uang Diterima:</span>
                      <span>Rp {successData.cashReceived.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Kembalian:</span>
                      <span>Rp {(successData.change || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Stock update notification */}
              {successData.updatedStocks && successData.updatedStocks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-outline/10 text-[11px] text-on-surface-variant">
                  <span className="font-bold text-emerald-700 block mb-0.5">Sisa Stok Diperbarui:</span>
                  {successData.updatedStocks.map((s, idx) => (
                    <span key={idx} className="inline-block mr-2 text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      {s.name}: {s.newStock} {s.unit}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {successData.customerPhone && (
                <button
                  onClick={handleSendWaReceipt}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  Kirim Struk via WhatsApp
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  Cetak Struk
                </button>
                <Link
                  href="/dashboard/laporan"
                  className="py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  Ke Pembukuan
                </Link>
              </div>

              <button
                onClick={() => setSuccessData(null)}
                className="w-full py-2.5 bg-primary text-on-primary hover:bg-primary/90 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-1"
              >
                Transaksi Baru (+ Input Lagi)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL (LIVE CAMERA + MANUAL / GUN) */}
      {isBarcodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/20 p-5 w-full max-w-md shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <h3 className="font-bold text-base text-on-surface">Scan Barcode Kasir</h3>
              </div>
              <button
                onClick={() => {
                  setIsBarcodeOpen(false);
                  setScannerStatus('');
                  setBarcodeInput('');
                  setLastScannedToast(null);
                }}
                className="text-on-surface-variant hover:text-on-surface text-lg p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs: Kamera vs Input Manual */}
            <div className="flex border-b border-outline/10 mt-3 mb-4">
              <button
                onClick={() => setScannerTab('camera')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  scannerTab === 'camera' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
                <span>Kamera Langsung</span>
              </button>
              <button
                onClick={() => setScannerTab('manual')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  scannerTab === 'manual' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">keyboard</span>
                <span>Input / Barcode Gun</span>
              </button>
            </div>

            {/* Tab 1: Kamera Live Scanner */}
            {scannerTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-primary/50 shadow-inner">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />

                  {/* Laser Scanning Line Animation */}
                  <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ff0000] pointer-events-none animate-pulse"></div>

                  {/* Guide Frame */}
                  <div className="absolute inset-0 border-2 border-dashed border-primary/70 pointer-events-none rounded-2xl m-6 animate-pulse"></div>

                  {/* Floating Toast Notification on Scan */}
                  {lastScannedToast && (
                    <div className="absolute top-3 inset-x-3 bg-emerald-600/95 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce z-10">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <div className="truncate flex-1">
                        <p className="truncate leading-tight">
                          {lastScannedToast.name} {lastScannedToast.qty > 1 ? `[x${lastScannedToast.qty} ${lastScannedToast.unit}]` : ''}
                        </p>
                        <p className="text-[10px] text-emerald-100 font-normal">
                          Rp {(lastScannedToast.price * lastScannedToast.qty).toLocaleString('id-ID')} &bull; Sisa stok: {lastScannedToast.stock} {lastScannedToast.unit}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Running Cart Mini Badge at Bottom of Video */}
                  <div className="absolute bottom-2.5 px-3 py-1.5 bg-black/75 backdrop-blur-md rounded-full text-xs font-bold text-white flex items-center gap-2 border border-white/10">
                    <span className="material-symbols-outlined text-sm text-primary">shopping_cart</span>
                    <span>{totalItemsCount} Item &bull; Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Switch Camera Button */}
                  <button
                    type="button"
                    onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                    className="absolute top-2.5 right-2.5 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white text-xs transition-colors cursor-pointer"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <span className="material-symbols-outlined text-sm">cameraswitch</span>
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs text-on-surface font-medium">
                    {scannerStatus || 'Arahkan kamera ke barcode produk secara stabil.'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Bisa scan beberapa produk berturut-turut tanpa menutup scanner.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Manual Input & Barcode Gun */}
            {scannerTab === 'manual' && (
              <div className="space-y-3">
                <p className="text-xs text-on-surface-variant">
                  Ketik nomor barcode atau gunakan alat fisik <strong>Barcode Gun (USB/Bluetooth)</strong>:
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (barcodeInput.trim()) {
                      handleBarcodeSubmit(barcodeInput);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Contoh: 8991998122282"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full pl-3 pr-10 py-3 bg-surface-container-low border border-outline/20 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-on-primary rounded-lg text-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">search</span>
                    </button>
                  </div>

                  {scannerStatus && (
                    <p className={`text-xs font-medium ${scannerStatus.startsWith('✅') ? 'text-emerald-600' : 'text-error'}`}>
                      {scannerStatus}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                    Cari &amp; Masukkan ke Keranjang
                  </button>
                </form>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-outline/10 flex justify-between items-center">
              <span className="text-xs font-bold text-primary">
                Total: Rp {totalAmount.toLocaleString('id-ID')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsBarcodeOpen(false);
                  setScannerStatus('');
                  setBarcodeInput('');
                  setLastScannedToast(null);
                }}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
