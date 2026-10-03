/**
 * WarungCopilot - Main App Controller
 */

import { store } from './store.js';

// Format Rupiah helper
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format Relative Time / Date helper
export function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

class App {
  constructor() {
    this.activeTab = 'inventory';
    this.initElements();
    this.attachEvents();
    this.render();

    // Subscribe to store updates
    store.subscribe(() => {
      this.render();
    });
  }

  initElements() {
    // Metric elements
    this.valCash = document.getElementById('valCash');
    this.valReceivable = document.getElementById('valReceivable');
    this.lblReceivableCount = document.getElementById('lblReceivableCount');
    this.valCriticalStock = document.getElementById('valCriticalStock');
    this.lblCriticalHint = document.getElementById('lblCriticalHint');
    this.badgeCriticalStatus = document.getElementById('badgeCriticalStatus');
    this.countInventoryTab = document.getElementById('countInventoryTab');

    // Tabs
    this.tabInventory = document.getElementById('tabInventory');
    this.tabTransactions = document.getElementById('tabTransactions');
    this.panelInventory = document.getElementById('panelInventory');
    this.panelTransactions = document.getElementById('panelTransactions');

    // Lists
    this.productList = document.getElementById('productList');
    this.transactionList = document.getElementById('transactionList');

    // Buttons
    this.btnResetDemo = document.getElementById('btnResetDemo');
    this.btnQuickManual = document.getElementById('btnQuickManual');
    this.btnScanNota = document.getElementById('btnScanNota');
    this.btnTriggerCopilot = document.getElementById('btnTriggerCopilot');
  }

  attachEvents() {
    // Tab switching
    this.tabInventory.addEventListener('click', () => this.switchTab('inventory'));
    this.tabTransactions.addEventListener('click', () => this.switchTab('transactions'));

    // Reset Demo Button
    this.btnResetDemo.addEventListener('click', () => {
      if (confirm('Kembalikan semua data ke kondisi demo awal?')) {
        store.reset();
      }
    });

    // Placeholders for future chunks
    this.btnQuickManual.addEventListener('click', () => {
      console.log('Chunk 2: Quick Manual Form');
    });

    this.btnScanNota.addEventListener('click', () => {
      console.log('Chunk 4: Scan Nota Modal');
    });

    this.btnTriggerCopilot.addEventListener('click', () => {
      console.log('Chunk 3: Copilot Chat');
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    if (tab === 'inventory') {
      this.tabInventory.classList.add('active');
      this.tabTransactions.classList.remove('active');
      this.panelInventory.style.display = 'flex';
      this.panelTransactions.style.display = 'none';
    } else {
      this.tabInventory.classList.remove('active');
      this.tabTransactions.classList.add('active');
      this.panelInventory.style.display = 'none';
      this.panelTransactions.style.display = 'flex';
    }
  }

  render() {
    const state = store.getState();
    const metrics = store.getMetrics();

    // 1. Render Metrics
    this.valCash.textContent = formatRupiah(metrics.kas);
    this.valReceivable.textContent = formatRupiah(metrics.totalPiutang);
    this.lblReceivableCount.textContent = `${metrics.piutangCount} bon belum lunas`;

    this.valCriticalStock.textContent = `${metrics.criticalProductsCount} Barang`;
    if (metrics.criticalProductsCount > 0) {
      this.badgeCriticalStatus.textContent = 'Perlu Restock';
      this.badgeCriticalStatus.className = 'badge badge-rose';
      const names = metrics.criticalProducts.map(p => p.name).join(', ');
      this.lblCriticalHint.textContent = `Kritis: ${names}`;
    } else {
      this.badgeCriticalStatus.textContent = 'Semua Aman';
      this.badgeCriticalStatus.className = 'badge badge-cash';
      this.lblCriticalHint.textContent = 'Semua stok di atas batas minimum';
    }

    this.countInventoryTab.textContent = state.products.length;

    // 2. Render Products
    this.renderProducts(state.products);

    // 3. Render Transactions
    this.renderTransactions(state.transactions);
  }

  renderProducts(products) {
    if (!products || products.length === 0) {
      this.productList.innerHTML = `<div class="empty-box">Belum ada barang di inventaris.</div>`;
      return;
    }

    this.productList.innerHTML = products
      .map(p => {
        const isCritical = p.stock <= p.minStock;
        return `
          <div class="item-card ${isCritical ? 'is-critical' : ''}">
            <div class="item-info">
              <span class="item-name">${p.name}</span>
              <span class="item-meta">${p.category} &bull; Pemasok: ${p.supplier}</span>
            </div>
            <div class="item-stats">
              <span class="item-stock-badge" style="color: ${isCritical ? 'var(--critical-rose)' : 'var(--cash-green)'}">
                ${p.stock} ${p.unit} ${isCritical ? '⚠️' : ''}
              </span>
              <span class="item-price">Jual: ${formatRupiah(p.price)}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
      this.transactionList.innerHTML = `<div class="empty-box">Belum ada transaksi tercatat.</div>`;
      return;
    }

    this.transactionList.innerHTML = transactions
      .map(t => {
        let iconClass = 'tx-icon-cash';
        let icon = '💵';
        let amountText = '';
        let amountClass = 'pos';

        if (t.type === 'penjualan_tunai') {
          iconClass = 'tx-icon-cash';
          icon = '📥';
          amountText = `+${formatRupiah(t.cashChange)}`;
          amountClass = 'pos';
        } else if (t.type === 'penjualan_bon') {
          iconClass = 'tx-icon-bon';
          icon = '📖';
          amountText = `Bon ${formatRupiah(t.receivableChange)}`;
          amountClass = 'bon';
        } else if (t.type === 'kulakan_masuk') {
          iconClass = 'tx-icon-kulakan';
          icon = '📦';
          amountText = `-${formatRupiah(Math.abs(t.cashChange))}`;
          amountClass = 'neg';
        }

        return `
          <div class="tx-card">
            <div class="tx-icon-box ${iconClass}">${icon}</div>
            <div class="tx-details">
              <div class="tx-desc">${t.description}</div>
              <div class="tx-time">${formatTime(t.timestamp)}</div>
            </div>
            <div class="tx-amount ${amountClass}">${amountText}</div>
          </div>
        `;
      })
      .join('');
  }
}

// Boot up app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.warungApp = new App();
});
