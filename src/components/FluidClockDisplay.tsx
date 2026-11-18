import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface FluidClockDisplayProps {
  timeText: string;
  meridiem?: 'AM' | 'PM';
}

export function FluidClockDisplay({ timeText, meridiem }: FluidClockDisplayProps) {
  const prefersReducedMotion = useReducedMotion();
  const chars = timeText.split('');

  const lastColonIdx = timeText.lastIndexOf(':');
  const accessibleTime = meridiem ? `${timeText} ${meridiem}` : timeText;

  return (
    <div className="flex items-baseline gap-1.5 sm:gap-2.5 min-w-0">
      <time
        dateTime={timeText}
        aria-label={accessibleTime}
        className="inline-flex items-center font-mono text-[2.625rem] sm:text-[3.75rem] lg:text-[4.5rem] font-extrabold leading-none tracking-[-0.02em] tabular-nums select-none"
      >
        {chars.map((char, idx) => {
          const isColon = char === ':';
          const isSecondsDigit = lastColonIdx !== -1 && idx > lastColonIdx;

          if (isColon) {
            return (
              <span
                key={`sep-${idx}`}
                aria-hidden="true"
                className="inline-flex h-[1.15em] w-[0.44ch] items-center justify-center text-white/45 -translate-y-[0.04em]"
              >
                :
              </span>
            );
          }

          if (prefersReducedMotion) {
            return (
              <span
                key={`static-${idx}`}
                aria-hidden="true"
                className={`inline-flex h-[1.15em] w-[1ch] items-center justify-center ${
                  isSecondsDigit ? 'text-[#DCE3EE]' : 'text-[#F4F5F7]'
                }`}
              >
                {char}
              </span>
            );
          }

          return (
            <span
              key={`slot-${idx}`}
              aria-hidden="true"
              className="relative inline-flex h-[1.15em] w-[1ch] items-center justify-center overflow-hidden"
            >
              {/* Invisible in-flow reference keeps slot geometry & baseline completely rock-solid */}
              <span className="invisible pointer-events-none select-none">0</span>

              <AnimatePresence initial={false} mode="sync">
                <motion.span
                  key={`${idx}-${char}`}
                  initial={{ y: '46%', opacity: 0, filter: 'blur(2.5px)' }}
                  animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: '-46%', opacity: 0, filter: 'blur(2.5px)' }}
                  transition={{
                    duration: 0.24,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`absolute inset-0 flex items-center justify-center will-change-transform ${
                    isSecondsDigit ? 'text-[#DCE3EE]' : 'text-[#F4F5F7]'
                  }`}
                >
                  {char}
                </motion.span>
              </AnimatePresence>
            </span>
          );
        })}
      </time>

      {meridiem && (
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={meridiem}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-xs sm:text-base lg:text-lg font-extrabold tracking-wide text-pulse"
          >
            {meridiem}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}
