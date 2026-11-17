import { useEffect } from 'react';
import { motion } from 'motion/react';
import splashEmblem from '../assets/images/ironpulse_splash_emblem_1794926961620.jpg';

interface LaunchIntroProps {
  onComplete: () => void;
}

export function LaunchIntro({ onComplete }: LaunchIntroProps) {
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      onComplete();
      return;
    }

    const timer = window.setTimeout(() => {
      onComplete();
    }, 1150);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="launch-intro"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={onComplete}
      role="presentation"
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#0A0B0E] px-6 select-none"
    >
      {/* Subtle radial electric accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-[#C8FF2E]/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Custom Generated IronPulse Emblem */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44"
        >
          <img
            src={splashEmblem}
            alt="IronPulse Emblem"
            className="h-full w-full rounded-3xl object-contain mix-blend-lighten"
          />
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 font-display text-5xl font-extrabold tracking-tight text-[#F4F5F7] sm:text-6xl"
        >
          IronPulse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className="mt-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]"
        >
          Gym Alarm &amp; Strength Tracker
        </motion.p>

        {/* Horizontal Kinetic Accent Line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 h-0.5 w-36 origin-center rounded-full bg-[#C8FF2E]"
        />
      </div>
    </motion.div>
  );
}
