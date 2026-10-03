export interface Transaction {
  id: string;
  created_at: string;
  transaction_date?: string;
  type: 'IN' | 'OUT';
  category?: string;
  payment_method: 'CASH' | 'CREDIT';
  total_amount: number;
  items: any[];
  debt_id?: string | null;
}

export type PeriodeFilter = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'CUSTOM';

export function filterByPeriode(
  transactions: Transaction[], 
  periode: PeriodeFilter,
  customStart?: string,
  customEnd?: string
): Transaction[] {
  if (periode === 'ALL') return transactions;
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return transactions.filter(t => {
    const trxDateStr = t.transaction_date || t.created_at;
    const date = new Date(trxDateStr);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    if (periode === 'THIS_MONTH') {
      return month === currentMonth && year === currentYear;
    }
    
    if (periode === 'LAST_MONTH') {
      const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return month === targetMonth && year === targetYear;
    }
    
    if (periode === 'LAST_3_MONTHS') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return date >= threeMonthsAgo && date <= now;
    }
    
    if (periode === 'CUSTOM' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    }
    
    return true;
  });
}

export function hitungRingkasan(transactions: Transaction[]) {
  const masuk = transactions
    .filter(t => t.type === 'IN' && t.payment_method === 'CASH')
    .reduce((sum, t) => sum + t.total_amount, 0);
    
  const keluar = transactions
    .filter(t => t.type === 'OUT' && t.payment_method === 'CASH')
    .reduce((sum, t) => sum + t.total_amount, 0);
    
  return {
    kasMasuk: masuk,
    kasKeluar: keluar,
    selisih: masuk - keluar
  };
}

export function hitungLabaRugi(transactions: Transaction[]) {
  // Asumsi: penjualan adalah transaksi IN (kategori PENJUALAN atau kosong)
  const penjualan = transactions
    .filter(t => t.type === 'IN' && (t.category === 'PENJUALAN' || !t.category))
    .reduce((sum, t) => sum + t.total_amount, 0);
    
  // Asumsi: HPP (Harga Pokok Penjualan) adalah transaksi OUT untuk stok (kulakan)
  const hpp = transactions
    .filter(t => t.type === 'OUT' && (t.category === 'KULAKAN' || (t.items && t.items.length > 0 && !t.category)))
    .reduce((sum, t) => sum + t.total_amount, 0);
    
  // Biaya operasional (OUT tanpa item atau dikategorikan BIAYA_OPERASIONAL)
  const biaya = transactions
    .filter(t => t.type === 'OUT' && (t.category === 'BIAYA_OPERASIONAL' || (!t.category && (!t.items || t.items.length === 0))))
    .reduce((sum, t) => sum + t.total_amount, 0);
    
  const labaKotor = penjualan - hpp;
  const labaBersih = labaKotor - biaya;
  
  return {
    penjualan,
    hpp,
    biaya,
    labaKotor,
    labaBersih
  };
}

export function hitungPiutang(debts: any[]) {
  const aktif = debts.filter(d => d.status === 'UNPAID');
  const total = aktif.reduce((sum, d) => sum + d.amount, 0);
  
  const perPelanggan = aktif.reduce((acc, curr) => {
    if (!acc[curr.customer_name]) {
      acc[curr.customer_name] = { total: 0, count: 0, telat: false };
    }
    acc[curr.customer_name].total += curr.amount;
    acc[curr.customer_name].count += 1;
    
    const dueDate = new Date(curr.due_date).getTime();
    if (dueDate < Date.now()) {
      acc[curr.customer_name].telat = true;
    }
    
    return acc;
  }, {} as Record<string, { total: number; count: number; telat: boolean }>);
  
  return {
    totalAktif: total,
    jumlahPelanggan: Object.keys(perPelanggan).length,
    perPelanggan
  };
}

export function hitungNilaiPersediaan(products: any[]) {
  return products.reduce((acc, curr) => {
    const hargaBeli = (curr.cost_price && curr.cost_price > 0) ? curr.cost_price : (curr.price * 0.8);
    return acc + (Math.floor(hargaBeli) * curr.stock);
  }, 0);
}

export interface BukuBesarRow {
  tanggal: string;
  keterangan: string;
  masuk: number;
  keluar: number;
  saldo: number;
}

export function buatBukuBesar(transactions: Transaction[], saldoAwal: number = 0): BukuBesarRow[] {
  // Urutkan kronologis
  const sorted = [...transactions].sort((a, b) => {
    const dateA = new Date(a.transaction_date || a.created_at).getTime();
    const dateB = new Date(b.transaction_date || b.created_at).getTime();
    return dateA - dateB;
  });
  
  let currentSaldo = saldoAwal;
  const rows: BukuBesarRow[] = [];
  
  sorted.forEach(t => {
    let masuk = 0;
    let keluar = 0;
    
    if (t.type === 'IN') {
      masuk = t.total_amount;
      if (t.payment_method === 'CASH') {
        currentSaldo += masuk;
      }
    } else {
      keluar = t.total_amount;
      if (t.payment_method === 'CASH') {
        currentSaldo -= keluar;
      }
    }
    
    let keterangan = '';
    if (t.category) {
      keterangan = t.category.replace(/_/g, ' ');
    } else {
      keterangan = t.type === 'IN' 
        ? (t.payment_method === 'CREDIT' ? 'Penjualan (Kasbon)' : 'Penjualan')
        : (t.payment_method === 'CREDIT' ? 'Kulakan (Ngutang)' : 'Kulakan/Biaya');
    }
      
    if (t.items && t.items.length > 0) {
      const itemNames = t.items.map(i => i.name).join(', ');
      keterangan += ` - ${itemNames}`;
    }
    
    rows.push({
      tanggal: t.transaction_date || t.created_at,
      keterangan,
      masuk: t.payment_method === 'CASH' ? masuk : 0, // Hanya uang tunai riil yang masuk saldo kas
      keluar: t.payment_method === 'CASH' ? keluar : 0,
      saldo: currentSaldo
    });
  });
  
  return rows;
}
