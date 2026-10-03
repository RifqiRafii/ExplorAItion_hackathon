"use client";

/**
 * WarungCopilot Landing Page (app/page.tsx)
 *
 * Struktur mengikuti landing page Modulin:
 * splash screen, navbar transparan ke solid, hero dengan typewriter,
 * strip masalah, before/after, demo workspace gelap yang beranimasi,
 * stepper interaktif, panel fitur interaktif, CTA penutup, footer.
 *
 * Catatan:
 * - Tidak butuh file gambar. Semua visual dibuat dari CSS dan JSX.
 * - Memakai token warna yang sudah ada di file lama (primary, secondary,
 *   surface, on-surface, outline, error, dst).
 * - Semua animasi punya fallback prefers-reduced-motion.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Home,
  Menu,
  MessageCircle,
  Package,
  Pencil,
  Play,
  Send,
  Store,
  Wallet,
  X,
  Zap,
} from "lucide-react";

/* =========================================================
 * 1. KONSTANTA & DATA
 * ======================================================= */

const SPLASH_MS = 2200;
/** Ubah ke true jika splash hanya ingin tampil sekali per sesi browser. */
const SHOW_SPLASH_ONCE_PER_SESSION = false;

const HERO_WORDS = ["Kas", "Bon", "Stok", "Nota"];
const HERO_CHAT_TEXT = "Laku 3 sak beras, tapi 1 sak diutang Bu Siti";

const NAV_LINKS = [
  { label: "Beranda", id: "beranda" },
  { label: "Demo", id: "demo" },
  { label: "Cara Kerja", id: "cara-kerja" },
  { label: "Fitur AI", id: "fitur" },
];
const SECTION_IDS = NAV_LINKS.map((l) => l.id);

/* Angka contoh untuk demo (data fiktif) */
const KAS_BEFORE = 14250000;
const KAS_AFTER = 14850000;
const PIUTANG_BEFORE = 4020000;
const PIUTANG_AFTER = 4320000;
const STOK_BEFORE = 2;
const STOK_AFTER = 3;

const BEFORE_ITEMS = [
  "Catat piutang di buku tulis yang mudah hilang, sobek, atau basah.",
  "Merasa untung karena ramai, tapi tidak tahu kas yang sebenarnya.",
  "Kehabisan barang laris saat pembeli sedang ramai.",
  "Sungkan menagih bon ke tetangga dan pelanggan tetap.",
];

const AFTER_ITEMS = [
  "Kas, stok, dan piutang ikut berubah dari satu kali catat.",
  "Catat lewat chat sehari-hari, foto nota, atau form kilat saat antre.",
  "Peringatan stok kritis lengkap dengan draf pesanan ke agen.",
  "Pesan tagihan yang santun siap dikirim lewat WhatsApp dalam satu ketukan.",
];

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Beranda", active: false },
  { icon: MessageCircle, label: "Copilot AI Chat", active: true },
  { icon: BookOpen, label: "Buku Piutang", active: false },
  { icon: Package, label: "Stok dan Restock", active: false },
];

const HOW_STEPS = [
  {
    tab: "1. Catat",
    title: "Langkah 1: Pilih Jalur Catat Tercepat",
    desc: "Ketik seperti chat biasa, foto nota kulakan, atau pakai form kilat saat warung sedang antre.",
  },
  {
    tab: "2. Cek",
    title: "Langkah 2: Cek Kartu Konfirmasi",
    desc: "AI memecah satu kalimat menjadi kas, stok, dan piutang. Kamu cek dulu sebelum menyimpan.",
  },
  {
    tab: "3. Simpan",
    title: "Langkah 3: Dashboard Langsung Terbarui",
    desc: "Satu ketukan Setuju dan Simpan, lalu saldo kas, piutang, dan stok ikut berubah.",
  },
];

const INPUT_PATHS = [
  {
    icon: MessageCircle,
    name: "Chat Santai",
    text: "Ketik: Laku 3 sak beras, tapi 1 sak diutang Bu Siti",
  },
  {
    icon: Camera,
    name: "Foto Nota",
    text: "Foto nota kulakan, item disiapkan jadi kartu stok masuk",
  },
  {
    icon: Pencil,
    name: "Form Kilat",
    text: "Pilih barang, isi jumlah, tandai lunas atau bon",
  },
];

const FEATURES = [
  {
    id: "chat",
    name: "Catat Lewat Chat",
    short: "Ketik seperti WhatsApp",
    icon: MessageCircle,
    description:
      "Tulis transaksi dengan bahasa sehari-hari. AI memecahnya menjadi kas masuk, stok berkurang, dan piutang baru dalam satu kartu konfirmasi.",
    steps: [
      "Ketik kalimat",
      "AI memahami",
      "Kartu konfirmasi",
      "Setuju dan simpan",
      "Dashboard terbarui",
    ],
    example:
      "Ketik “Laku 3 sak beras, tapi 1 sak diutang Bu Siti”. Hasilnya kas masuk untuk 2 sak, stok beras berkurang 3 sak, dan piutang baru atas nama Bu Siti.",
  },
  {
    id: "nota",
    name: "Foto Nota Kulakan",
    short: "Stok masuk dari foto",
    icon: Camera,
    description:
      "Foto nota belanja dari pasar atau agen. Item disiapkan sebagai kartu kulakan untuk kamu cek sebelum disimpan ke inventaris.",
    steps: [
      "Foto nota",
      "Baca item",
      "Kartu kulakan",
      "Simpan ke inventaris",
      "Stok naik, kas turun",
    ],
    example:
      "Nota dari agen berisi minyak, gula, dan mi instan. Sekali simpan, stok bertambah dan kas keluar tercatat.",
  },
  {
    id: "manual",
    name: "Form Kilat Saat Antre",
    short: "Selesai kurang dari 10 detik",
    icon: Pencil,
    description:
      "Saat warung ramai, buka form ringkas tanpa perlu berdialog. Cukup pilih barang, isi jumlah, lalu tentukan lunas atau bon.",
    steps: [
      "Ketuk Transaksi Cepat",
      "Pilih barang",
      "Isi jumlah",
      "Lunas atau bon",
      "Simpan",
    ],
    example:
      "Pembeli sedang mengantre. Pilih Minyak Kita 2L, jumlah 2, tandai lunas, lalu simpan. Dashboard ikut berubah.",
  },
  {
    id: "piutang",
    name: "Tagih Bon via WhatsApp",
    short: "Pesan santun siap kirim",
    icon: BookOpen,
    description:
      "Piutang yang lewat jatuh tempo muncul sebagai pengingat. Draf pesan penagihan yang ramah sudah disiapkan, jadi tidak perlu sungkan.",
    steps: [
      "Cek jatuh tempo",
      "Pengingat muncul",
      "Draf pesan santun",
      "Buka WhatsApp",
      "Tandai lunas",
    ],
    example:
      "Pengingat muncul: “Piutang Bu Siti sudah 7 hari. Ingin dikirim pengingat?” Satu ketukan membuka WhatsApp dengan pesan yang sudah siap.",
  },
  {
    id: "stok",
    name: "Peringatan Stok dan Kulakan",
    short: "Tidak kehabisan barang laris",
    icon: Package,
    description:
      "Saat stok menyentuh batas minimum, asisten memberi peringatan dan menyiapkan draf pesanan ke agen langganan.",
    steps: [
      "Pantau batas minimum",
      "Stok menipis",
      "Peringatan muncul",
      "Draf pesanan ke agen",
      "Kirim lewat WhatsApp",
    ],
    example:
      "Stok beras tersisa 2 sak. Asisten menawarkan draf pesanan ke Agen Bintang, tinggal kirim.",
  },
];

/* Animasi dan fallback reduced motion */
const PAGE_CSS = `
html { scroll-behavior: smooth; }

@keyframes wc-splash-logo { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
@keyframes wc-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.55); opacity: 0; } }
@keyframes wc-indeterminate {
  0% { transform: translateX(-100%) scaleX(0.2); }
  50% { transform: translateX(0) scaleX(1); }
  100% { transform: translateX(100%) scaleX(0.2); }
}
@keyframes wc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes wc-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes wc-step-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes wc-pop { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

.wc-splash-logo { animation: wc-splash-logo 0.7s cubic-bezier(0.4, 0, 0.2, 1) both; }
.wc-ring { animation: wc-ring 1.6s ease-out infinite; }
.wc-indeterminate { animation: wc-indeterminate 1.5s ease-in-out infinite; transform-origin: left; }
.wc-float { animation: wc-float 4s ease-in-out infinite; }
.wc-blink { animation: wc-blink 1s steps(1) infinite; }
.wc-step-enter { animation: wc-step-enter 0.25s ease-out both; }
.wc-pop { animation: wc-pop 0.3s ease-out both; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .wc-splash-logo, .wc-ring, .wc-indeterminate, .wc-float, .wc-blink, .wc-step-enter, .wc-pop {
    animation: none !important;
  }
}
`;

/* =========================================================
 * 2. HELPERS & HOOKS
 * ======================================================= */

function rupiah(n) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef < T > (null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

function AnimatedNumber({
  value,
  reduced,
  format,
}) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    if (reduced) {
      currentRef.current = value;
      setDisplay(value);
      return;
    }
    const from = currentRef.current;
    if (from === value) return;
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (value - from) * eased);
      currentRef.current = v;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return <>{format(display)}</>;
}

/* =========================================================
 * 3. KOMPONEN KECIL (BUBBLE, KARTU, METRIK)
 * ======================================================= */

function Bubble({
  from,
  children,
}) {
  return (
    <div className={`wc-pop flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] px-3 py-2 text-[13px] leading-snug text-gray-800 shadow-sm ${from === "user"
          ? "rounded-2xl rounded-tr-sm bg-[#d9fdd3]"
          : "rounded-2xl rounded-tl-sm bg-white"
          }`}
      >
        {children}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="wc-pop flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3.5 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ConfirmRow({
  label,
  note,
  value,
  tone,
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="leading-tight">
        <div className="font-medium text-gray-800">{label}</div>
        <div className="text-[11px] text-gray-500">{note}</div>
      </div>
      <div className={`whitespace-nowrap font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function ConfirmCard({ saved = false }) {
  return (
    <div className="wc-pop max-w-[94%] rounded-2xl rounded-tl-sm border border-black/5 bg-white p-3.5 text-gray-800 shadow-sm">
      <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-primary">
        Kartu Konfirmasi
      </div>
      <div className="space-y-2 text-[12.5px]">
        <ConfirmRow label="Kas masuk" note="2 sak lunas" value="+ Rp 600.000" tone="text-primary" />
        <ConfirmRow label="Stok beras" note="Sisa 2 sak" value="- 3 sak" tone="text-error" />
        <ConfirmRow label="Piutang baru" note="Bu Siti, 1 sak" value="Rp 300.000" tone="text-[#b45309]" />
      </div>
      <div className="mt-3 flex gap-2">
        <div
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors duration-300 ${saved ? "bg-primary/10 text-primary" : "bg-primary text-white"
            }`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tersimpan
            </>
          ) : (
            "Setuju dan Simpan"
          )}
        </div>
        {!saved && (
          <div className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600">
            Ubah
          </div>
        )}
      </div>
    </div>
  );
}


const TONE_TEXT = {
  kas: { light: "text-primary", dark: "text-[#6ee7b7]" },
  piutang: { light: "text-[#b45309]", dark: "text-[#fcd34d]" },
  stok: { light: "text-error", dark: "text-[#fca5a5]" },
};

function MetricCard({
  label,
  tone,
  dark = false,
  hint,
  children,
}) {
  return (
    <div
      className={`rounded-lg border p-3.5 ${dark ? "border-white/10 bg-[#0b2420]" : "border-outline/20 bg-white shadow-sm"
        }`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-white/50" : "text-on-surface-variant"
          }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums ${TONE_TEXT[tone][dark ? "dark" : "light"]
          }`}
      >
        {children}
      </div>
      <div
        className={`mt-1 min-h-[16px] text-[11px] transition-opacity duration-500 ${dark ? "text-white/60" : "text-on-surface-variant"
          } ${hint ? "opacity-100" : "opacity-0"}`}
      >
        {hint ?? ""}
      </div>
    </div>
  );
}

/* =========================================================
 * 4. SPLASH SCREEN
 * ======================================================= */

function Splash({ fading }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface transition-opacity duration-[400ms] ease-out ${fading ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
    >
      <div className="wc-splash-logo flex flex-col items-center">
        <div className="relative mb-6">
          <span className="wc-ring absolute inset-0 rounded-3xl bg-primary/30" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-xl">
            <Store className="h-12 w-12 text-white" strokeWidth={1.75} />
          </div>
        </div>
        <span className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          WarungCopilot
        </span>
        <span className="mt-2 text-sm text-on-surface-variant">
          Kelola warung tanpa kalkulator
        </span>
      </div>

      <div className="relative mt-8 h-[3px] w-48 overflow-hidden rounded-full bg-outline/20">
        <div className="wc-indeterminate absolute left-0 top-0 h-full w-full rounded-full bg-primary" />
      </div>
    </div>
  );
}

/* =========================================================
 * 5. NAVBAR
 * ======================================================= */

function Navbar({ visible, activeId }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ${scrolled || open
        ? "h-[64px] bg-primary/95 shadow-lg backdrop-blur-md"
        : "h-[80px] bg-transparent"
        } ${visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Kiri: logo */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15">
            <Store className="h-6 w-6 text-white" strokeWidth={1.75} />
          </span>
          <span className="font-display text-[26px] font-bold tracking-tight text-white drop-shadow-md">
            WarungCopilot
          </span>
        </Link>

        {/* Tengah: menu */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeId === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`group relative text-[15px] drop-shadow-md transition-colors ${isActive ? "font-bold text-white" : "font-medium text-white/85 hover:text-white"
                  }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left rounded-full bg-white transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Kanan: aksi */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden h-10 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-primary shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 md:inline-flex"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="hidden h-10 items-center justify-center rounded-full border border-white/40 px-6 text-sm font-bold text-white transition-all duration-200 hover:bg-white/10 md:inline-flex"
          >
            Daftar UMKM
          </Link>

          <button
            type="button"
            className="z-50 p-2 text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 top-full flex w-full flex-col gap-2 border-t border-white/10 bg-primary px-6 py-4 shadow-xl md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 py-2.5 text-[16px] font-medium text-white/90 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex h-10 flex-1 items-center justify-center rounded-full bg-white text-sm font-bold text-primary"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="flex h-10 flex-1 items-center justify-center rounded-full border border-white/40 text-sm font-bold text-white"
            >
              Daftar UMKM
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* =========================================================
 * 6. HERO
 * ======================================================= */

function TypedWord({ words, reduced }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced) {
      setText(words[0]);
      return;
    }
    const word = words[wordIndex];
    let t: ReturnType<typeof setTimeout> | undefined;

    if (!deleting && text === word) {
      t = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && text === "") {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % words.length);
    } else {
      t = setTimeout(
        () => setText(word.slice(0, text.length + (deleting ? -1 : 1))),
        deleting ? 45 : 95
      );
    }
    return () => clearTimeout(t);
  }, [text, deleting, wordIndex, reduced, words]);

  return (
    <>
      {text}
      <span className="wc-blink ml-0.5" aria-hidden="true">
        |
      </span>
    </>
  );
}

function FloatBadge({
  show,
  className,
  delay,
  children,
}) {
  return (
    <div
      className={`absolute hidden rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-xl transition-opacity duration-500 md:block ${show ? "opacity-100" : "opacity-0"
        } ${className}`}
    >
      <div className="wc-float flex items-center gap-2" style={{ animationDelay: delay }}>
        {children}
      </div>
    </div>
  );
}

function HeroPhone({ reduced }) {
  const [chars, setChars] = useState(0);
  const [stage, setStage] = useState < 0 | 1 | 2 > (0);

  useEffect(() => {
    if (reduced) {
      setChars(HERO_CHAT_TEXT.length);
      setStage(2);
      return;
    }
    let t: ReturnType<typeof setTimeout> | undefined;
    if (stage === 0) {
      if (chars < HERO_CHAT_TEXT.length) {
        t = setTimeout(() => setChars((c) => c + 1), 40);
      } else {
        t = setTimeout(() => setStage(1), 450);
      }
    } else if (stage === 1) {
      t = setTimeout(() => setStage(2), 1000);
    } else {
      t = setTimeout(() => {
        setChars(0);
        setStage(0);
      }, 4500);
    }
    return () => clearTimeout(t);
  }, [chars, stage, reduced]);

  const showBadges = stage === 2;

  return (
    <div className="relative mx-auto w-[300px] sm:w-[330px]">
      {/* Badge mengambang */}
      <FloatBadge show={showBadges} className="-left-4 lg:-left-12 top-24 z-10" delay="0s">
        <Wallet className="h-4 w-4 text-primary" />
        <span>Kas + Rp 600.000</span>
      </FloatBadge>
      <FloatBadge show={showBadges} className="-right-4 lg:-right-12 top-1/2 z-10" delay="1.1s">
        <BookOpen className="h-4 w-4 text-[#b45309]" />
        <span>Bon Bu Siti Rp 300.000</span>
      </FloatBadge>
      <FloatBadge show={showBadges} className="-left-2 lg:-left-8 bottom-24 z-10" delay="2.2s">
        <AlertTriangle className="h-4 w-4 text-error" />
        <span>Stok beras sisa 2 sak</span>
      </FloatBadge>

      {/* Frame ponsel */}
      <div className="rounded-[2.4rem] bg-[#0b1f1b] p-2.5 shadow-2xl ring-1 ring-white/20">
        <div className="flex h-[520px] flex-col overflow-hidden rounded-[1.9rem] bg-[#efeae2]">
          {/* Header chat */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Zap size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold">Copilot Warung</div>
              <div className="text-[11px] text-white/70">Siap membantu</div>
            </div>
          </div>

          {/* Isi chat */}
          <div className="flex-1 space-y-2.5 overflow-hidden p-3">
            <Bubble from="ai">Halo! Mau catat apa hari ini?</Bubble>
            {stage >= 1 && <Bubble from="user">{HERO_CHAT_TEXT}</Bubble>}
            {stage === 1 && <TypingBubble />}
            {stage === 2 && <ConfirmCard />}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 bg-[#f5f1ea] p-2.5">
            <div className="flex min-h-[44px] flex-1 items-center rounded-2xl bg-white px-4 py-2 text-[13px] leading-snug text-gray-800">
              {stage === 0 ? (
                <span>
                  {HERO_CHAT_TEXT.slice(0, chars)}
                  <span className="wc-blink">|</span>
                </span>
              ) : (
                <span className="text-gray-400">Ketik transaksi...</span>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Send size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ reduced }) {
  return (
    <section
      id="beranda"
      className="relative flex min-h-screen scroll-mt-16 items-center overflow-hidden bg-primary"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-[#0f3d35]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        aria-hidden="true"
        className="wc-float absolute -right-20 -top-24 h-[380px] w-[380px] rounded-full bg-secondary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="wc-float absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-6 pb-16 pt-28 lg:grid-cols-2">
        {/* Kiri: teks */}
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-widest text-white/90">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            Asisten AI untuk Warung dan UMKM
          </div>

          <h1
            aria-label="Catat kas, bon, stok, dan nota cukup ngobrol"
            className="mb-6 font-display text-5xl font-bold leading-[1.08] tracking-[-2px] text-white drop-shadow-lg sm:text-6xl lg:text-[68px]"
          >
            <span aria-hidden="true" className="block">
              Catat{" "}
              <span className="text-secondary">
                <TypedWord words={HERO_WORDS} reduced={reduced} />
              </span>
            </span>
            <span aria-hidden="true" className="block">
              Cukup Ngobrol.
            </span>
          </h1>

          <p className="mb-10 max-w-lg text-[16px] font-normal leading-relaxed text-white/90 sm:text-lg">
            Asisten keuangan dan inventaris AI untuk pemilik warung dan UMKM sembako. Ketik satu
            kalimat biasa, lalu kas, stok, dan piutang tercatat sendiri.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-white px-9 text-[15px] font-bold text-primary shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] sm:w-auto"
            >
              <span>Mulai Gratis Sekarang</span>
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
            <a
              href="#demo"
              className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/5 px-9 text-[15px] font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 sm:w-auto"
            >
              <Play className="h-[16px] w-[16px] text-white/70 transition-colors duration-300 group-hover:text-white" />
              <span>Lihat Demo Singkat</span>
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/80">
            {["Chat sehari-hari", "Foto nota kulakan", "Tagih via WhatsApp"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-secondary" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Kanan: ponsel */}
        <HeroPhone reduced={reduced} />
      </div>
    </section>
  );
}

/* =========================================================
 * 7. STRIP MASALAH
 * ======================================================= */

function ProblemStrip() {
  return (
    <section className="border-b border-outline/20 bg-surface-container-low px-6 py-6">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm leading-relaxed text-on-surface">
          Dagangan terasa laris, tapi uang kas di laci tetap tipis. Itulah{" "}
          <strong className="font-bold">ilusi laba</strong>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Penyebabnya biasanya uang tertahan di stok yang menumpuk, serta bon pelanggan yang hilang
          dari catatan atau sungkan ditagih.
        </p>
      </div>
    </section>
  );
}

/* =========================================================
 * 8. SEBELUM VS SESUDAH
 * ======================================================= */

function BeforeAfter({ reduced }) {
  const { ref, inView } = useInView < HTMLDivElement > (0.2);
  const show = inView || reduced;

  return (
    <section
      id="manfaat"
      className="scroll-mt-16 border-b border-outline/20 bg-surface py-20 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-on-surface sm:text-4xl">
            Meninggalkan Cara Lama
          </h2>
          <p className="mt-4 text-on-surface-variant">
            Dari buku tulis yang rawan hilang ke satu dashboard yang selalu terbarui.
          </p>
        </div>

        <div
          ref={ref}
          className="relative grid grid-cols-1 overflow-hidden rounded-xl border border-outline/30 shadow-xl md:grid-cols-2"
        >
          {/* Kiri: tanpa */}
          <div className="bg-error-container/30 p-8 md:p-10">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wide text-error">
              Tanpa WarungCopilot
            </h3>
            <ul className="space-y-5">
              {BEFORE_ITEMS.map((item, i) => (
                <li
                  key={item}
                  style={{ transitionDelay: reduced ? "0ms" : `${i * 80}ms` }}
                  className={`flex items-start gap-3 text-sm leading-relaxed text-on-surface-variant transition-all duration-500 ease-out ${show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                >
                  <X className="mt-1 h-4 w-4 shrink-0 text-error" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute bottom-0 left-1/2 top-0 z-10 hidden w-px bg-primary/30 md:block" />

          {/* Kanan: dengan */}
          <div className="border-t border-outline/30 bg-primary-container/10 p-8 md:border-t-0 md:p-10">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wide text-primary">
              Dengan WarungCopilot
            </h3>
            <ul className="space-y-5">
              {AFTER_ITEMS.map((item, i) => (
                <li
                  key={item}
                  style={{ transitionDelay: reduced ? "0ms" : `${i * 80 + 320}ms` }}
                  className={`flex items-start gap-3 text-sm font-medium leading-relaxed text-on-surface transition-all duration-500 ease-out ${show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                >
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
 * 9. DEMO WORKSPACE (PERMUKAAN GELAP)
 * ======================================================= */

function DemoWorkspace({ reduced }) {
  const TOTAL = 4;
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (reduced) {
      setStep(TOTAL);
      return;
    }
    let t;
    if (fading) {
      t = setTimeout(() => {
        setStep(0);
        setFading(false);
      }, 700);
    } else if (step < TOTAL) {
      t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 800 : 1500);
    } else {
      t = setTimeout(() => setFading(true), 3200);
    }
    return () => clearTimeout(t);
  }, [step, fading, reduced]);

  const saved = step >= 3;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#102f2a] shadow-2xl">
      {/* Topbar */}
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 bg-[#081a17] px-4 py-3 text-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <span className="border-l border-white/10 pl-3 font-mono text-[11px] text-white/60">
            warung-berkah / copilot
          </span>
        </div>
        <span className="w-fit rounded border border-secondary/40 bg-secondary/15 px-2 py-0.5 text-[11px] text-secondary">
          Data contoh
        </span>
      </div>

      {/* Tiga panel */}
      <div
        className={`grid min-h-[540px] grid-cols-1 transition-opacity duration-700 md:grid-cols-12 ${fading ? "opacity-0" : "opacity-100"
          }`}
      >
        {/* Kiri: navigasi */}
        <div className="hidden border-r border-white/10 bg-[#0d2824] p-4 text-xs md:col-span-3 md:block">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Menu Warung
          </div>
          <div className="space-y-1">
            {SIDEBAR_ITEMS.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md p-2 ${active
                  ? "border border-primary-container/60 bg-primary-container/30 font-medium text-white"
                  : "text-white/60"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-white/10 bg-[#0b2420] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/40">Toko aktif</div>
            <div className="mt-1 text-[13px] font-bold text-white">Warung Berkah</div>
          </div>
        </div>

        {/* Tengah: chat */}
        <div className="flex items-stretch justify-center bg-[#081a17] p-4 md:col-span-6 md:p-6">
          <div className="flex h-[540px] w-full max-w-md flex-col overflow-hidden rounded-xl bg-[#efeae2]">
            <div className="flex items-center gap-3 bg-primary px-4 py-2.5 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Zap size={16} />
              </div>
              <div className="text-sm font-bold leading-tight">Copilot Warung</div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-hidden p-3">
              <Bubble from="ai">Halo! Mau catat apa hari ini?</Bubble>
              {step >= 1 && <Bubble from="user">{HERO_CHAT_TEXT}</Bubble>}
              {step >= 2 && <ConfirmCard saved={saved} />}
              {step >= 4 && (
                <div className="wc-pop max-w-[94%] rounded-2xl rounded-tl-sm border border-black/5 bg-white p-3 text-[12.5px] text-gray-800 shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                    <p className="leading-snug">
                      Stok beras sisa 2 sak. Ingin buat draf pesanan ke Agen Bintang?
                    </p>
                  </div>
                  <div className="mt-2.5 rounded-lg bg-primary px-3 py-2 text-center text-[12px] font-bold text-white">
                    Kirim Pesanan
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kanan: metrik */}
        <div className="border-t border-white/10 bg-[#0d2824] p-4 md:col-span-3 md:border-l md:border-t-0">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Ringkasan Langsung
          </div>
          <div className="space-y-3">
            <MetricCard
              dark
              tone="kas"
              label="Saldo Kas"
              hint={saved ? "+ Rp 600.000 dari penjualan" : undefined}
            >
              <AnimatedNumber
                value={saved ? KAS_AFTER : KAS_BEFORE}
                reduced={reduced}
                format={rupiah}
              />
            </MetricCard>
            <MetricCard
              dark
              tone="piutang"
              label="Piutang Aktif"
              hint={saved ? "+ Rp 300.000 atas nama Bu Siti" : undefined}
            >
              <AnimatedNumber
                value={saved ? PIUTANG_AFTER : PIUTANG_BEFORE}
                reduced={reduced}
                format={rupiah}
              />
            </MetricCard>
            <MetricCard
              dark
              tone="stok"
              label="Stok Kritis"
              hint={saved ? "Beras menyentuh batas minimum" : undefined}
            >
              <AnimatedNumber
                value={saved ? STOK_AFTER : STOK_BEFORE}
                reduced={reduced}
                format={(n) => `${n} item`}
              />
            </MetricCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoSection({ reduced }) {
  return (
    <section id="demo" className="scroll-mt-16 bg-[#0b2420] py-20 text-white md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Lihat Cara Kerjanya
          </span>
          <h2 className="mb-4 mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Satu Kalimat, Tiga Catatan Terbarui
          </h2>
          <p className="text-sm leading-relaxed text-white/60">
            Ini contoh tampilan dengan data fiktif. Saat transaksi disimpan, saldo kas, stok, dan
            piutang langsung berubah bersamaan.
          </p>
        </div>
        <DemoWorkspace reduced={reduced} />
      </div>
    </section>
  );
}

/* =========================================================
 * 10. STEPPER INTERAKTIF
 * ======================================================= */

function HowItWorks({ reduced }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || reduced) return;
    const id = setInterval(() => setActive((p) => (p + 1) % HOW_STEPS.length), 3500);
    return () => clearInterval(id);
  }, [auto, reduced]);

  const select = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  return (
    <section
      id="cara-kerja"
      className="scroll-mt-16 border-b border-outline/20 bg-surface py-20 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Cara Kerja
          </span>
          <h2 className="mb-3 mt-2 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            Tiga Langkah Mencatat
          </h2>
          <p className="text-sm text-on-surface-variant">
            Dari transaksi di meja kasir sampai dashboard terbarui.
          </p>
        </div>

        {/* Tab dan konektor */}
        <div
          role="tablist"
          aria-label="Langkah mencatat"
          className="mx-auto mb-10 flex max-w-3xl items-center justify-between"
        >
          {HOW_STEPS.map((s, i) => (
            <React.Fragment key={s.tab}>
              <button
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => select(i)}
                className={`relative z-10 cursor-pointer whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200 sm:px-5 sm:text-sm ${active === i
                  ? "bg-primary font-bold text-white shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-high/70"
                  }`}
              >
                {s.tab}
              </button>
              {i < HOW_STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-3 transition-colors duration-300 sm:mx-2 sm:w-auto sm:flex-1 ${active > i ? "bg-primary" : "bg-outline/30"
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Panel */}
        <div className="mx-auto min-h-[340px] max-w-3xl">
          <div
            key={active}
            role="tabpanel"
            className="wc-step-enter rounded-xl border border-outline/20 bg-white p-6 shadow-sm md:p-8"
          >
            <h3 className="mb-2 font-display text-xl font-bold text-on-surface">
              {HOW_STEPS[active].title}
            </h3>
            <p className="mb-6 text-xs text-on-surface-variant">{HOW_STEPS[active].desc}</p>

            {active === 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {INPUT_PATHS.map(({ icon: Icon, name, text }) => (
                  <div
                    key={name}
                    className="rounded-lg border border-outline/20 bg-surface-container-low p-4"
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="mb-1 text-sm font-bold text-on-surface">{name}</div>
                    <p className="text-[12px] leading-relaxed text-on-surface-variant">{text}</p>
                  </div>
                ))}
              </div>
            )}

            {active === 1 && (
              <div className="mx-auto max-w-sm rounded-xl bg-[#efeae2] p-4">
                <ConfirmCard />
              </div>
            )}

            {active === 2 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard tone="kas" label="Saldo Kas" hint="+ Rp 600.000 dari penjualan">
                  {rupiah(KAS_AFTER)}
                </MetricCard>
                <MetricCard tone="piutang" label="Piutang Aktif" hint="+ Rp 300.000 Bu Siti">
                  {rupiah(PIUTANG_AFTER)}
                </MetricCard>
                <MetricCard tone="stok" label="Stok Kritis" hint="Beras menyentuh batas minimum">
                  {STOK_AFTER} item
                </MetricCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
 * 11. PANEL FITUR AI INTERAKTIF
 * ======================================================= */

function FeatureExplorer() {
  const [activeId, setActiveId] = useState(FEATURES[0].id);
  const active = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  return (
    <section
      id="fitur"
      className="scroll-mt-16 border-b border-outline/20 bg-surface-container-low py-20 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Fitur AI Copilot
          </span>
          <h2 className="mb-4 mt-2 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            Satu Asisten untuk Kas, Stok, dan Bon
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Pilih salah satu fitur untuk melihat alurnya dan contoh pemakaian di warung.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Kiri: daftar */}
          <div className="space-y-1 rounded-xl border border-outline/20 bg-surface p-2 shadow-sm lg:col-span-4">
            {FEATURES.map((f) => {
              const isActive = f.id === activeId;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(f.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-r-md border-l-[3px] px-4 py-3 text-left transition-all duration-150 ${isActive
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-transparent bg-transparent text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                  <span className="block">
                    <span className={`block text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                      {f.name}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant">{f.short}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Kanan: detail */}
          <div
            key={active.id}
            className="wc-step-enter overflow-hidden rounded-xl border border-outline/20 bg-surface p-6 shadow-sm sm:p-8 lg:col-span-8"
          >
            <h3 className="mb-2 font-display text-[28px] font-bold leading-tight text-on-surface">
              {active.name}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
              {active.description}
            </p>

            <div className="mb-6">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Alur Singkat
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1">
                {active.steps.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="shrink-0 whitespace-nowrap rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-on-surface">
                      <span className="mr-1.5 font-bold text-primary">{i + 1}.</span>
                      {s}
                    </div>
                    {i < active.steps.length - 1 && (
                      <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-outline/20 bg-surface-container-low p-4">
              <span className="mb-1 block text-xs font-bold text-primary">Contoh di Warung</span>
              <p className="text-xs leading-relaxed text-on-surface-variant">{active.example}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
 * 12. CTA PENUTUP
 * ======================================================= */

function ClosingCta() {
  return (
    <section
      id="mulai"
      className="relative scroll-mt-16 overflow-hidden bg-primary py-16 md:py-20"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f3d35] via-primary to-primary-container" />
      <div
        aria-hidden="true"
        className="wc-float absolute -left-16 top-0 h-[300px] w-[300px] rounded-full bg-secondary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="wc-float absolute -right-16 bottom-0 h-[320px] w-[320px] rounded-full bg-white/10 blur-3xl"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h2 className="mb-6 font-display text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl">
          Pemilik warung tidak punya waktu menghitung di tengah antrean.
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-white/90 sm:text-xl">
          WarungCopilot mencatat kas, stok, dan bon dari satu kalimat, jadi kamu bisa fokus
          melayani pembeli.
        </p>

        <div className="mb-6 flex justify-center">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-10 py-4 text-[15px] font-bold text-primary shadow-[0_8px_30px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
          >
            Mulai Gratis Sekarang
            <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>

        <p className="text-sm text-white/80">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-white underline underline-offset-4">
            Masuk
          </Link>
        </p>
      </div>
    </section>
  );
}

/* =========================================================
 * 13. FOOTER
 * ======================================================= */

function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#08191a] pb-8 pt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <Store className="h-6 w-6 text-white" strokeWidth={1.75} />
              </span>
              <span className="font-display text-3xl font-bold tracking-tight text-white">
                WarungCopilot
              </span>
            </Link>
            <p className="max-w-sm text-[14px] leading-relaxed text-gray-400">
              Asisten keuangan dan inventaris berbasis AI untuk pemilik warung dan UMKM. Catat kas,
              stok, dan bon cukup lewat obrolan.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-[13px] font-semibold uppercase tracking-widest text-white">
              Jelajahi
            </h4>
            <ul className="space-y-4">
              <li>
                <a href="#demo" className="text-[14px] text-gray-400 transition-colors hover:text-white">
                  Demo Singkat
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="text-[14px] text-gray-400 transition-colors hover:text-white">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#fitur" className="text-[14px] text-gray-400 transition-colors hover:text-white">
                  Fitur AI
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[13px] font-semibold uppercase tracking-widest text-white">
              Akun
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/login" className="text-[14px] text-gray-400 transition-colors hover:text-white">
                  Masuk
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-[14px] text-gray-400 transition-colors hover:text-white">
                  Daftar UMKM
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-[13px] text-gray-500">
            © {new Date().getFullYear()} WarungCopilot. Hak Cipta Dilindungi.
          </p>
          <p className="text-[13px] text-gray-500">Solusi pembukuan dan inventaris untuk UMKM Indonesia</p>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
 * 14. HALAMAN UTAMA
 * ======================================================= */

export default function LandingPage() {
  const reduced = usePrefersReducedMotion();
  const activeId = useActiveSection(SECTION_IDS);

  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let seen = false;
    if (SHOW_SPLASH_ONCE_PER_SESSION) {
      try {
        seen = sessionStorage.getItem("wc_splash_seen") === "1";
      } catch {
        seen = false;
      }
    }

    if (prefersReduced || seen) {
      setShowSplash(false);
      setMainVisible(true);
      return;
    }

    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
      setMainVisible(true);
      if (SHOW_SPLASH_ONCE_PER_SESSION) {
        try {
          sessionStorage.setItem("wc_splash_seen", "1");
        } catch {
          /* abaikan */
        }
      }
    }, SPLASH_MS);
    const hideTimer = setTimeout(() => setShowSplash(false), SPLASH_MS + 400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-surface font-sans text-on-surface antialiased">
      <style>{PAGE_CSS}</style>

      {showSplash && <Splash fading={splashFading} />}

      <div
        className={`flex flex-1 flex-col transition-opacity duration-500 ${mainVisible ? "opacity-100" : "opacity-0"
          }`}
      >
        <Navbar visible={mainVisible} activeId={activeId} />

        <main className="flex-1">
          <Hero reduced={reduced} />
          <ProblemStrip />
          <BeforeAfter reduced={reduced} />
          <DemoSection reduced={reduced} />
          <HowItWorks reduced={reduced} />
          <FeatureExplorer />
          <ClosingCta />
        </main>

        <Footer />
      </div>
    </div>
  );
}