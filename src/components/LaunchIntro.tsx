import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { haptics } from '../lib/haptics';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';

interface LaunchIntroProps {
  timePhase: DayTimePhase;
  onComplete: () => void;
}

const SPLASH_DURATION_MS = 5000;

export function LaunchIntro({ timePhase, onComplete }: LaunchIntroProps) {
  const { t } = useI18n();
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

    if (prefersReduced) {
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

  return (
    <motion.div
      key="launch-intro"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -24,
        scale: 1.025,
        filter: 'blur(14px)',
      }}
      transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => dismiss(true)}
      role="button"
      tabIndex={0}
      data-haptic="none"
      aria-label={t(
        'Ketuk layar untuk melewati layar pembuka',
        'Tap anywhere to skip intro screen'
      )}
      className="fixed inset-0 z-[110] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#07080B]/94 px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl select-none focus:outline-none"
    >
      {/* Phase-synced atmospheric radial backdrop */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: phaseToken.ambientGlow }}
      />

      {/* Soft ambient vignette synced to dynamic accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 45%, rgba(var(--ip-accent-rgb), 0.16) 0%, rgba(7, 8, 11, 0.28) 46%, rgba(7, 8, 11, 0.82) 100%)',
        }}
      />

      {/* Centerpiece */}
      <div className="relative flex flex-col items-center text-center">
        {/* Soft breathing emblem halo & delicate concentric rings */}
        <div className="relative flex items-center justify-center">
          {/* Diffused breathing ambient glow behind monogram */}
          <motion.div
            aria-hidden="true"
            initial={{ scale: 0.78, opacity: 0 }}
            animate={{
              scale: [0.88, 1.15, 0.96, 1.11, 0.98],
              opacity: [0.2, 0.45, 0.28, 0.4, 0.3],
            }}
            transition={{
              duration: 5,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute h-56 w-56 rounded-full blur-3xl sm:h-64 sm:w-64"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(var(--ip-accent-rgb), 0.56) 0%, rgba(var(--ip-accent-rgb), 0.16) 54%, transparent 76%)',
            }}
          />

          {/* Outer hairline breathing ring */}
          <motion.div
            aria-hidden="true"
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{
              scale: [0.95, 1.18, 1.04, 1.16, 1.08],
              opacity: [0, 0.26, 0.14, 0.22, 0.12],
            }}
            transition={{
              duration: 4.9,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute h-44 w-44 rounded-full border sm:h-48 sm:w-48"
            style={{ borderColor: 'rgba(var(--ip-accent-rgb), 0.45)' }}
          />

          {/* Inner subtle pulse ring */}
          <motion.div
            aria-hidden="true"
            initial={{ scale: 0.72, opacity: 0.4 }}
            animate={{ scale: 1.48, opacity: 0 }}
            transition={{ duration: 2.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute h-40 w-40 rounded-full border border-white/20"
          />

          {/* Frosted Precision Capsule containing the Geometric Monogram "F" */}
          <motion.div
            initial={{ scale: 0.84, opacity: 0, y: 14 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="glass-surface relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[28px] border border-white/18 p-3.5 shadow-[0_20px_54px_rgba(0,0,0,0.6),0_0_36px_rgba(var(--ip-accent-rgb),0.22)] sm:h-36 sm:w-36"
            style={{
              backgroundImage:
                'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(16,19,27,0.88) 46%, rgba(8,10,15,0.96) 100%)',
            }}
          >
            {/* Subtle inner top edge highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />

            {/* Geometric Modern SVG Monogram "F" */}
            <svg
              viewBox="0 0 120 120"
              className="relative z-10 h-full w-full"
              fill="none"
              role="img"
              aria-label="F Monogram Logo"
            >
              <defs>
                {/* Brushed Platinum / Silver-White Gradient for Primary F Structure */}
                <linearGradient id="ip-f-metal" x1="28" y1="18" x2="94" y2="104" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="48%" stopColor="#E6EBF2" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>

                {/* Crisp Edge Highlight */}
                <linearGradient id="ip-f-edge" x1="30" y1="20" x2="86" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
                </linearGradient>

                {/* Dynamic Accent Glow Filter */}
                <filter id="ip-f-accent-glow" x="-30%" y="-60%" width="160%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Architectural Corner Framing Ticks */}
              <motion.g
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                style={{ originX: '60px', originY: '60px' }}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.4"
                strokeLinecap="round"
              >
                <path d="M14 26V14H26" />
                <path d="M94 14H106V26" />
                <path d="M106 94V106H94" />
                <path d="M26 106H14V94" />
              </motion.g>

              {/* Subtle Geometric Axis Hairline */}
              <motion.path
                d="M28 100L92 20"
                stroke="rgba(var(--ip-accent-rgb), 0.18)"
                strokeWidth="1"
                strokeDasharray="3 5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.45 }}
              />

              {/* Geometric F: Vertical Precision Spine + Chamfered Top Arm */}
              <motion.path
                d="M34 26C34 23.8 35.8 22 38 22H90L82.5 34.5H48.5V98L34 90.5V26Z"
                fill="url(#ip-f-metal)"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.72, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Precision Metallic Bevel Highlight Along Spine & Top Arm */}
              <motion.path
                d="M35.2 26C35.2 24.5 36.4 23.2 38 23.2H87.8L81.8 33.2H47.3V96"
                stroke="url(#ip-f-edge)"
                strokeWidth="1.15"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{ duration: 1.05, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Subtle Vertical Architectural Groove Inside Spine */}
              <motion.path
                d="M41.2 34V86"
                stroke="rgba(7, 10, 16, 0.34)"
                strokeWidth="1.35"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Dynamic Accent Glowing Middle Crossbar of "F" */}
              <motion.g
                filter="url(#ip-f-accent-glow)"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.68, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <path
                  d="M48.5 53.5H81.5L74.5 65.5H48.5V53.5Z"
                  fill="var(--md-sys-color-primary, #FF6B2B)"
                />
                {/* Crisp white-hot core highlight inside accent bar */}
                <path
                  d="M51 56.5H76.5"
                  stroke="#FFFFFF"
                  strokeOpacity="0.58"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </motion.g>

              {/* Breathing Accent Pulse Node at Top-Right Precision Notch */}
              <motion.path
                d="M89.5 34.5L95 25.5L98.5 34.5H89.5Z"
                fill="var(--md-sys-color-primary, #FF6B2B)"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: [0.65, 1, 0.72, 1],
                  scale: [0.95, 1.08, 0.98, 1.04],
                }}
                transition={{
                  duration: 3.4,
                  delay: 0.55,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ originX: '94px', originY: '31px' }}
              />
            </svg>

            {/* Single refined diagonal light sheen across the emblem glass */}
            <motion.div
              aria-hidden="true"
              initial={{ x: '-145%', opacity: 0 }}
              animate={{ x: '165%', opacity: [0, 0.55, 0] }}
              transition={{
                duration: 1.55,
                delay: 0.95,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 -skew-x-12"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
              }}
            />
          </motion.div>
        </div>

        {/* Dual-Tone Precision Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.82, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-display text-5xl font-extrabold tracking-[-0.03em] sm:text-6xl"
        >
          <span className="bg-gradient-to-b from-white via-[#F4F5F7] to-[#CBD5E1] bg-clip-text text-transparent">
            Iron
          </span>
          <span
            className="text-pulse"
            style={{
              textShadow: '0 0 28px rgba(var(--ip-accent-rgb), 0.38)',
            }}
          >
            Pulse
          </span>
        </motion.h1>

        {/* Clean Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.82, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]"
        >
          Gym Alarm &amp; Strength Tracker
        </motion.p>

        {/* Minimalist 5-Second Hairline Progress Track */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.95 }}
          aria-hidden="true"
          className="mt-7 h-[2px] w-40 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: (SPLASH_DURATION_MS - 150) / 1000,
              ease: 'linear',
            }}
            className="h-full w-full origin-left rounded-full bg-pulse shadow-[0_0_12px_rgba(var(--ip-accent-rgb),0.7)]"
          />
        </motion.div>
      </div>

      {/* Quiet Tap-to-Skip Hint in Lower Calm Zone */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 0.72, y: 0 }}
        transition={{ duration: 0.65, delay: 1.25, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] text-xs font-medium tracking-wide text-[#9CA3AF]"
      >
        {t('Ketuk layar untuk melewati', 'Tap anywhere to skip')}
      </motion.p>
    </motion.div>
  );
}
