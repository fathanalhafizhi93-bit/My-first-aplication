import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  Timer,
  X,
} from 'lucide-react';
import { formatRestDuration } from '../lib/dateUtils';
import { useI18n } from '../lib/i18n';
import { haptics } from '../lib/haptics';
import { ModalPortal } from './ModalPortal';

interface WorkoutFloatingRestBarProps {
  visible: boolean;
  restTotalSeconds: number;
  restRemaining: number;
  restRunning: boolean;
  restExerciseLabel: string | null;
  onToggleRestPause: () => void;
  onAdjustRest: (deltaSeconds: number) => void;
  onResetRest: () => void;
  onStartRestTimer: (seconds: number, exerciseName?: string) => void;
  onDismiss: () => void;
}

const RING_SIZE = 38;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function WorkoutFloatingRestBar({
  visible,
  restTotalSeconds,
  restRemaining,
  restRunning,
  restExerciseLabel,
  onToggleRestPause,
  onAdjustRest,
  onResetRest,
  onStartRestTimer,
  onDismiss,
}: WorkoutFloatingRestBarProps) {
  const { t, uiTheme } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const [presetsOpen, setPresetsOpen] = useState(false);

  const isMaterialYou = uiTheme === 'material-you';
  const isFrosted = uiTheme === 'midnight-frosted';
  const isYaru = uiTheme === 'ubuntu-yaru';
  const secUnit = t('d', 's');

  useEffect(() => {
    if (!visible) {
      setPresetsOpen(false);
    }
  }, [visible]);

  const safeTotal = Math.max(1, restTotalSeconds);
  const ratio = Math.max(0, Math.min(1, restRemaining / safeTotal));
  const dashOffset = RING_CIRCUMFERENCE * (1 - ratio);
  const isFinished = restRemaining === 0;

  return (
    <ModalPortal>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="workout-floating-rest-bar"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed left-3 right-[5.25rem] z-40 md:bottom-6 md:left-1/2 md:right-auto md:w-[468px] md:-translate-x-1/2 ${
              isFrosted
                ? 'bottom-[calc(5.45rem+env(safe-area-inset-bottom))]'
                : 'bottom-[calc(4.9rem+env(safe-area-inset-bottom))]'
            }`}
          >
            {/* Expandable Quick Adjustment & Preset Shelf */}
            <AnimatePresence>
              {presetsOpen && (
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className={`mb-2 space-y-2 border p-2.5 ${
                    isYaru
                      ? 'rounded-xl border-white/12 bg-[#2C2C2C] shadow-[0_4px_14px_rgba(0,0,0,0.4)]'
                      : isMaterialYou
                        ? 'rounded-2xl border-md-outline-variant bg-md-surface-highest/98 shadow-[0_16px_36px_rgba(0,0,0,0.5)]'
                        : 'glass-surface rounded-2xl border-white/15 bg-[#121620]/96 shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl'
                  }`}
                >
                  {/* Row 1: Fine Adjust (-15 / +15), Reset & Dismiss */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      aria-label={t('Kurangi 15 detik', 'Subtract 15 seconds')}
                      onClick={() => onAdjustRest(-15)}
                      className={`min-h-[40px] rounded-xl border font-mono text-xs font-bold tabular-nums transition-colors active:scale-95 ${
                        isMaterialYou
                          ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface hover:border-pulse'
                          : 'border-white/10 bg-[#0A0B0E]/85 text-[#E5E7EB] hover:border-pulse'
                      }`}
                    >
                      -15{secUnit}
                    </button>

                    <button
                      type="button"
                      aria-label={t('Tambah 15 detik', 'Add 15 seconds')}
                      onClick={() => onAdjustRest(15)}
                      className={`min-h-[40px] rounded-xl border font-mono text-xs font-bold tabular-nums transition-colors active:scale-95 ${
                        isMaterialYou
                          ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface hover:border-pulse'
                          : 'border-white/10 bg-[#0A0B0E]/85 text-[#E5E7EB] hover:border-pulse'
                      }`}
                    >
                      +15{secUnit}
                    </button>

                    <button
                      type="button"
                      aria-label={t('Reset timer istirahat', 'Reset rest timer')}
                      onClick={() => {
                        onResetRest();
                        setPresetsOpen(false);
                      }}
                      className={`inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl border text-xs font-bold transition-colors active:scale-95 ${
                        isMaterialYou
                          ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface-variant hover:text-md-on-surface'
                          : 'border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]'
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      aria-label={t('Tutup bar istirahat', 'Close rest bar')}
                      onClick={() => {
                        haptics.toggle();
                        setPresetsOpen(false);
                        onDismiss();
                      }}
                      className={`inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl border text-xs font-bold transition-colors active:scale-95 ${
                        isMaterialYou
                          ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface-variant hover:text-md-on-surface'
                          : 'border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{t('Tutup', 'Hide')}</span>
                    </button>
                  </div>

                  {/* Row 2: One-Tap Rest Duration Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[45, 60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          onStartRestTimer(sec, restExerciseLabel || undefined);
                          setPresetsOpen(false);
                        }}
                        className={`min-h-[38px] rounded-xl border font-mono text-xs font-bold tabular-nums transition-colors active:scale-95 ${
                          restTotalSeconds === sec
                            ? 'border-pulse/60 bg-pulse/15 text-pulse'
                            : isMaterialYou
                              ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface hover:border-pulse hover:text-pulse'
                              : 'border-white/10 bg-[#0A0B0E]/85 text-[#D1D5DB] hover:border-pulse hover:text-pulse'
                        }`}
                      >
                        {sec}
                        {secUnit}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compact Main Floating Rest Capsule — Guaranteed Non-Overlapping Layout */}
            <div
              className={`flex items-center justify-between gap-2.5 border px-3 py-2 transition-colors ${
                isYaru
                  ? isFinished
                    ? 'rounded-xl border-[#16A34A]/65 bg-[#173021] shadow-[0_4px_14px_rgba(0,0,0,0.4)]'
                    : restRunning
                      ? 'rounded-xl border-pulse/60 bg-[#2C2C2C] shadow-[0_4px_14px_rgba(0,0,0,0.4)]'
                      : 'rounded-xl border-white/12 bg-[#2C2C2C] shadow-[0_4px_14px_rgba(0,0,0,0.4)]'
                  : `rounded-[22px] shadow-[0_18px_42px_rgba(0,0,0,0.54)] ${
                      isFinished
                        ? 'border-[#16A34A]/65 bg-[#0F1F16]/96'
                        : isMaterialYou
                          ? restRunning
                            ? 'border-pulse/55 bg-md-surface-high/98'
                            : 'border-md-outline-variant bg-md-surface-high/98'
                          : restRunning
                            ? 'glass-surface border-pulse/55 bg-[#121620]/96 backdrop-blur-xl'
                            : 'glass-surface border-white/15 bg-[#121620]/96 backdrop-blur-xl'
                    }`
              }`}
            >
              {/* Left: Clickable Progress Ring + Crisp Non-Overlapping Digits */}
              <button
                type="button"
                onClick={() => {
                  haptics.toggle();
                  setPresetsOpen((prev) => !prev);
                }}
                aria-label={t('Buka opsi timer istirahat', 'Toggle rest timer options')}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus:outline-none"
              >
                <div className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center">
                  <svg
                    width={RING_SIZE}
                    height={RING_SIZE}
                    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                    className="-rotate-90"
                    aria-hidden="true"
                  >
                    <circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth={RING_STROKE}
                    />
                    <circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      fill="none"
                      stroke={isFinished ? '#4ADE80' : 'var(--md-sys-color-primary, #FF6B2B)'}
                      strokeWidth={RING_STROKE}
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      className="transition-[stroke-dashoffset] duration-300 ease-out"
                    />
                  </svg>
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    {isFinished ? (
                      <Check className="h-4 w-4 text-[#4ADE80]" strokeWidth={2.7} />
                    ) : (
                      <Timer
                        className={`h-3.5 w-3.5 ${restRunning ? 'text-pulse' : 'text-[#9CA3AF]'}`}
                      />
                    )}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`block font-mono text-lg sm:text-xl font-extrabold leading-none tracking-tight tabular-nums whitespace-nowrap ${
                      isFinished ? 'text-[#4ADE80]' : 'text-[#F4F5F7]'
                    }`}
                  >
                    {formatRestDuration(restRemaining)}
                  </span>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[#9CA3AF]">
                    {isFinished
                      ? t('Istirahat selesai!', 'Rest done!')
                      : restExerciseLabel || t('Timer Istirahat', 'Rest Timer')}
                  </p>
                </div>
              </button>

              {/* Right: Cleanly Separated Controls (2 crisp buttons on mobile, full controls on sm+) */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label={t('Kurangi 15 detik', 'Subtract 15 seconds')}
                  onClick={() => onAdjustRest(-15)}
                  className={`hidden sm:inline-flex min-h-[40px] items-center justify-center rounded-full border px-2.5 font-mono text-[11px] font-bold tabular-nums transition-colors active:scale-95 whitespace-nowrap ${
                    isMaterialYou
                      ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface hover:border-pulse'
                      : 'border-white/12 bg-white/[0.06] text-[#D1D5DB] hover:bg-white/10'
                  }`}
                >
                  -15{secUnit}
                </button>

                <button
                  type="button"
                  aria-label={
                    restRunning
                      ? t('Jeda istirahat', 'Pause rest')
                      : isFinished
                        ? t('Ulangi istirahat', 'Restart rest')
                        : t('Lanjutkan istirahat', 'Resume rest')
                  }
                  onClick={onToggleRestPause}
                  className={`inline-flex h-10 w-10 sm:w-auto sm:min-h-[40px] sm:px-3.5 items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-transform active:scale-95 whitespace-nowrap ${
                    isFinished
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-pulse text-pulse-fg shadow-[0_0_14px_rgba(var(--ip-accent-rgb),0.3)]'
                  }`}
                >
                  {restRunning ? (
                    <>
                      <Pause className="h-4 w-4 sm:h-3.5 sm:w-3.5 fill-current" />
                      <span className="hidden sm:inline">{t('Jeda', 'Pause')}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 sm:h-3.5 sm:w-3.5 fill-current" />
                      <span className="hidden sm:inline">
                        {isFinished ? t('Ulangi', 'Restart') : t('Lanjut', 'Go')}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  aria-label={t('Tambah 15 detik', 'Add 15 seconds')}
                  onClick={() => onAdjustRest(15)}
                  className={`hidden sm:inline-flex min-h-[40px] items-center justify-center rounded-full border px-2.5 font-mono text-[11px] font-bold tabular-nums transition-colors active:scale-95 whitespace-nowrap ${
                    isMaterialYou
                      ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface hover:border-pulse'
                      : 'border-white/12 bg-white/[0.06] text-[#D1D5DB] hover:bg-white/10'
                  }`}
                >
                  +15{secUnit}
                </button>

                {isFinished ? (
                  <button
                    type="button"
                    aria-label={t('Tutup dan reset timer istirahat', 'Dismiss and reset rest timer')}
                    onClick={() => {
                      haptics.toggle();
                      setPresetsOpen(false);
                      onResetRest();
                      onDismiss();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#4ADE80]/35 bg-[#16A34A]/20 text-[#86EFAC] transition-colors hover:bg-[#16A34A]/30 active:scale-95"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={t('Opsi preset istirahat', 'Toggle rest presets')}
                    aria-expanded={presetsOpen}
                    onClick={() => {
                      haptics.toggle();
                      setPresetsOpen((prev) => !prev);
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                      presetsOpen
                        ? 'border-pulse/50 bg-pulse/15 text-pulse'
                        : isMaterialYou
                          ? 'border-md-outline-variant bg-md-surface-container text-md-on-surface-variant hover:text-md-on-surface'
                          : 'border-white/12 bg-white/[0.06] text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {presetsOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
