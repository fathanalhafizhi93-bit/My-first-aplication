import { memo, useEffect, useState } from 'react';
import { formatClockTime } from '../lib/dateUtils';
import { ClockFormat, useI18n } from '../lib/i18n';

interface FluidClockDisplayProps {
  timeText: string;
  meridiem?: 'AM' | 'PM';
}

const ClockDigitSlot = memo(function ClockDigitSlot({
  char,
  isSecondsDigit,
  disableAnim,
}: {
  char: string;
  isSecondsDigit: boolean;
  disableAnim: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-[1.15em] w-[1ch] items-center justify-center overflow-hidden"
    >
      <span
        key={disableAnim ? 'static' : char}
        className={`flex items-center justify-center ${disableAnim ? '' : 'ip-digit-pop'} ${
          isSecondsDigit ? 'text-[#DCE3EE]' : 'text-[#F4F5F7]'
        }`}
      >
        {char}
      </span>
    </span>
  );
});

export const FluidClockDisplay = memo(function FluidClockDisplay({
  timeText,
  meridiem,
}: FluidClockDisplayProps) {
  const { performance } = useI18n();
  const disableAnim = performance.noAnimations;
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
          if (char === ':') {
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

          return (
            <ClockDigitSlot
              key={`slot-${idx}`}
              char={char}
              isSecondsDigit={lastColonIdx !== -1 && idx > lastColonIdx}
              disableAnim={disableAnim}
            />
          );
        })}
      </time>

      {meridiem && (
        <span
          key={disableAnim ? 'meridiem' : meridiem}
          className={`font-mono text-xs sm:text-base lg:text-lg font-extrabold tracking-wide text-pulse ${
            disableAnim ? '' : 'ip-digit-pop'
          }`}
        >
          {meridiem}
        </span>
      )}
    </div>
  );
});

export const LiveFluidClock = memo(function LiveFluidClock({
  clockFormat,
}: {
  clockFormat: ClockFormat;
}) {
  const [tickNow, setTickNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let timer: number | undefined;

    const startClock = () => {
      if (timer !== undefined) return;
      timer = window.setInterval(() => {
        if (!document.hidden) {
          setTickNow(new Date());
        }
      }, 1000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTickNow(new Date());
      }
    };

    startClock();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (timer !== undefined) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatted = formatClockTime(tickNow, clockFormat, true);
  return <FluidClockDisplay timeText={formatted.timeText} meridiem={formatted.meridiem} />;
});
