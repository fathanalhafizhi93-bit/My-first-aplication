import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { formatClockTime } from '../lib/dateUtils';
import { ClockFormat } from '../lib/i18n';

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
        className="inline-flex items-center font-mono text-[clamp(1.75rem,8.4vw,2.625rem)] sm:text-[3.5rem] lg:text-[4.35rem] font-extrabold leading-none tracking-[-0.02em] tabular-nums select-none"
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
                  initial={{ y: '42%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-42%', opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`absolute inset-0 flex items-center justify-center ${
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
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-xs sm:text-base lg:text-lg font-extrabold tracking-wide text-pulse"
          >
            {meridiem}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}

export function LiveFluidClock({ clockFormat }: { clockFormat: ClockFormat }) {
  const [tickNow, setTickNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTickNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatted = formatClockTime(tickNow, clockFormat, true);
  return <FluidClockDisplay timeText={formatted.timeText} meridiem={formatted.meridiem} />;
}
