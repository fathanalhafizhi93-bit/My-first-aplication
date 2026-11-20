import { memo, RefObject, useEffect, useRef } from 'react';
import { MascotCompanionState } from '../hooks/useMascotCompanion';
import { audioEngine } from '../lib/audioEngine';
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

export const TodayMascot = memo(function TodayMascot({
  companion,
  orbAnchorRef,
  hideOrbVisual = false,
  onVisibilityChange,
}: TodayMascotProps) {
  const { lang, t, performance } = useI18n();
  const phaseToken = PHASE_THEME_TOKENS[companion.timePhase];
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      <button
        ref={orbAnchorRef}
        type="button"
        onClick={() => {
          void audioEngine.unlock();
          haptics.orbSnap();
          companion.triggerNextReaction();
        }}
        aria-label={
          lang === 'en'
            ? 'IronPulse circular companion orb. Tap to switch reaction.'
            : 'Orb pendamping bulat IronPulse. Ketuk untuk ganti reaksi.'
        }
        className={`relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse ${
          hideOrbVisual ? 'pointer-events-none opacity-0' : 'opacity-100 hover:scale-105 active:scale-90'
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
      </button>

      <div className="min-w-0 flex-1">
        <div
          key={performance.noAnimations ? 'static-speech' : companion.speechKey}
          className={performance.noAnimations ? '' : 'ip-speech-enter'}
        >
          <p className="truncate text-xs sm:text-sm font-bold" style={{ color: companion.phaseColor }}>
            {companion.activeLine.headline}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#D1D5DB]">
            {companion.activeLine.subline}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void audioEngine.unlock();
            companion.triggerNextReaction();
          }}
          className="mt-1.5 inline-flex items-center text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#D1D5DB]"
        >
          {t('Ketuk orb untuk reaksi lain', 'Tap orb for another reaction')}
        </button>
      </div>
    </div>
  );
});
