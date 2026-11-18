import { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { useI18n } from '../lib/i18n';
import { ModalPortal, useBodyScrollLock } from './ModalPortal';

export function PWAInstallCard() {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useBodyScrollLock(showIOSGuide);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowIOSGuide(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <section className="glass-surface rounded-2xl border border-pulse/35 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pulse/15 text-pulse">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-[#F4F5F7]">
              {t('Pasang di HP Android', 'Install on Android')}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
              {t(
                'Instal IronPulse ke layar utama agar terbuka layar penuh seperti aplikasi asli.',
                'Install IronPulse to your home screen for a full-screen app experience.'
              )}
            </p>
            <button
              type="button"
              onClick={install}
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-pulse px-4 py-2 text-xs font-bold text-pulse-fg hover:brightness-105"
            >
              <Download className="h-4 w-4" />
              {t('Instal Aplikasi IronPulse', 'Install IronPulse App')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (isIOS) {
    return (
      <>
        <section className="glass-surface rounded-2xl border border-white/12 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#F4F5F7]">
                {t('Pasang di iPhone / iPad', 'Install on iPhone / iPad')}
              </h3>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {t(
                  'Tambahkan ke Home Screen untuk tampilan penuh tanpa bar Safari.',
                  'Add to Home Screen for a full-screen view without Safari bars.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="min-h-[40px] rounded-xl border border-pulse/40 bg-pulse/10 px-3.5 py-2 text-xs font-bold text-pulse whitespace-nowrap shrink-0"
            >
              {t('Cara Pasang', 'How to Install')}
            </button>
          </div>
        </section>

        {showIOSGuide && (
          <ModalPortal>
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setShowIOSGuide(false)}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="glass-surface max-h-[min(88dvh,calc(100dvh-2rem))] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-white/15 p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-[#F4F5F7]">
                    {t('Pasang di iPhone / iPad', 'Install on iPhone / iPad')}
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
                  <li>
                    {t(
                      '1. Ketuk tombol Share (ikon kotak dengan panah ke atas) di toolbar Safari.',
                      '1. Tap the Share icon (square with an upward arrow) in Safari toolbar.'
                    )}
                  </li>
                  <li>
                    {t(
                      '2. Gulir ke bawah dan pilih Add to Home Screen.',
                      '2. Scroll down and select Add to Home Screen.'
                    )}
                  </li>
                  <li>
                    {t(
                      '3. Ketuk Add di pojok kanan atas.',
                      '3. Tap Add in the top-right corner.'
                    )}
                  </li>
                </ol>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-5 min-h-[44px] w-full rounded-xl bg-pulse text-xs font-bold text-pulse-fg"
                >
                  {t('Mengerti', 'Got It')}
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const { t } = useI18n();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-xl border border-[#D97706]/50 bg-[#1A1E26] px-3.5 py-2 text-xs font-semibold text-[#FCD34D] md:bottom-4"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        {t(
          'Mode Offline — Data tersimpan di cache perangkat',
          'Offline Mode — Data saved in device cache'
        )}
      </span>
    </div>
  );
}
