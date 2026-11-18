import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import splashEmblem from '../assets/images/ironpulse_splash_emblem_1794926961620.jpg';
import { DayTimePhase, PHASE_THEME_TOKENS } from '../lib/i18n';

interface LaunchIntroProps {
  timePhase: DayTimePhase;
  onComplete: () => void;
}

export function LaunchIntro({ timePhase, onComplete }: LaunchIntroProps) {
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      onCompleteRef.current();
      return;
    }

    const timer = window.setTimeout(() => {
      onCompleteRef.current();
    }, 980);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      key="launch-intro"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -28,
        scale: 1.035,
        filter: 'blur(12px)',
      }}
      transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
      onClick={onComplete}
      role="presentation"
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#0A0B0E]/82 px-6 backdrop-blur-2xl select-none"
    >
      {/* Phase-synced atmospheric radial backdrop so transition feels connected to the app */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: phaseToken.ambientGlow }}
      />

      {/* Expanding kinetic halo */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0.65, opacity: 0.55 }}
        animate={{ scale: 1.55, opacity: 0 }}
        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute h-52 w-52 rounded-full border"
        style={{ borderColor: phaseToken.accentBright }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Frosted Glass Capsule Emblem */}
        <motion.div
          initial={{ scale: 0.84, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="glass-surface relative flex h-32 w-32 items-center justify-center rounded-3xl border border-white/15 p-3 sm:h-36 sm:w-36"
        >
          <img
            src={splashEmblem}
            alt="IronPulse Emblem"
            className="h-full w-full rounded-2xl object-contain mix-blend-lighten"
          />
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-display text-5xl font-extrabold tracking-tight text-[#F4F5F7] sm:text-6xl"
        >
          IronPulse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mt-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]"
        >
          Gym Alarm &amp; Strength Tracker
        </motion.p>

        {/* Kinetic Sweep Bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.52, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 h-0.5 w-36 origin-center rounded-full bg-pulse"
        />
      </div>
    </motion.div>
  );
}
