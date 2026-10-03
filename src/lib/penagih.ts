export function hitungHariTelat(jatuhTempo: string, hariIni: Date = new Date()): number {
  const jt = new Date(jatuhTempo);
  jt.setHours(0, 0, 0, 0);
  const now = new Date(hariIni);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - jt.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function buatPesanTagih({ 
  nama, 
  nominal, 
  hariTelat, 
  toko 
}: { 
  nama: string; 
  nominal: number; 
  hariTelat: number; 
  toko: string 
}): string {
  const rupiah = `Rp ${nominal.toLocaleString('id-ID')}`;
  
  if (hariTelat <= 3) {
    return `Halo Bapak/Ibu ${nama},\n\nSemoga kabarnya baik dan sehat selalu ya. 😊\n\nIni pesan otomatis dari ${toko} untuk mengingatkan bahwa ada catatan kasbon sebesar ${rupiah} yang sudah jatuh tempo.\n\nBila ada waktu luang, silakan mampir ke warung untuk penyelesaiannya. Terima kasih banyak dan sehat selalu! 🙏`;
  } else if (hariTelat <= 14) {
    return `Halo Bapak/Ibu ${nama},\n\nMohon maaf mengganggu waktunya. 🙏\n\nKami dari ${toko} ingin mengingatkan kembali mengenai kasbon sebesar ${rupiah} yang sudah lewat jatuh tempo selama ${hariTelat} hari.\n\nKami mohon pengertiannya agar dapat segera diselesaikan, karena modalnya akan kami putar kembali untuk belanja stok warung. Terima kasih atas pengertian dan kerja samanya. 😊`;
  } else {
    return `Selamat siang Bapak/Ibu ${nama},\n\nIni pesan pengingat dari ${toko}.\n\nBerdasarkan catatan kami, terdapat tunggakan kasbon sebesar ${rupiah} yang sudah terlambat ${hariTelat} hari.\n\nMohon kebijaksanaannya untuk segera melunasi tagihan tersebut paling lambat hari ini atau besok. Kami sangat membutuhkan perputaran modal agar warung tetap bisa beroperasi. \n\nAtas perhatian dan niat baiknya, kami ucapkan terima kasih.`;
  }
}

export function buatPesanOrder({ 
  agen, 
  toko, 
  items 
}: { 
  agen: string; 
  toko: string; 
  items: { nama: string; jumlah: number; satuan: string }[] 
}): string {
  const itemList = items.map(i => `- ${i.nama} (${i.jumlah} ${i.satuan})`).join('\n');
  return `Halo ${agen},\n\nIni dari ${toko}. Saya mau pesan barang-barang berikut untuk restock warung:\n\n${itemList}\n\nMohon info ketersediaan stok, total harga, dan perkiraan waktu pengirimannya ya. Terima kasih! 🙏`;
}

export function normalisasiNomor(noHp?: string | null): string | null {
  if (!noHp) return null;
  // Hilangkan karakter selain angka dan plus
  let cleaned = noHp.replace(/[^\d+]/g, '');
  
  // Jika mulai dengan +62, hilangkan + nya
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  }
  // Jika mulai dengan 0, ganti dengan 62
  else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  // Jika tidak ada 62 di depan tapi panjang memadai, asumsikan +62 terlewat
  else if (!cleaned.startsWith('62') && cleaned.length >= 9) {
    cleaned = '62' + cleaned;
  }
  
  // Validasi panjang minimal nomor telepon Indonesia
  if (cleaned.length < 10 || cleaned.length > 15) return null;
  
  return cleaned;
}

export function linkWa(noHp: string, pesan: string): string {
  const norm = normalisasiNomor(noHp);
  if (!norm) return '#';
  return `https://wa.me/${norm}?text=${encodeURIComponent(pesan)}`;
}
