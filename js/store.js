/**
 * WarungCopilot Store - Synchronized State Management & LocalStorage
 */

const STORAGE_KEY = 'warungcopilot_stitch_store_v2';

const INITIAL_DATA = {
  kas: 14850000, // Rp 14.850.000
  products: [
    {
      id: 'p1',
      name: 'Beras Ramos 5kg',
      category: 'Sembako',
      stock: 2,
      minStock: 5,
      unit: 'sak',
      price: 75000,
      cost: 65000,
      supplier: 'Agen Bintang Sembako',
      status: 'kritis'
    },
    {
      id: 'p2',
      name: 'Minyak Kita 2L',
      category: 'Minyak & Bumbu',
      stock: 3,
      minStock: 8,
      unit: 'pouch',
      price: 34000,
      cost: 29000,
      supplier: 'Grosir Maju Jaya',
      status: 'kritis'
    },
    {
      id: 'p3',
      name: 'Gula Pasir Rose 1kg',
      category: 'Sembako',
      stock: 5,
      minStock: 8,
      unit: 'kg',
      price: 17500,
      cost: 15000,
      supplier: 'Agen Bintang Sembako',
      status: 'kritis'
    },
    {
      id: 'p4',
      name: 'Telur Ayam 1kg',
      category: 'Sembako',
      stock: 4,
      minStock: 6,
      unit: 'kg',
      price: 28000,
      cost: 24000,
      supplier: 'Peternak Berkah',
      status: 'kritis'
    },
    {
      id: 'p5',
      name: 'Mie Instan Goreng',
      category: 'Makanan',
      stock: 48,
      minStock: 20,
      unit: 'bungkus',
      price: 3500,
      cost: 2900,
      supplier: 'Grosir Maju Jaya',
      status: 'aman'
    },
    {
      id: 'p6',
      name: 'Terigu Segitiga 1kg',
      category: 'Sembako',
      stock: 18,
      minStock: 10,
      unit: 'kg',
      price: 13000,
      cost: 11000,
      supplier: 'Agen Bintang Sembako',
      status: 'aman'
    }
  ],
  piutang: [
    {
      id: 'bon1',
      customer: 'Bu Siti (Depan RT 03)',
      phone: '081298761120',
      amount: 175000,
      items: 'Beras Ramos 5kg (1 sak) + Minyak Tropical 2L',
      daysAgo: 7,
      status: 'kritis',
      dueDateText: 'Jatuh Tempo Hari Ini'
    },
    {
      id: 'bon2',
      customer: 'Pak RT Bambang',
      phone: '081987654321',
      amount: 200000,
      items: 'Gula Pasir Rose + Kopi Sachet 2 renceng',
      daysAgo: 5,
      status: 'kritis',
      dueDateText: 'Lewat 2 Hari'
    },
    {
      id: 'bon3',
      customer: 'Mas Joko (Bengkel)',
      phone: '085712345678',
      amount: 85000,
      items: 'Rokok & Minuman Isotonik',
      daysAgo: 2,
      status: 'aman',
      dueDateText: '3 Hari Lagi'
    },
    {
      id: 'bon4',
      customer: 'Bu Wahyu (RT 01)',
      phone: '081399887766',
      amount: 120000,
      items: 'Telur Ayam 2kg + Mie Instan',
      daysAgo: 1,
      status: 'aman',
      dueDateText: '5 Hari Lagi'
    },
    {
      id: 'bon5',
      customer: 'Pak Hendra',
      phone: '081211223344',
      amount: 150000,
      items: 'Beras Ramos 5kg (2 sak)',
      daysAgo: 0,
      status: 'aman',
      dueDateText: '6 Hari Lagi'
    }
  ],
  transactions: [
    {
      id: 'tx_1',
      time: '09:35 WIB',
      title: 'Beras Ramos 5kg (2 sak)',
      type: 'tunai',
      badge: 'Tunai Lunas',
      amount: 150000,
      stockNote: 'Stok -2 Sak'
    },
    {
      id: 'tx_2',
      time: '09:12 WIB',
      title: 'Minyak Goreng 1L + Telur 1kg',
      type: 'kasbon',
      badge: 'Bon Bu Siti',
      amount: 52000,
      stockNote: 'Piutang Ditambahkan'
    },
    {
      id: 'tx_3',
      time: '08:45 WIB',
      title: 'Kulakan Telur Ayam 1 Tray (15kg)',
      type: 'kulakan',
      badge: 'Kas Keluar Kulakan',
      amount: -360000,
      stockNote: 'Peternak Berkah'
    },
    {
      id: 'tx_4',
      time: '08:10 WIB',
      title: 'Mie Instan Goreng 1 Dus (40 bks)',
      type: 'tunai',
      badge: 'Tunai QRIS BCA',
      amount: 140000,
      stockNote: 'Stok -40 bks'
    }
  ]
};

class Store {
  constructor() {
    this.listeners = [];
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Gagal membaca localStorage, gunakan INITIAL_DATA', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Gagal menulis localStorage', e);
    }
    this.notify();
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  getState() {
    return this.data;
  }

  getMetrics() {
    const totalPiutang = this.data.piutang.reduce((sum, p) => sum + p.amount, 0);
    const criticalProducts = this.data.products.filter(p => p.stock <= p.minStock);
    const criticalPiutang = this.data.piutang.filter(p => p.status === 'kritis');

    return {
      kas: this.data.kas,
      totalPiutang,
      piutangCount: this.data.piutang.length,
      criticalPiutangCount: criticalPiutang.length,
      criticalProductsCount: criticalProducts.length,
      criticalProducts
    };
  }

  // Tambah transaksi kasir kilat
  addTransaction({ itemName, amount, paymentType, customer, productId }) {
    amount = Number(amount);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    if (paymentType === 'tunai') {
      this.data.kas += amount;
      this.data.transactions.unshift({
        id: 'tx_' + Date.now(),
        time: timeStr,
        title: itemName,
        type: 'tunai',
        badge: 'Tunai Lunas',
        amount: amount,
        stockNote: 'Kas Masuk'
      });
    } else {
      // Kasbon
      const custName = customer || 'Pelanggan Langganan';
      this.data.piutang.unshift({
        id: 'bon_' + Date.now(),
        customer: custName,
        phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
        amount: amount,
        items: itemName,
        daysAgo: 0,
        status: 'aman',
        dueDateText: '7 Hari Lagi'
      });

      this.data.transactions.unshift({
        id: 'tx_' + Date.now(),
        time: timeStr,
        title: itemName,
        type: 'kasbon',
        badge: 'Bon ' + custName,
        amount: amount,
        stockNote: 'Buku Bon Ditambah'
      });
    }

    // Jika productId ada atau nama cocok, kurangi stok
    const foundProd = this.data.products.find(p => p.id === productId || itemName.toLowerCase().includes(p.name.toLowerCase()));
    if (foundProd && foundProd.stock > 0) {
      foundProd.stock = Math.max(0, foundProd.stock - 1);
      foundProd.status = foundProd.stock <= foundProd.minStock ? 'kritis' : 'aman';
    }

    this.save();
  }

  // Kulakan OCR atau Restock
  applyKulakan({ description, cashAmount, itemsAdded }) {
    this.data.kas -= Math.abs(cashAmount);

    if (itemsAdded && itemsAdded.length > 0) {
      itemsAdded.forEach(item => {
        const prod = this.data.products.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()));
        if (prod) {
          prod.stock += item.qty;
          prod.status = prod.stock <= prod.minStock ? 'kritis' : 'aman';
        }
      });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this.data.transactions.unshift({
      id: 'tx_' + Date.now(),
      time: timeStr,
      title: description || 'Kulakan Masuk',
      type: 'kulakan',
      badge: 'Kas Keluar Kulakan',
      amount: -Math.abs(cashAmount),
      stockNote: 'Stok Bertambah'
    });

    this.save();
  }

  // Pelunasan Piutang
  settlePiutang(bonId) {
    const idx = this.data.piutang.findIndex(p => p.id === bonId);
    if (idx !== -1) {
      const bon = this.data.piutang[idx];
      this.data.kas += bon.amount;
      this.data.piutang.splice(idx, 1);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

      this.data.transactions.unshift({
        id: 'tx_' + Date.now(),
        time: timeStr,
        title: `Pelunasan Bon: ${bon.customer}`,
        type: 'tunai',
        badge: 'Pelunasan Bon',
        amount: bon.amount,
        stockNote: 'Kas Bertambah'
      });

      this.save();
      return bon;
    }
    return null;
  }
}

export const store = new Store();
window.warungStore = store;
