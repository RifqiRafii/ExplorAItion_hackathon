export interface Transaction {
  id: string;
  created_at: string;
  type: 'IN' | 'OUT';
  payment_method: 'CASH' | 'CREDIT';
  total_amount: number;
  items: any[];
  debt_id?: string | null;
}

export type PeriodeFilter = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS';

export function filterByPeriode(transactions: Transaction[], periode: PeriodeFilter): Transaction[] {
  if (periode === 'ALL') return transactions;
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return transactions.filter(t => {
    const date = new Date(t.created_at);
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
  // Asumsi: penjualan adalah transaksi IN
  const penjualan = transactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + t.total_amount, 0);
    
  // Asumsi: HPP (Harga Pokok Penjualan) adalah transaksi OUT untuk stok (kulakan)
  const hpp = transactions
    .filter(t => t.type === 'OUT' && t.items && t.items.length > 0)
    .reduce((sum, t) => sum + t.total_amount, 0);
    
  // Asumsi biaya lain-lain (OUT tanpa item spesifik atau ditandai beda)
  // Untuk kesederhanaan, mari kelompokkan semua OUT non-kulakan ke biaya, 
  // atau anggap semua OUT adalah HPP jika warung sederhana.
  // Di sini kita anggap semua OUT yang tidak memiliki item adalah biaya operasional.
  const biaya = transactions
    .filter(t => t.type === 'OUT' && (!t.items || t.items.length === 0))
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
    // Harga persediaan idealnya memakai harga_beli, namun jika tidak ada field tersebut,
    // kita asumsikan 80% dari harga jual sebagai estimasi kasar nilai inventaris.
    // (Berdasarkan praktik warung umum)
    const hargaBeliEstimasi = curr.harga_beli || (curr.price * 0.8);
    return acc + (hargaBeliEstimasi * curr.stock);
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
  const sorted = [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
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
    
    // Keterangan default
    let keterangan = t.type === 'IN' 
      ? (t.payment_method === 'CREDIT' ? 'Penjualan (Kasbon)' : 'Penjualan')
      : (t.payment_method === 'CREDIT' ? 'Kulakan (Ngutang)' : 'Kulakan/Biaya');
      
    if (t.items && t.items.length > 0) {
      const itemNames = t.items.map(i => i.name).join(', ');
      keterangan += ` - ${itemNames}`;
    }
    
    rows.push({
      tanggal: t.created_at,
      keterangan,
      masuk: t.payment_method === 'CASH' ? masuk : 0, // Hanya uang tunai riil yang masuk saldo kas
      keluar: t.payment_method === 'CASH' ? keluar : 0,
      saldo: currentSaldo
    });
  });
  
  return rows;
}
