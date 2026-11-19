import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { haptics } from '../lib/haptics';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';

interface LaunchIntroProps {
  timePhase: DayTimePhase;
  onComplete: () => void;
}

const SPLASH_DURATION_MS = 1450;

export function LaunchIntro({ timePhase, onComplete }: LaunchIntroProps) {
  const { lang, clockFormat, performance, t } = useI18n();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const onCompleteRef = useRef(onComplete);
  const timerRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const dismiss = useCallback((fromUser = false) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fromUser) {
      haptics.buttonTap();
    }
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || performance.noAnimations) {
      dismiss(false);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      dismiss(false);
    }, SPLASH_DURATION_MS);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        dismiss(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismiss]);

  const now = new Date();
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const dayDateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(now);
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: clockFormat === '12h',
  }).format(now);

  return (
    <motion.div
      key="launch-intro"
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => dismiss(true)}
      role="button"
      tabIndex={0}
      data-haptic="none"
      aria-label={t(
        'Ketuk layar untuk melewati layar pembuka',
        'Tap anywhere to skip intro screen'
      )}
      className="fixed inset-0 z-[110] flex cursor-pointer flex-col justify-between bg-[var(--ip-canvas-bg)] px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] select-none focus:outline-none sm:px-10"
    >
      {/* Top Hairline Orientation Strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex w-full max-w-4xl items-center justify-between border-b border-white/10 pb-3.5 text-xs text-md-on-surface-variant"
      >
        <span className="font-mono font-medium tabular-nums">
          {dayDateLabel} · {timeLabel}
        </span>
        <span className={`font-medium ${phaseToken.labelClass}`}>
          {timePhase === 'morning'
            ? t('Pagi', 'Morning')
            : timePhase === 'afternoon'
              ? t('Siang / Sore', 'Afternoon')
              : t('Malam', 'Night')}
        </span>
      </motion.div>

      {/* Center Editorial Athletic Lockup (Swiss Poster Cut, Zero Neon Glow/Capsule Cliché) */}
      <div className="mx-auto w-full max-w-4xl py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-5"
        >
          {/* Crisp Geometric "F" Mark — Flat Precision Vector, Zero Box Frame or Blur Filter */}
          <svg
            viewBox="0 0 88 96"
            className="h-14 w-12 shrink-0 sm:h-16 sm:w-14"
            fill="none"
            role="img"
            aria-label="IronPulse F Mark"
          >
            <path
              d="M8 10C8 6.686 10.686 4 14 4H80L70 22H28V92H8V10Z"
              className="fill-md-on-surface"
            />
            <path
              d="M28 42H68L59 58H28V42Z"
              className="fill-pulse"
            />
          </svg>

          <div className="min-w-0">
            <h1 className="font-display text-[3.5rem] font-extrabold leading-[0.88] tracking-[-0.03em] text-md-on-surface sm:text-[5rem]">
              Iron<span className="text-pulse">Pulse</span>
            </h1>
            <p className="mt-2.5 text-sm font-medium text-md-on-surface-variant sm:text-base">
              {t(
                'Jadwal latihan, alarm harian, dan pelacak set.',
                'Training schedule, daily alarm, and set tracker.'
              )}
            </p>
          </div>
        </motion.div>

        {/* Single Sharp Structural Accent Rule */}
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.42, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 h-[3px] w-full origin-left bg-gradient-to-r from-pulse via-pulse/60 to-transparent"
        />
      </div>

      {/* Bottom Quiet Action Affordance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.78 }}
        transition={{ duration: 0.28, delay: 0.14 }}
        className="mx-auto flex w-full max-w-4xl items-center justify-between text-xs text-md-on-surface-variant"
      >
        <span>{t('Ketuk di mana saja untuk masuk', 'Tap anywhere to continue')}</span>
        <span className="font-mono tabular-nums">1.4s</span>
      </motion.div>
    </motion.div>
  );
}
