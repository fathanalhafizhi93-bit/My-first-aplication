import { useEffect } from 'react';
import { motion } from 'motion/react';

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
    }, 1250);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="launch-intro"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={onComplete}
      role="presentation"
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#0A0B0E] px-6 select-none"
    >
      <div className="flex flex-col items-center">
        {/* Animated Barbell & Pulse SVG */}
        <motion.svg
          viewBox="0 0 220 110"
          className="h-24 w-48"
          fill="none"
          aria-hidden="true"
        >
          {/* Left Weight Plates */}
          <motion.g
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <rect x="18" y="31" width="14" height="48" rx="4" fill="#C8FF2E" />
            <rect x="37" y="19" width="18" height="72" rx="5" fill="#C8FF2E" />
          </motion.g>

          {/* Right Weight Plates */}
          <motion.g
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <rect x="188" y="31" width="14" height="48" rx="4" fill="#C8FF2E" />
            <rect x="165" y="19" width="18" height="72" rx="5" fill="#C8FF2E" />
          </motion.g>

          {/* Center Bar + ECG Pulse */}
          <motion.path
            d="M55 55H84L96 32L112 78L124 55H165"
            stroke="#F4F5F7"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.svg>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 font-display text-5xl font-extrabold tracking-tight text-[#F4F5F7]"
        >
          IronPulse
        </motion.h1>

        {/* Horizontal Kinetic Accent Line (compositor transform only) */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 h-0.5 w-32 origin-center rounded-full bg-[#C8FF2E]"
        />
      </div>
    </motion.div>
  );
}
