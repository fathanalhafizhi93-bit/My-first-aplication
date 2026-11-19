import { useEffect } from 'react';
import { Check, Clock, ShieldAlert, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../lib/i18n';
import { ModalPortal, useBodyScrollLock } from './ModalPortal';

interface CooldownAlertModalProps {
  open: boolean;
  cooldownRemaining: number;
  exerciseName: string;
  setNumber: number;
  onBypass: () => Promise<void>;
  onDismiss: () => void;
}

export function CooldownAlertModal({
  open,
  cooldownRemaining,
  exerciseName,
  setNumber,
  onBypass,
  onDismiss,
}: CooldownAlertModalProps) {
  const { t, uiTheme } = useI18n();
  const isMaterialYou = uiTheme === 'material-you';

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onDismiss]);

  const progressRatio = Math.max(0, Math.min(1, cooldownRemaining / 30));
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cooldown-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onDismiss}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`glass-surface relative max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-md overflow-y-auto overscroll-contain border border-[#F59E0B]/45 p-6 shadow-2xl sm:p-7 ${
                isMaterialYou ? 'rounded-[28px]' : 'rounded-2xl'
              }`}
              style={
                isMaterialYou
                  ? { backgroundColor: 'var(--md-sys-color-surface-container-high)' }
                  : undefined
              }
            >
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t('Tutup peringatan cooldown', 'Close cooldown alert')}
              className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center border transition-colors ${
                isMaterialYou
                  ? 'rounded-full border-md-outline-variant bg-md-surface-highest text-md-on-surface-variant hover:text-md-on-surface'
                  : 'rounded-xl border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FBBF24]">
                <ShieldAlert className="h-4 w-4" />
                <span>{t('Pengaman Salah Klik · 30 Detik', 'Anti-Misclick Guard · 30s')}</span>
              </div>

              {/* Large Live Tabular Countdown Ring */}
              <div className="relative mt-5 flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute flex items-baseline gap-0.5 font-mono font-extrabold tabular-nums">
                  <span className="text-5xl text-pulse">{cooldownRemaining}</span>
                  <span className="text-base text-[#9CA3AF]">{t('d', 's')}</span>
                </div>
              </div>

              <h2
                id="cooldown-modal-title"
                className="mt-4 font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7]"
                style={{ textWrap: 'balance' }}
              >
                {t('Cegah Salah Klik Set!', 'Hold On — Avoid Misclicks!')}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#D1D5DB]">
                {t(
                  `Jeda 30 detik mencegah klik ganda atau ketukan tidak sengaja pada "${exerciseName}" Set #${setNumber}. Untuk waktu istirahat otot, gunakan Timer Istirahat yang tersedia.`,
                  `This 30s guard prevents accidental taps on "${exerciseName}" Set #${setNumber}. Use the Rest Timer to track your between-set recovery.`
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 border px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  isMaterialYou
                    ? 'rounded-full border-md-outline-variant bg-md-surface-highest text-md-on-surface hover:brightness-110'
                    : 'rounded-xl border-white/15 bg-[#1A1E26] text-[#F4F5F7] hover:bg-[#232935]'
                }`}
              >
                <Clock className="h-4 w-4 text-[#38BDF8]" />
                {t('Tutup', 'Dismiss')}
              </button>

              <button
                type="button"
                onClick={() => {
                  void onBypass();
                }}
                className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 bg-pulse px-4 py-2.5 text-xs font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98] whitespace-nowrap ${
                  isMaterialYou ? 'rounded-full' : 'rounded-xl'
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
                {t('Tetap Centang (Lewati)', 'Confirm Anyway')}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
