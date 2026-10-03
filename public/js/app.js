/**
 * WarungCopilot - Main App Controller for Stitch Modern Retail Engine
 */

import { store } from './store.js';

// Format Rupiah Helper
export function formatRupiah(num) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
}

// Global View Switcher
export function switchView(targetViewId) {
  const views = ['view-beranda', 'view-chat', 'view-piutang', 'view-stok'];
  views.forEach(vId => {
    const el = document.getElementById(vId);
    if (el) {
      if (vId === targetViewId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Update Sidebar active state
  const navLinks = document.querySelectorAll('#sidebarNav .nav-item');
  navLinks.forEach(link => {
    const viewAttr = link.getAttribute('data-view');
    if (viewAttr === targetViewId) {
      link.className = "nav-item flex items-center justify-between px-space-md py-space-sm rounded-xl font-label-lg text-label-lg transition-all bg-primary-container text-on-primary-container font-headline-sm shadow-sm";
    } else {
      link.className = "nav-item flex items-center justify-between px-space-md py-space-sm rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all";
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchView = switchView;

// Global Toast
export function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMsg');
  if (toast && toastMsg) {
    toastMsg.innerText = message;
    toast.classList.remove('translate-x-96', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.add('translate-x-96', 'opacity-0');
      toast.classList.remove('translate-x-0', 'opacity-100');
    }, 3500);
  }
}
window.showToast = showToast;

// Reset Demo Confirmation
window.resetDemoPrompt = function() {
  if (confirm('Kembalikan seluruh data kas, stok, dan piutang ke kondisi awal demo Stitch?')) {
    store.reset();
    showToast('Data demo berhasil direset ke kondisi awal!');
  }
};

/* =========================================================================
   MODAL 1: TRANSAKSI KILAT (< 10 DETIK)
   ========================================================================= */
let currentPaymentMode = 'tunai';
let selectedQuickSkuId = null;

window.openTransactionModal = function() {
  const modal = document.getElementById('modalTransaksiKilat');
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
  document.getElementById('txItemName').focus();
};

window.closeTransactionModal = function() {
  const modal = document.getElementById('modalTransaksiKilat');
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 200);
  document.getElementById('txItemName').value = '';
  document.getElementById('txAmount').value = '';
  document.getElementById('txCustomerName').value = '';
  selectedQuickSkuId = null;
  window.setPaymentType('tunai');
};

window.selectQuickSku = function(name, price, id) {
  document.getElementById('txItemName').value = name;
  document.getElementById('txAmount').value = price;
  selectedQuickSkuId = id;
};

window.setPaymentType = function(type) {
  currentPaymentMode = type;
  const tunaiBtn = document.getElementById('payTunaiBtn');
  const kasbonBtn = document.getElementById('payKasbonBtn');
  const customerBox = document.getElementById('kasbonCustomerBox');

  if (type === 'tunai') {
    tunaiBtn.className = "py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm";
    kasbonBtn.className = "py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-1.5";
    customerBox.classList.add('hidden');
  } else {
    kasbonBtn.className = "py-2.5 rounded-lg bg-tertiary text-on-tertiary font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm";
    tunaiBtn.className = "py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-1.5";
    customerBox.classList.remove('hidden');
    document.getElementById('txCustomerName').focus();
  }
};

window.saveInstantTransaction = function() {
  const itemName = document.getElementById('txItemName').value.trim() || 'Penjualan Sembako';
  const amountVal = Number(document.getElementById('txAmount').value);
  const customer = document.getElementById('txCustomerName').value.trim();

  if (!amountVal || amountVal <= 0) {
    alert('Silakan masukkan nominal transaksi yang valid!');
    return;
  }

  store.addTransaction({
    itemName,
    amount: amountVal,
    paymentType: currentPaymentMode,
    customer,
    productId: selectedQuickSkuId
  });

  const formatted = new Intl.NumberFormat('id-ID').format(amountVal);
  if (currentPaymentMode === 'tunai') {
    showToast(`Sukses mencatat ${itemName} Rp ${formatted} tunai!`);
  } else {
    showToast(`Sukses mencatat kasbon ${customer || 'Pelanggan'} Rp ${formatted}!`);
  }

  window.closeTransactionModal();
};

/* =========================================================================
   MODAL 2: DRAF WA PENAGIHAN SANTUN
   ========================================================================= */
let currentWaCustomer = 'Bu Siti (0812-9876-1120)';
let currentWaAmount = 175000;

window.openWaDraftModal = function(customer = 'Bu Siti (0812-9876-1120)', amount = 175000) {
  currentWaCustomer = customer;
  currentWaAmount = amount;
  const modal = document.getElementById('modalWaDraft');
  document.getElementById('waRecipient').innerText = customer;
  document.getElementById('waAmount').innerText = formatRupiah(amount);

  const cleanName = customer.split('(')[0].trim();
  const textMsg = `"Assalamu’alaikum ${cleanName}, semoga sehat selalu ya sekeluarga 🙏 Maaf sekadar mengingatkan catatan belanjaan sembako tempo kemarin sebesar ${formatRupiah(amount)} sudah jatuh tempo hari ini. Jika ada waktu longgar bisa dititipkan ke warung atau lewat QRIS ya. Matur nuwun sanget 😊 - Warung Berkah"`;
  document.getElementById('waMessageText').innerText = textMsg;

  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.closeWaModal = function() {
  const modal = document.getElementById('modalWaDraft');
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 200);
};

window.sendWaMessage = function() {
  const cleanName = currentWaCustomer.split('(')[0].trim();
  const message = `Assalamu’alaikum ${cleanName}, semoga sehat selalu ya sekeluarga 🙏 Maaf sekadar mengingatkan catatan belanjaan sembako tempo kemarin sebesar ${formatRupiah(currentWaAmount)} sudah jatuh tempo hari ini. Jika longgar bisa dititipkan ke warung atau lewat QRIS ya. Matur nuwun sanget 😊 - Warung Berkah`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  window.closeWaModal();
  showToast('Membuka WhatsApp dengan draf pesan ramah...');
};

/* =========================================================================
   MODAL 3: QRIS PREVIEW
   ========================================================================= */
window.showQrisCode = function() {
  const modal = document.getElementById('modalQris');
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.closeQrisModal = function() {
  const modal = document.getElementById('modalQris');
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 200);
};

/* =========================================================================
   MODAL 4: OCR SCAN NOTA KULAKAN
   ========================================================================= */
window.openOcrModal = function() {
  const modal = document.getElementById('modalOcrScan');
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
  const laser = document.getElementById('scannerLaser');
  if (laser) {
    laser.style.display = 'block';
  }
};

window.closeOcrModal = function() {
  const modal = document.getElementById('modalOcrScan');
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 200);
};

window.applyOcrToStore = function() {
  store.applyKulakan({
    description: 'Kulakan Faktur #AG-9821 (Agen Bintang)',
    cashAmount: 998000,
    itemsAdded: [
      { name: 'Beras Ramos 5kg', qty: 10 },
      { name: 'Minyak Kita 2L', qty: 12 }
    ]
  });
  window.closeOcrModal();
  showToast('Faktur berhasil disetujui! Stok Beras Ramos & Minyak bertambah, Kas terpotong Rp 998.000');
};

/* =========================================================================
   MODAL 5: RESTOCK PO DRAWER
   ========================================================================= */
window.openPODrawer = function() {
  const modal = document.getElementById('modalPODrawer');
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.closePODrawer = function() {
  const modal = document.getElementById('modalPODrawer');
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 200);
};

window.triggerQuickWhatsAppPO = function() {
  const text = `Halo Agen Bintang Sembako, ini Pak Budi dari Warung Berkah. Mau pesan restock darurat:\n1. Beras Ramos 5kg: 10 sak\n2. Minyak Kita 2L: 2 karton\nMohon dikirim sore ini ya Mas. Terima kasih!`;
  window.open(`https://wa.me/6281388997711?text=${encodeURIComponent(text)}`, '_blank');
  window.closePODrawer();
  showToast('Draf pesanan PO Agen Bintang berhasil dibuka di WhatsApp!');
};

/* =========================================================================
   VOICE & MISC ACTIONS
   ========================================================================= */
window.triggerVoiceInput = function() {
  const mic = document.getElementById('micIconDash');
  if (mic) mic.classList.add('animate-pulse', 'text-error');
  showToast('Mendengarkan suara Pak Budi... "Katakan nama barang & harga"');
  setTimeout(() => {
    if (mic) mic.classList.remove('animate-pulse', 'text-error');
    window.openTransactionModal();
    document.getElementById('txItemName').value = 'Beras Ramos 5kg (2 Sak)';
    document.getElementById('txAmount').value = 150000;
    showToast('Copilot AI mengenali: "Beras Ramos 5kg (2 Sak) Rp 150.000"');
  }, 1600);
};

window.refreshData = function() {
  const icon = document.getElementById('refreshIcon');
  if (icon) icon.classList.add('animate-spin');
  setTimeout(() => {
    if (icon) icon.classList.remove('animate-spin');
    app.render();
    showToast('Data Kasir & Stok berhasil disinkronkan real-time!');
  }, 600);
};

/* =========================================================================
   COPILOT AI CHAT ENGINE
   ========================================================================= */
window.insertQuickPrompt = function(btn) {
  const input = document.getElementById('chatInput');
  const text = btn.innerText.replace(/"/g, '').trim();
  input.value = text;
  input.focus();
};

window.toggleVoiceRecording = function() {
  const mic = document.getElementById('micIconChat');
  const btn = document.getElementById('voiceBtn');
  const input = document.getElementById('chatInput');

  if (mic.classList.contains('text-error')) {
    mic.classList.remove('text-error', 'animate-pulse');
    btn.classList.remove('bg-error-container');
  } else {
    mic.classList.add('text-error', 'animate-pulse');
    btn.classList.add('bg-error-container');
    input.placeholder = "Mendengarkan suara Pak Budi...";
    setTimeout(() => {
      input.value = "Laku Beras Ramos 5kg 2 sak tunai, sama Bu Siti bon Minyak Kita 1 pouch";
      mic.classList.remove('text-error', 'animate-pulse');
      btn.classList.remove('bg-error-container');
      input.placeholder = "Ketik transaksi santai, tanya stok, atau bon utang...";
    }, 2200);
  }
};

window.clearChatSession = function() {
  const stream = document.getElementById('chatStream');
  stream.innerHTML = `
    <div class="flex items-center justify-center my-space-xs">
      <span class="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-on-surface-variant shadow-sm">
        Sesi Baru Dimulai &bull; WarungCopilot
      </span>
    </div>
    <div class="flex items-start gap-space-sm max-w-[85%]">
      <div class="w-8 h-8 rounded-xl bg-primary text-on-primary flex-shrink-0 flex items-center justify-center shadow-sm">
        <span class="material-symbols-outlined text-lg">smart_toy</span>
      </div>
      <div class="bg-surface-container-low p-space-md rounded-2xl rounded-tl-none shadow-sm space-y-1">
        <p class="font-headline-sm text-headline-sm font-bold text-on-surface">Sesi baru aktif, Pak Budi!</p>
        <p class="font-body-md text-body-md text-on-surface-variant">Ketik atau dikte transaksi yang baru terjadi ya.</p>
      </div>
    </div>
  `;
  showToast('Sesi obrolan baru telah disiapkan.');
};

window.sendChatMessage = function() {
  const input = document.getElementById('chatInput');
  const stream = document.getElementById('chatStream');
  const message = input.value.trim();
  if (!message) return;

  // Render User Message Bubble
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const userDiv = document.createElement('div');
  userDiv.className = 'flex items-start justify-end gap-space-sm w-full';
  userDiv.innerHTML = `
    <div class="bg-primary text-on-primary p-space-md rounded-2xl rounded-tr-none shadow-md max-w-[80%] space-y-1">
      <p class="font-body-md text-body-md leading-relaxed">${message}</p>
      <div class="flex items-center justify-end gap-1 pt-1 opacity-80">
        <span class="font-label-sm text-label-sm">${timeStr}</span>
        <span class="material-symbols-outlined text-base">done</span>
      </div>
    </div>
    <div class="w-8 h-8 rounded-xl bg-surface-container text-on-surface-variant flex-shrink-0 flex items-center justify-center overflow-hidden">
      <img src="assets/avatar_pak_budi.png" onerror="this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuChconI_v6O-ZGaP4RkfIjsh8jl98iZmTB-e1TPe8rSvU9zz6QotAIZFbMWXgVJGB9GJiI-THN1O0KaZkwDNjVivEoeGa4YUggnVQ8_nbUG94rART-FTX5td7aBW4m6FMm2wGfPzWPVezeweuxchOEIA-NS-0Zez0c7yGBuLTWavvVWcJ1DEhYyVxlkbf1GzZZ41YdIp5KMAVC2XUzHvaPNZnU7W9qUN5Mzcr4_KARQ3CkjcumL4h5rhw'" alt="Pak Budi" class="w-full h-full object-cover">
    </div>
  `;
  stream.appendChild(userDiv);
  input.value = '';
  stream.scrollTop = stream.scrollHeight;

  // AI Natural Language Parser Simulation
  setTimeout(() => {
    const lower = message.toLowerCase();
    const isMixed = lower.includes('bon') || lower.includes('utang') || lower.includes('diutang');

    let cashAmt = 150000;
    let bonAmt = 34000;
    let customerName = 'Bu Siti';

    if (lower.includes('bu wahyu')) customerName = 'Bu Wahyu';
    if (lower.includes('pak joko') || lower.includes('mas joko')) customerName = 'Mas Joko';
    if (lower.includes('pak rt')) customerName = 'Pak RT';

    const botDiv = document.createElement('div');
    botDiv.className = 'flex items-start gap-space-sm max-w-[92%] animate-fade-in';

    if (isMixed) {
      botDiv.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-primary text-on-primary flex-shrink-0 flex items-center justify-center shadow-sm">
          <span class="material-symbols-outlined text-lg">smart_toy</span>
        </div>
        <div class="w-full bg-surface-container-lowest rounded-2xl rounded-tl-none p-space-md shadow-md space-y-space-md">
          <div class="flex items-center justify-between pb-space-xs">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span class="font-label-md text-label-md font-bold text-primary">Deteksi Transaksi Campuran Sukses</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">Akurasi AI: 99.4%</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface">
            Siap Pak Budi! Copilot memisahkan antara <strong>Kas Tunai Masuk</strong> dan <strong>Catatan Bon ${customerName}</strong>:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            <div class="bg-surface-container-low p-space-sm rounded-xl space-y-1">
              <span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span class="material-symbols-outlined text-primary text-sm">payments</span> Kas Masuk Tunai
              </span>
              <div class="font-headline-sm text-headline-sm font-bold text-primary">+Rp 150.000</div>
              <span class="font-body-sm text-body-sm text-on-surface-variant">Beras Ramos 5kg (2 sak)</span>
            </div>
            <div class="bg-tertiary-fixed/30 p-space-sm rounded-xl space-y-1">
              <span class="font-label-sm text-label-sm text-tertiary font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">menu_book</span> Bon ${customerName}
              </span>
              <div class="font-headline-sm text-headline-sm font-bold text-tertiary">+Rp 34.000</div>
              <span class="font-body-sm text-body-sm text-on-surface-variant">Minyak Kita 2L (1 pouch)</span>
            </div>
          </div>
          <div class="p-3 bg-surface-container-low rounded-xl text-body-sm text-body-sm text-on-surface-variant flex items-center justify-between">
            <span>Stok terpotong otomatis: Beras (-2), Minyak (-1)</span>
            <span class="text-error font-bold">Stok Beras sisa 0 sak!</span>
          </div>
          <div class="pt-2 flex items-center justify-end gap-2">
            <button class="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md" onclick="this.closest('.flex.items-start').remove()">
              Batal
            </button>
            <button class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container active:scale-95 transition-transform flex items-center gap-1.5" onclick="confirmChatTransaction(this, 150000, 34000, '${customerName}')">
              <span class="material-symbols-outlined text-base">check</span>
              <span>Setuju &amp; Simpan ke Buku Kas</span>
            </button>
          </div>
        </div>
      `;
    } else {
      botDiv.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-primary text-on-primary flex-shrink-0 flex items-center justify-center shadow-sm">
          <span class="material-symbols-outlined text-lg">smart_toy</span>
        </div>
        <div class="w-full bg-surface-container-lowest rounded-2xl rounded-tl-none p-space-md shadow-md space-y-space-md">
          <div class="flex items-center justify-between">
            <span class="font-label-md text-label-md font-bold text-primary flex items-center gap-1">
              <span class="material-symbols-outlined text-base">verified</span> Transaksi Tunai Terdeteksi
            </span>
            <span class="font-label-sm text-label-sm text-outline">Siap Masuk Kas</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface">
            Item penjualan: <strong>Beras Ramos 5kg (2 sak)</strong> senilai <strong>Rp 150.000</strong> tunai lunas.
          </p>
          <div class="flex justify-end gap-2">
            <button class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container active:scale-95 transition-transform flex items-center gap-1.5" onclick="confirmChatTransaction(this, 150000, 0, '')">
              <span class="material-symbols-outlined text-base">save</span>
              <span>Setuju &amp; Catat Kas Masuk</span>
            </button>
          </div>
        </div>
      `;
    }

    stream.appendChild(botDiv);
    stream.scrollTop = stream.scrollHeight;
  }, 700);
};

window.confirmChatTransaction = function(btn, cashAmt, bonAmt, customer) {
  if (cashAmt > 0) {
    store.addTransaction({
      itemName: 'Beras Ramos 5kg (2 sak)',
      amount: cashAmt,
      paymentType: 'tunai',
      customer: ''
    });
  }
  if (bonAmt > 0) {
    store.addTransaction({
      itemName: 'Minyak Kita 2L (1 pouch)',
      amount: bonAmt,
      paymentType: 'kasbon',
      customer: customer || 'Bu Siti'
    });
  }

  btn.innerHTML = `<span class="material-symbols-outlined text-base">check_circle</span> <span>Tersimpan di Buku Kas!</span>`;
  btn.className = "px-5 py-2.5 rounded-xl bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold pointer-events-none flex items-center gap-1.5";
  showToast(`Transaksi berhasil dibukukan! Kas +${formatRupiah(cashAmt)} ${bonAmt > 0 ? `& Bon ${customer} +${formatRupiah(bonAmt)}` : ''}`);
};

/* =========================================================================
   APP CONTROLLER CLASS (DATA RENDERER)
   ========================================================================= */
class AppController {
  constructor() {
    this.init();
  }

  init() {
    // Hash routing listener
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();

    // Attach click events on sidebar items
    document.querySelectorAll('#sidebarNav .nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const viewId = el.getAttribute('data-view');
        if (viewId) {
          switchView(viewId);
        }
      });
    });

    // Subscribe to state updates
    store.subscribe(() => {
      this.render();
    });

    this.render();
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'chat') switchView('view-chat');
    else if (hash === 'piutang') switchView('view-piutang');
    else if (hash === 'stok') switchView('view-stok');
    else switchView('view-beranda');
  }

  render() {
    const state = store.getState();
    const metrics = store.getMetrics();

    // 1. Top Header Pills
    const topKas = document.getElementById('topPillKas');
    const topPiutang = document.getElementById('topPillPiutang');
    const topStok = document.getElementById('topPillStok');
    if (topKas) topKas.innerText = formatRupiah(metrics.kas);
    if (topPiutang) topPiutang.innerText = formatRupiah(metrics.totalPiutang);
    if (topStok) topStok.innerText = `${metrics.criticalProductsCount} Kritis`;

    // Sidebar Badges
    const sidePiutang = document.getElementById('sideBadgePiutang');
    const sideStok = document.getElementById('sideBadgeStok');
    if (sidePiutang) sidePiutang.innerText = `${metrics.criticalPiutangCount} Jatuh Tempo`;
    if (sideStok) sideStok.innerText = `${metrics.criticalProductsCount} Kritis`;

    // 2. Beranda Dashboard Values
    const dashKas = document.getElementById('dashValKas');
    const dashPiutang = document.getElementById('dashValPiutang');
    const dashCountBon = document.getElementById('dashCountBon');
    const dashBadgeDue = document.getElementById('dashBadgeDue');
    const dashBadgeKritis = document.getElementById('dashBadgeKritis');
    if (dashKas) dashKas.innerText = formatRupiah(metrics.kas);
    if (dashPiutang) dashPiutang.innerText = formatRupiah(metrics.totalPiutang);
    if (dashCountBon) dashCountBon.innerText = `${metrics.piutangCount} Pelanggan Warung`;
    if (dashBadgeDue) dashBadgeDue.innerHTML = `<span class="material-symbols-outlined text-xs">schedule</span> ${metrics.criticalPiutangCount} Jatuh Tempo`;
    if (dashBadgeKritis) dashBadgeKritis.innerHTML = `<span class="material-symbols-outlined text-xs">notification_important</span> ${metrics.criticalProductsCount} Kritis`;

    // 3. Telemetry in Chat
    const chatKas = document.getElementById('chatTelemetryKas');
    const chatPiutang = document.getElementById('chatTelemetryPiutang');
    if (chatKas) chatKas.innerText = formatRupiah(metrics.kas);
    if (chatPiutang) chatPiutang.innerText = formatRupiah(metrics.totalPiutang);

    // 4. Render Transactions in Beranda
    this.renderTransactionList(state.transactions);

    // 5. Render Piutang Cards in Buku Piutang
    this.renderPiutangCards(state.piutang);

    // 6. Render Inventory Table in Stok
    this.renderInventoryTable(state.products);
  }

  renderTransactionList(transactions) {
    const container = document.getElementById('transactionListContainer');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-on-surface-variant font-body-sm">Belum ada transaksi kasir hari ini.</div>`;
      return;
    }

    container.innerHTML = transactions.map(t => {
      let icon = 'check';
      let iconBg = 'bg-primary/10 text-primary';
      let amountClass = 'text-primary font-bold';
      let amountSign = '+';

      if (t.type === 'kasbon') {
        icon = 'edit_note';
        iconBg = 'bg-tertiary-fixed text-on-tertiary-fixed';
        amountClass = 'text-tertiary font-bold';
        amountSign = '';
      } else if (t.type === 'kulakan') {
        icon = 'local_shipping';
        iconBg = 'bg-error-container text-error';
        amountClass = 'text-error font-bold';
        amountSign = '';
      }

      return `
        <div class="p-space-sm rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-space-sm">
          <div class="flex items-center gap-space-sm min-w-0">
            <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">${icon}</span>
            </div>
            <div class="min-w-0">
              <h4 class="font-label-md text-label-md text-on-surface font-bold truncate">${t.title}</h4>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="font-label-sm text-label-sm px-1.5 py-0.5 rounded ${t.type === 'tunai' ? 'bg-secondary-container/60 text-on-secondary-container' : (t.type === 'kasbon' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-error')}">${t.badge}</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant">${t.stockNote || ''}</span>
              </div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="font-headline-sm text-headline-sm ${amountClass}">${amountSign}${formatRupiah(Math.abs(t.amount))}</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">${t.time || 'Baru saja'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPiutangCards(piutangList) {
    const container = document.getElementById('piutangCardList');
    const totalAmountEl = document.getElementById('piutangTotalAmount');
    const totalCountEl = document.getElementById('piutangTotalCount');

    if (totalAmountEl) {
      const sum = piutangList.reduce((acc, p) => acc + p.amount, 0);
      totalAmountEl.innerText = formatRupiah(sum);
    }
    if (totalCountEl) {
      totalCountEl.innerText = `${piutangList.length} Pelanggan Bon Aktif`;
    }

    if (!container) return;

    if (!piutangList || piutangList.length === 0) {
      container.innerHTML = `<div class="p-8 text-center bg-surface-container-lowest rounded-xl text-primary font-bold">Hebat! Semua buku bon kasbon lunas. Tidak ada piutang menggantung.</div>`;
      return;
    }

    container.innerHTML = piutangList.map(b => {
      const isKritis = b.status === 'kritis';
      const initials = b.customer.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

      return `
        <div class="bon-card bg-surface-container-lowest p-space-md rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md" data-status="${b.status}">
          <div class="flex items-start gap-space-md flex-1">
            <div class="w-12 h-12 rounded-xl ${isKritis ? 'bg-error-container text-error' : 'bg-surface-container text-primary'} flex items-center justify-center font-headline-sm text-headline-sm font-black shrink-0">
              ${initials}
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-headline-sm text-headline-sm text-on-surface font-bold">${b.customer}</span>
                <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full ${isKritis ? 'bg-error-container text-error font-bold' : 'bg-surface-container text-on-surface-variant'} flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">schedule</span> ${b.dueDateText}
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
                <strong class="text-on-surface">Item:</strong> ${b.items}
              </p>
              <div class="flex items-center gap-3 mt-1.5 text-outline font-label-sm text-label-sm">
                <span>WA: ${b.phone}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col md:items-end justify-between gap-space-xs shrink-0 pt-space-xs md:pt-0 border-t md:border-t-0 border-surface-container">
            <span class="font-headline-md text-headline-md font-extrabold ${isKritis ? 'text-error' : 'text-on-surface'}">${formatRupiah(b.amount)}</span>
            <div class="flex items-center gap-2 mt-1">
              <button class="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 transition-colors" onclick="settleCustomerBon('${b.id}')">
                <span class="material-symbols-outlined text-sm text-primary">done</span>
                <span>Tandai Lunas</span>
              </button>
              <button class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95" onclick="openWaDraftModal('${b.customer} (${b.phone})', ${b.amount})">
                <span class="material-symbols-outlined text-sm">send</span>
                <span>Tagih via WA</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderInventoryTable(products) {
    const tbody = document.getElementById('inventoryTableBody');
    const totalSkuEl = document.getElementById('stokTotalSku');
    const kritisCountEl = document.getElementById('stokKritisCount');

    if (totalSkuEl) totalSkuEl.innerHTML = `${products.length} <span class="text-body-md font-body-md text-on-surface-variant font-normal">SKU</span>`;
    const kritisCount = products.filter(p => p.stock <= p.minStock).length;
    if (kritisCountEl) kritisCountEl.innerHTML = `${kritisCount} <span class="text-body-md font-body-md text-on-error-container font-normal">Produk</span>`;

    if (!tbody) return;

    tbody.innerHTML = products.map(p => {
      const isCritical = p.stock <= p.minStock;
      const statusBadge = isCritical 
        ? `<span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold flex items-center gap-1 w-fit"><span class="material-symbols-outlined text-xs">warning</span> Kritis Order</span>`
        : `<span class="px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1 w-fit"><span class="material-symbols-outlined text-xs">check_circle</span> Aman</span>`;

      return `
        <tr class="hover:bg-surface-container-low/40 transition-colors">
          <td class="py-3.5 px-4 font-label-md text-label-md text-on-surface font-bold">
            ${p.name}
            <span class="block text-body-sm text-body-sm text-on-surface-variant font-normal">${p.category}</span>
          </td>
          <td class="py-3.5 px-4">
            <span class="font-headline-sm text-headline-sm font-extrabold ${isCritical ? 'text-error' : 'text-primary'}">${p.stock} ${p.unit}</span>
          </td>
          <td class="py-3.5 px-4 text-on-surface-variant font-body-md text-body-md">${p.minStock} ${p.unit}</td>
          <td class="py-3.5 px-4 font-headline-sm text-headline-sm text-on-surface font-bold">${formatRupiah(p.price)}</td>
          <td class="py-3.5 px-4 text-body-md text-body-md text-on-surface-variant">${p.supplier}</td>
          <td class="py-3.5 px-4">${statusBadge}</td>
          <td class="py-3.5 px-4 text-right">
            <button class="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold transition-colors" onclick="openPODrawer()">
              Pesan Restock
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Pelunasan Bon dari Buku Piutang
window.settleCustomerBon = function(bonId) {
  const bon = store.settlePiutang(bonId);
  if (bon) {
    showToast(`Bon ${bon.customer} sebesar ${formatRupiah(bon.amount)} telah ditandai lunas! Uang kas bertambah.`);
  }
};

window.openCatatKasbonModal = function() {
  window.openTransactionModal();
  window.setPaymentType('kasbon');
};

// Filter Piutang Tabs
window.filterPiutang = function(status, btn) {
  if (btn) {
    const tabs = document.querySelectorAll('#piutangFilterTabs button');
    tabs.forEach(t => {
      t.className = "px-3 py-1.5 rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-all whitespace-nowrap";
    });
    btn.className = "px-3 py-1.5 rounded-full font-label-md text-label-md font-bold bg-primary text-on-primary transition-all whitespace-nowrap active-tab";
  }

  const cards = document.querySelectorAll('#piutangCardList .bon-card');
  cards.forEach(c => {
    if (status === 'all') {
      c.style.display = 'flex';
    } else {
      c.style.display = c.getAttribute('data-status') === status ? 'flex' : 'none';
    }
  });
};

window.searchPiutang = function(query) {
  const q = query.toLowerCase();
  const cards = document.querySelectorAll('#piutangCardList .bon-card');
  cards.forEach(c => {
    c.style.display = c.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
  });
};

window.filterDashboardTransactions = function(query) {
  const q = query.toLowerCase();
  const rows = document.querySelectorAll('#transactionListContainer > div');
  rows.forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
  });
};

window.filterInventoryTable = function(query) {
  const q = query.toLowerCase();
  const rows = document.querySelectorAll('#inventoryTableBody tr');
  rows.forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
  });
};

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new AppController();
  window.warungApp = app;
});
