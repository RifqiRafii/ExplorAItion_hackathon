/**
 * WarungCopilot Store - State Management & LocalStorage Persistence
 */

const STORAGE_KEY = 'warung_copilot_data_v1';

const INITIAL_DATA = {
  kas: 1450000, // Rp 1.450.000 saldo kas riil
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
      supplier: 'Agen Bintang'
    },
    {
      id: 'p2',
      name: 'Minyak Goreng 2L',
      category: 'Minyak & Bumbu',
      stock: 14,
      minStock: 6,
      unit: 'pouch',
      price: 34000,
      cost: 29000,
      supplier: 'Grosir Maju Jaya'
    },
    {
      id: 'p3',
      name: 'Gula Pasir 1kg',
      category: 'Sembako',
      stock: 8,
      minStock: 5,
      unit: 'kg',
      price: 17500,
      cost: 15000,
      supplier: 'Agen Bintang'
    },
    {
      id: 'p4',
      name: 'Telur Ayam 1kg',
      category: 'Sembako',
      stock: 12,
      minStock: 5,
      unit: 'kg',
      price: 28000,
      cost: 24000,
      supplier: 'Peternak Berkah'
    },
    {
      id: 'p5',
      name: 'Mi Instan Goreng',
      category: 'Makanan',
      stock: 40,
      minStock: 15,
      unit: 'bungkus',
      price: 3500,
      cost: 2900,
      supplier: 'Grosir Maju Jaya'
    }
  ],
  piutang: [
    {
      id: 'bon1',
      customer: 'Bu Siti (Tetangga Depan)',
      phone: '081234567890',
      amount: 150000,
      items: '2 sak Beras Ramos 5kg',
      daysAgo: 7,
      dueDateText: 'Jatuh Tempo Hari Ini',
      status: 'pending' // pending | paid
    },
    {
      id: 'bon2',
      customer: 'Pak RT Bambang',
      phone: '081987654321',
      amount: 200000,
      items: 'Gula Pasir + Mi Instan',
      daysAgo: 3,
      dueDateText: 'Jatuh Tempo 4 Hari Lagi',
      status: 'pending'
    }
  ],
  transactions: [
    {
      id: 'tx_init_1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      type: 'penjualan_tunai',
      description: 'Penjualan 2 pouch Minyak Goreng 2L',
      cashChange: 68000,
      receivableChange: 0,
      itemsSummary: '2 Minyak Goreng'
    },
    {
      id: 'tx_init_2',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      type: 'penjualan_bon',
      description: 'Bon Bu Siti (2 sak Beras Ramos)',
      cashChange: 0,
      receivableChange: 150000,
      itemsSummary: '2 sak Beras Ramos'
    },
    {
      id: 'tx_init_3',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'kulakan_masuk',
      description: 'Kulakan Mi Instan 1 karton (Agen Bintang)',
      cashChange: -116000,
      receivableChange: 0,
      itemsSummary: '40 bungkus Mi Instan'
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
      console.warn('Gagal memuat dari localStorage, memakai data default.', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage', e);
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

  // Ringkasan metrik
  getMetrics() {
    const totalPiutang = this.data.piutang
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const criticalProducts = this.data.products.filter(p => p.stock <= p.minStock);

    return {
      kas: this.data.kas,
      totalPiutang,
      piutangCount: this.data.piutang.filter(p => p.status === 'pending').length,
      criticalProductsCount: criticalProducts.length,
      criticalProducts
    };
  }
}

export const store = new Store();
