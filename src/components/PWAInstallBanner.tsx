import { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallCard() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <section className="rounded-2xl border border-[#C8FF2E]/35 bg-[#13161C] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8FF2E]/15 text-[#C8FF2E]">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-[#F4F5F7]">
              Pasang di HP Android
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
              Instal IronPulse ke layar utama agar terbuka layar penuh seperti aplikasi asli.
            </p>
            <button
              type="button"
              onClick={install}
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-4 py-2 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
            >
              <Download className="h-4 w-4" />
              Instal Aplikasi IronPulse
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (isIOS) {
    return (
      <>
        <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#F4F5F7]">
                Pasang di iPhone / iPad
              </h3>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Tambahkan ke Home Screen untuk tampilan penuh tanpa bar Safari.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="min-h-[40px] rounded-xl border border-[#C8FF2E]/40 bg-[#C8FF2E]/10 px-3.5 py-2 text-xs font-bold text-[#C8FF2E] whitespace-nowrap shrink-0"
            >
              Cara Pasang
            </button>
          </div>
        </section>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#13161C] p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-[#F4F5F7]">
                  Pasang di iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-2 text-sm text-[#D1D5DB]">
                <li>1. Ketuk tombol Share (ikon kotak dengan panah ke atas) di toolbar Safari.</li>
                <li>2. Gulir ke bawah dan pilih Add to Home Screen.</li>
                <li>3. Ketuk Add di pojok kanan atas.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-[#C8FF2E] text-xs font-bold text-[#0A0B0E]"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl border border-[#D97706]/50 bg-[#1A1E26] px-3.5 py-2 text-xs font-semibold text-[#FCD34D] md:bottom-4"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Mode Offline — Data tersimpan di cache perangkat</span>
    </div>
  );
}
