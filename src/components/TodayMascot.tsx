import { RefObject, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MascotCompanionState } from '../hooks/useMascotCompanion';
import { haptics } from '../lib/haptics';
import { PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';
import { MascotOrbFace } from './MascotOrbFace';

export type { MascotMood } from '../hooks/useMascotCompanion';

interface TodayMascotProps {
  companion: MascotCompanionState;
  orbAnchorRef: RefObject<HTMLButtonElement | null>;
  hideOrbVisual?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export function TodayMascot({
  companion,
  orbAnchorRef,
  hideOrbVisual = false,
  onVisibilityChange,
}: TodayMascotProps) {
  const { lang, t } = useI18n();
  const phaseToken = PHASE_THEME_TOKENS[companion.timePhase];
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Observe whether the Hero mascot row is visible below the sticky 64px TopBar
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onVisibilityChange) return;

    if (typeof IntersectionObserver === 'undefined') {
      onVisibilityChange(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        onVisibilityChange(entry.isIntersecting && entry.intersectionRatio >= 0.15);
      },
      {
        root: null,
        rootMargin: '-64px 0px 0px 0px',
        threshold: [0, 0.15, 0.5],
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      onVisibilityChange(false);
    };
  }, [onVisibilityChange]);

  return (
    <div
      ref={containerRef}
      className={`glass-surface-subtle flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 transition-colors duration-300 ${phaseToken.subtleBorder}`}
    >
      {/* Inline Hero Companion Orb Anchor (hides seamlessly while floating or landing in-flight) */}
      <motion.button
        ref={orbAnchorRef}
        type="button"
        onClick={() => {
          haptics.orbSnap();
          companion.triggerNextReaction();
        }}
        whileHover={hideOrbVisual ? undefined : { scale: 1.05 }}
        whileTap={hideOrbVisual ? undefined : { scale: 0.9 }}
        aria-label={
          lang === 'en'
            ? 'IronPulse circular companion orb. Tap to switch reaction.'
            : 'Orb pendamping bulat IronPulse. Ketuk untuk ganti reaksi.'
        }
        className={`relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse ${
          hideOrbVisual ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <MascotOrbFace
          visualPose={companion.visualPose}
          phaseColor={companion.phaseColor}
          isBlinking={companion.isBlinking}
          glance={companion.glance}
          tapBounce={companion.tapBounce}
          size="hero"
        />
      </motion.button>

      {/* Speech Text with Snappy Swap */}
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={companion.speechKey}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="truncate text-xs sm:text-sm font-bold" style={{ color: companion.phaseColor }}>
              {companion.activeLine.headline}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#D1D5DB]">
              {companion.activeLine.subline}
            </p>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={companion.triggerNextReaction}
          className="mt-1.5 inline-flex items-center text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#D1D5DB]"
        >
          {t('Ketuk orb untuk reaksi lain', 'Tap orb for another reaction')}
        </button>
      </div>
    </div>
  );
}
