import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Moon, Sun, Sunrise } from 'lucide-react';
import { DayTimePhase, PHASE_THEME_TOKENS, UiTheme } from '../lib/i18n';

interface PhaseLogoEmblemProps {
  timePhase: DayTimePhase;
  uiTheme: UiTheme;
}

const PHASE_ICON_MAP = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
} as const;

export function PhaseLogoEmblem({ timePhase, uiTheme }: PhaseLogoEmblemProps) {
  const prefersReducedMotion = useReducedMotion();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';
  const PhaseIcon = PHASE_ICON_MAP[timePhase];

  const frameShapeClass = isFrosted
    ? 'rounded-[18px]'
    : isCarbon
      ? 'rounded-[10px]'
      : 'rounded-2xl';

  return (
    <div
      aria-hidden="true"
      className={`relative flex h-14 w-14 sm:h-[72px] sm:w-[72px] lg:h-[76px] lg:w-[76px] shrink-0 items-center justify-center overflow-hidden border transition-colors duration-300 ${frameShapeClass} ${phaseToken.emblemClass}`}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={timePhase}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          <PhaseIcon className="h-7 w-7 sm:h-9 sm:w-9" strokeWidth={2} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
