import { memo, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { MascotCompanionState } from '../hooks/useMascotCompanion';
import { haptics } from '../lib/haptics';
import { PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';
import { AppTab } from '../types/gym';
import { MascotOrbFace } from './MascotOrbFace';
import { ModalPortal } from './ModalPortal';

interface FloatingMascotDockProps {
  companion: MascotCompanionState;
  shouldFloat: boolean;
  suppressed: boolean;
  activeTab: AppTab;
  getHeroOrbRect: () => DOMRect | null;
  onFloatingPresenceChange: (active: boolean) => void;
}

interface DockAnchor {
  side: 'left' | 'right';
  yRatio: number;
}

type DockFlightPhase = 'hidden' | 'floating' | 'docking-home';

const DOCK_STORAGE_KEY = 'ironpulse_floating_orb_anchor';
const ORB_SIZE = 54;
const HERO_ORB_SIZE = 64;
const EDGE_MARGIN = 14;
const TOP_SAFE = 76;
const DRAG_THRESHOLD_PX = 8;
const AUTO_BUBBLE_COOLDOWN_MS = 45_000;

function getBottomSafe(): number {
  if (typeof window === 'undefined') return 106;
  return window.innerWidth < 768 ? 106 : 24;
}

function getSafeBounds() {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
  const minX = EDGE_MARGIN;
  const maxX = Math.max(minX, vw - ORB_SIZE - EDGE_MARGIN);
  const minY = TOP_SAFE;
  const maxY = Math.max(minY, vh - ORB_SIZE - getBottomSafe());
  return { vw, vh, minX, maxX, minY, maxY };
}

function loadStoredAnchor(): DockAnchor {
  try {
    const raw = localStorage.getItem(DOCK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DockAnchor>;
      const side = parsed.side === 'left' ? 'left' : 'right';
      const yRatio =
        typeof parsed.yRatio === 'number' && Number.isFinite(parsed.yRatio)
          ? Math.max(0, Math.min(1, parsed.yRatio))
          : 0.02;
      return { side, yRatio };
    }
  } catch {
    // ignore storage errors
  }
  return { side: 'right', yRatio: 0.02 };
}

function saveStoredAnchor(anchor: DockAnchor): void {
  try {
    localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(anchor));
  } catch {
    // ignore storage errors
  }
}

function resolveAnchorCoords(anchor: DockAnchor): { x: number; y: number } {
  const { minX, maxX, minY, maxY } = getSafeBounds();
  const x = anchor.side === 'left' ? minX : maxX;
  const y = minY + Math.max(0, Math.min(1, anchor.yRatio)) * (maxY - minY);
  return { x, y };
}

export const FloatingMascotDock = memo(function FloatingMascotDock({
  companion,
  shouldFloat,
  suppressed,
  activeTab,
  getHeroOrbRect,
  onFloatingPresenceChange,
}: FloatingMascotDockProps) {
  const { t, uiTheme } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const phaseToken = PHASE_THEME_TOKENS[companion.timePhase];
  const isMaterialYou = uiTheme === 'material-you';
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';
  const isAero = uiTheme === 'aeroglass';
  const isYaru = uiTheme === 'ubuntu-yaru';

  const anchorRef = useRef<DockAnchor>(loadStoredAnchor());
  const [dockedSide, setDockedSide] = useState<'left' | 'right'>(anchorRef.current.side);
  const [flightPhase, setFlightPhase] = useState<DockFlightPhase>('hidden');
  const flightPhaseRef = useRef<DockFlightPhase>('hidden');
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [bubbleVerticalAlign, setBubbleVerticalAlign] = useState<'top' | 'bottom'>('top');

  const initialCoords = resolveAnchorCoords(anchorRef.current);
  const x = useMotionValue(initialCoords.x);
  const y = useMotionValue(initialCoords.y);
  const orbScale = useMotionValue(1);
  const orbOpacity = useMotionValue(0);

  const dockContainerRef = useRef<HTMLDivElement | null>(null);
  const landingRafRef = useRef<number | null>(null);
  const activeAnimationsRef = useRef<Array<{ stop: () => void }>>([]);
  const bubbleTimerRef = useRef<number | null>(null);
  const lastHandledSpeechEventRef = useRef<number>(companion.speechEventId);
  const hasGreetedInFloatSessionRef = useRef<boolean>(false);
  const lastAutoBubbleAtRef = useRef<number>(0);

  const dragStateRef = useRef<{
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startOrbX: number;
    startOrbY: number;
    didDrag: boolean;
  }>({
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startOrbX: 0,
    startOrbY: 0,
    didDrag: false,
  });

  const stopMotionAnimations = useCallback(() => {
    activeAnimationsRef.current.forEach((ctrl) => ctrl.stop());
    activeAnimationsRef.current = [];
  }, []);

  const cancelLandingRaf = useCallback(() => {
    if (landingRafRef.current !== null) {
      window.cancelAnimationFrame(landingRafRef.current);
      landingRafRef.current = null;
    }
  }, []);

  const clearBubbleTimer = useCallback(() => {
    if (bubbleTimerRef.current !== null) {
      window.clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }
  }, []);

  const updatePhase = useCallback(
    (next: DockFlightPhase) => {
      flightPhaseRef.current = next;
      setFlightPhase(next);
      onFloatingPresenceChange(next !== 'hidden');
    },
    [onFloatingPresenceChange]
  );

  const openBubbleBriefly = useCallback(
    (durationMs: number) => {
      clearBubbleTimer();
      const { vh } = getSafeBounds();
      setBubbleVerticalAlign(y.get() > vh * 0.62 ? 'bottom' : 'top');
      setBubbleOpen(true);
      bubbleTimerRef.current = window.setTimeout(() => {
        setBubbleOpen(false);
        bubbleTimerRef.current = null;
      }, durationMs);
    },
    [clearBubbleTimer, y]
  );

  // Manage fluid take-off (Hero -> Floating) and fluid live-tracking return (Floating -> Hero)
  useEffect(() => {
    if (suppressed) {
      cancelLandingRaf();
      stopMotionAnimations();
      clearBubbleTimer();
      setBubbleOpen(false);
      hasGreetedInFloatSessionRef.current = false;
      orbOpacity.set(0);
      if (flightPhaseRef.current !== 'hidden') {
        updatePhase('hidden');
      }
      return;
    }

    if (shouldFloat) {
      cancelLandingRaf();
      stopMotionAnimations();

      const target = resolveAnchorCoords(anchorRef.current);
      setDockedSide(anchorRef.current.side);

      const prevPhase = flightPhaseRef.current;

      if (prevPhase === 'hidden') {
        const heroRect = activeTab === 'today' ? getHeroOrbRect() : null;
        if (heroRect && !prefersReducedMotion) {
          // Fluid take-off right from the Hero orb's last viewport location
          const { vw, vh } = getSafeBounds();
          const startX = Math.max(
            8,
            Math.min(vw - ORB_SIZE - 8, heroRect.left + (heroRect.width - ORB_SIZE) / 2)
          );
          const startY = Math.max(
            12,
            Math.min(vh - ORB_SIZE - 12, heroRect.top + (heroRect.height - ORB_SIZE) / 2)
          );
          const startScale = heroRect.width > 0 ? heroRect.width / ORB_SIZE : HERO_ORB_SIZE / ORB_SIZE;

          x.set(startX);
          y.set(startY);
          orbScale.set(startScale);
          orbOpacity.set(1);

          activeAnimationsRef.current = [
            animate(x, target.x, { type: 'spring', stiffness: 250, damping: 26, mass: 0.88 }),
            animate(y, target.y, { type: 'spring', stiffness: 250, damping: 26, mass: 0.88 }),
            animate(orbScale, 1, { type: 'spring', stiffness: 290, damping: 26 }),
          ];
        } else {
          // Tab switch or reduced-motion entrance directly at the corner dock
          x.set(target.x);
          y.set(target.y);
          orbScale.set(prefersReducedMotion ? 1 : 0.76);
          orbOpacity.set(0);
          activeAnimationsRef.current = [
            animate(orbOpacity, 1, { duration: 0.2, ease: [0.16, 1, 0.3, 1] }),
            animate(orbScale, 1, {
              type: prefersReducedMotion ? 'tween' : 'spring',
              stiffness: 380,
              damping: 26,
              duration: prefersReducedMotion ? 0.14 : undefined,
            }),
          ];
        }
        updatePhase('floating');
      } else if (prevPhase === 'docking-home') {
        // User scrolled back down mid-return: seamlessly curve back out to corner dock
        orbOpacity.set(1);
        activeAnimationsRef.current = [
          animate(x, target.x, { type: 'spring', stiffness: 280, damping: 26 }),
          animate(y, target.y, { type: 'spring', stiffness: 280, damping: 26 }),
          animate(orbScale, 1, { type: 'spring', stiffness: 300, damping: 26 }),
        ];
        updatePhase('floating');
      }
      return;
    }

    // shouldFloat === false -> Return smoothly to Hero home slot if currently floating
    if (flightPhaseRef.current === 'floating') {
      clearBubbleTimer();
      setBubbleOpen(false);
      hasGreetedInFloatSessionRef.current = false;
      stopMotionAnimations();

      const initialHeroRect = activeTab === 'today' ? getHeroOrbRect() : null;
      if (initialHeroRect && !prefersReducedMotion) {
        updatePhase('docking-home');

        let curX = x.get();
        let curY = y.get();
        let curScale = orbScale.get();
        let vx = 0;
        let vy = 0;
        let vScale = 0;

        const stiffness = 275;
        const damping = 26;
        const startTime = performance.now();
        let lastTime = startTime;

        const step = (now: number) => {
          const dt = Math.min(0.032, Math.max(0.004, (now - lastTime) / 1000));
          lastTime = now;

          const liveRect = getHeroOrbRect();
          if (!liveRect || liveRect.width <= 0) {
            landingRafRef.current = null;
            orbOpacity.set(0);
            updatePhase('hidden');
            return;
          }

          const targetX = liveRect.left + (liveRect.width - ORB_SIZE) / 2;
          const targetY = liveRect.top + (liveRect.height - ORB_SIZE) / 2;
          const targetScale = liveRect.width / ORB_SIZE;

          // Spring-damped 2D + scale flight chasing the live scrolling Hero anchor
          const ax = (targetX - curX) * stiffness - vx * damping;
          const ay = (targetY - curY) * stiffness - vy * damping;
          const aScale = (targetScale - curScale) * stiffness - vScale * damping;

          vx += ax * dt;
          vy += ay * dt;
          vScale += aScale * dt;

          curX += vx * dt;
          curY += vy * dt;
          curScale += vScale * dt;

          x.set(curX);
          y.set(curY);
          orbScale.set(curScale);

          const dist = Math.hypot(targetX - curX, targetY - curY);
          const speed = Math.hypot(vx, vy);
          const elapsed = now - startTime;

          if ((dist < 1.8 && speed < 32) || elapsed >= 440) {
            x.set(targetX);
            y.set(targetY);
            orbScale.set(targetScale);
            landingRafRef.current = null;
            orbOpacity.set(0);
            updatePhase('hidden');
            return;
          }

          landingRafRef.current = window.requestAnimationFrame(step);
        };

        landingRafRef.current = window.requestAnimationFrame(step);
      } else {
        const fadeCtrl = animate(orbOpacity, 0, {
          duration: 0.16,
          ease: 'easeOut',
          onComplete: () => {
            if (flightPhaseRef.current !== 'floating') {
              updatePhase('hidden');
            }
          },
        });
        activeAnimationsRef.current = [fadeCtrl];
        updatePhase('docking-home');
      }
    }
  }, [
    shouldFloat,
    suppressed,
    activeTab,
    prefersReducedMotion,
    getHeroOrbRect,
    cancelLandingRaf,
    stopMotionAnimations,
    clearBubbleTimer,
    updatePhase,
    x,
    y,
    orbScale,
    orbOpacity,
  ]);

  // Sync floating speech bubble cleanly whenever a new locked dialogue event fires
  useEffect(() => {
    if (flightPhase !== 'floating' || suppressed || isDragging) return;

    const nowTs = Date.now();
    const hasNewSpeech = companion.speechEventId !== lastHandledSpeechEventRef.current;

    if (hasNewSpeech) {
      lastHandledSpeechEventRef.current = companion.speechEventId;
      hasGreetedInFloatSessionRef.current = true;
      lastAutoBubbleAtRef.current = nowTs;
      openBubbleBriefly(companion.isUrgentSpeech ? 4200 : 3800);
      return;
    }

    if (!hasGreetedInFloatSessionRef.current) {
      hasGreetedInFloatSessionRef.current = true;
      const cooldownElapsed = nowTs - lastAutoBubbleAtRef.current >= AUTO_BUBBLE_COOLDOWN_MS;
      if (!companion.isUrgentSpeech && !cooldownElapsed) return;
      const delayTimer = window.setTimeout(() => {
        if (flightPhaseRef.current === 'floating' && !dragStateRef.current.didDrag) {
          lastAutoBubbleAtRef.current = Date.now();
          openBubbleBriefly(companion.isUrgentSpeech ? 3800 : 3400);
        }
      }, 280);
      return () => window.clearTimeout(delayTimer);
    }
  }, [
    flightPhase,
    suppressed,
    isDragging,
    companion.speechEventId,
    companion.isUrgentSpeech,
    openBubbleBriefly,
  ]);

  // Keep orb safely inside bounds when window resizes or phone rotates
  useEffect(() => {
    const handleResize = () => {
      if (flightPhaseRef.current !== 'floating') return;
      const target = resolveAnchorCoords(anchorRef.current);
      x.set(target.x);
      y.set(target.y);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [x, y]);

  // Dismiss open speech bubble on outside pointer press
  useEffect(() => {
    if (!bubbleOpen) return;
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (
        dockContainerRef.current &&
        !dockContainerRef.current.contains(e.target as Node)
      ) {
        clearBubbleTimer();
        setBubbleOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside, true);
  }, [bubbleOpen, clearBubbleTimer]);

  // Cleanup timers and animation frames on unmount
  useEffect(() => {
    return () => {
      cancelLandingRaf();
      stopMotionAnimations();
      clearBubbleTimer();
    };
  }, [cancelLandingRaf, stopMotionAnimations, clearBubbleTimer]);

  const handleOrbPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (flightPhaseRef.current !== 'floating') return;
    stopMotionAnimations();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOrbX: x.get(),
      startOrbY: y.get(),
      didDrag: false,
    };
  };

  const handleOrbPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;

    if (!drag.didDrag && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      drag.didDrag = true;
      setIsDragging(true);
      clearBubbleTimer();
      setBubbleOpen(false);
    }

    if (drag.didDrag) {
      const { minX, maxX, minY, maxY } = getSafeBounds();
      x.set(Math.max(minX, Math.min(maxX, drag.startOrbX + dx)));
      y.set(Math.max(minY, Math.min(maxY, drag.startOrbY + dy)));
    }
  };

  const finishPointerInteraction = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.pointerId = null;

    if (drag.didDrag) {
      drag.didDrag = false;
      setIsDragging(false);

      // Magnetic snap to closest horizontal edge within vertical safe zone
      const { vw, minX, maxX, minY, maxY } = getSafeBounds();
      const currentX = x.get();
      const currentY = Math.max(minY, Math.min(maxY, y.get()));
      const side: 'left' | 'right' = currentX + ORB_SIZE / 2 < vw / 2 ? 'left' : 'right';
      const snapX = side === 'left' ? minX : maxX;
      const yRatio = maxY > minY ? (currentY - minY) / (maxY - minY) : 0;

      anchorRef.current = { side, yRatio };
      saveStoredAnchor(anchorRef.current);
      setDockedSide(side);
      haptics.orbSnap();

      activeAnimationsRef.current = [
        animate(x, snapX, { type: 'spring', stiffness: 380, damping: 28 }),
        animate(y, currentY, { type: 'spring', stiffness: 380, damping: 28 }),
      ];
      return;
    }

    // Pure tap:
    // - If bubble is CLOSED -> recall exact last spoken line without changing it
    // - If bubble is OPEN   -> cycle to a new reaction & reset brief auto-hide timer
    haptics.orbSnap();
    if (!bubbleOpen) {
      openBubbleBriefly(4400);
    } else {
      companion.triggerNextReaction();
      openBubbleBriefly(4400);
    }
  };

  if (flightPhase === 'hidden') return null;

  const bubbleSurfaceClass = isAero
    ? 'rounded-[14px] border border-sky-200/35 bg-gradient-to-b from-[#234361]/85 via-[#132940]/88 to-[#091624]/92 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.52),inset_0_0_0_1px_rgba(255,255,255,0.12),0_18px_42px_-12px_rgba(0,0,0,0.82)]'
    : isMaterialYou
      ? 'rounded-[24px] border border-md-outline-variant bg-md-surface-high shadow-[0_14px_34px_-12px_rgba(0,0,0,0.68)]'
      : isYaru
        ? 'rounded-xl border border-white/12 bg-[#2C2C2C] shadow-[0_4px_14px_rgba(0,0,0,0.38)]'
        : isFrosted
          ? 'rounded-[22px] border border-white/22 bg-[#101829]/82 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_20px_48px_-14px_rgba(0,0,0,0.8)]'
          : isCarbon
            ? 'rounded-xl border border-white/16 bg-[#11141A]/96 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.86)]'
            : 'rounded-2xl border border-white/15 bg-[#121620]/88 backdrop-blur-md shadow-[0_18px_42px_-14px_rgba(0,0,0,0.78)]';

  const orbBackdropClass = isAero
    ? 'bg-[#132940]/80 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.48),0_12px_30px_-8px_rgba(0,0,0,0.8)]'
    : isMaterialYou
      ? 'bg-md-surface-high ring-1 ring-md-outline-variant shadow-[0_10px_28px_-8px_rgba(0,0,0,0.72)]'
      : isYaru
        ? 'bg-[#2C2C2C] ring-1 ring-white/14 shadow-[0_4px_12px_rgba(0,0,0,0.38)]'
        : isFrosted
          ? 'bg-[#101829]/78 backdrop-blur-md shadow-[0_12px_32px_-8px_rgba(0,0,0,0.78)]'
          : isCarbon
            ? 'bg-[#12151B] ring-1 ring-white/14 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.85)]'
            : 'bg-[#10131B]/88 backdrop-blur-md shadow-[0_12px_30px_-8px_rgba(0,0,0,0.78)]';

  return (
    <ModalPortal>
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <motion.div
          ref={dockContainerRef}
          style={{
            x,
            y,
            scale: orbScale,
            opacity: orbOpacity,
          }}
          className="pointer-events-none fixed left-0 top-0 h-[54px] w-[54px] will-change-transform"
        >
          {/* Floating Interactive Circular Orb Button (Draggable + Tap-to-Recall) */}
          <button
            type="button"
            onPointerDown={handleOrbPointerDown}
            onPointerMove={handleOrbPointerMove}
            onPointerUp={finishPointerInteraction}
            onPointerCancel={finishPointerInteraction}
            aria-expanded={bubbleOpen}
            aria-label={
              bubbleOpen
                ? t(
                    'Orb pendamping aktif. Ketuk lagi untuk reaksi baru atau geser untuk memindahkan.',
                    'Floating companion orb open. Tap again for a new reaction or drag to move.'
                  )
                : t(
                    'Orb pendamping mengambang. Ketuk untuk melihat ucapan terakhir atau geser untuk memindahkan.',
                    'Floating companion orb. Tap to recall last message or drag to move.'
                  )
            }
            className={`pointer-events-auto relative flex h-[54px] w-[54px] touch-none select-none items-center justify-center rounded-full transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse ${
              isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab active:scale-95'
            } ${orbBackdropClass}`}
          >
            <MascotOrbFace
              visualPose={companion.visualPose}
              phaseColor={companion.phaseColor}
              isBlinking={companion.isBlinking}
              glance={companion.glance}
              tapBounce={companion.tapBounce}
              size="floating"
            />
          </button>

          {/* Adaptive Brief Speech Bubble (Bubble Chat) */}
          <AnimatePresence>
            {bubbleOpen && flightPhase === 'floating' && !isDragging && (
              <motion.div
                role="status"
                aria-live="polite"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.88,
                        x: dockedSide === 'right' ? 10 : -10,
                      }
                }
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.9,
                        x: dockedSide === 'right' ? 8 : -8,
                      }
                }
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => {
                  clearBubbleTimer();
                  setBubbleOpen(false);
                }}
                style={{
                  width: 'min(248px, calc(100vw - 96px))',
                  transformOrigin:
                    dockedSide === 'right'
                      ? bubbleVerticalAlign === 'bottom'
                        ? 'bottom right'
                        : 'top right'
                      : bubbleVerticalAlign === 'bottom'
                        ? 'bottom left'
                        : 'top left',
                }}
                className={`pointer-events-auto absolute cursor-pointer px-3.5 py-2.5 text-left ${bubbleSurfaceClass} ${
                  dockedSide === 'right' ? 'right-[64px]' : 'left-[64px]'
                } ${bubbleVerticalAlign === 'bottom' ? 'bottom-0' : 'top-0'}`}
              >
                {/* Speech Bubble Tail Pointer */}
                <span
                  aria-hidden="true"
                  className={`absolute h-2.5 w-2.5 rotate-45 ${
                    isAero
                      ? 'bg-[#132940] border-sky-200/35'
                      : isFrosted
                        ? 'bg-[#101829] border-white/22'
                        : isMaterialYou
                          ? 'bg-md-surface-high border-md-outline-variant'
                          : isCarbon
                            ? 'bg-[#11141A] border-white/16'
                            : 'bg-[#121620] border-white/15'
                  } ${
                    dockedSide === 'right'
                      ? '-right-[6px] border-r border-t'
                      : '-left-[6px] border-b border-l'
                  } ${bubbleVerticalAlign === 'bottom' ? 'bottom-[20px]' : 'top-[20px]'}`}
                />

                <div
                  key={companion.speechKey}
                  className={prefersReducedMotion ? '' : 'ip-speech-enter'}
                >
                  <p
                    className="text-xs font-bold leading-snug"
                    style={{ color: companion.phaseColor }}
                  >
                    {companion.activeLine.headline}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#E5E7EB]">
                    {companion.activeLine.subline}
                  </p>
                  <p className="mt-1.5 text-[10px] font-medium text-[#9CA3AF]">
                    {t('Ketuk orb lagi untuk reaksi lain', 'Tap orb again for another reaction')}
                  </p>
                </div>

                {/* Subtle Phase Accent Bottom Hairline */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-4 bottom-0 h-[2px] rounded-full opacity-55 ${phaseToken.labelClass}`}
                  style={{ backgroundColor: companion.phaseColor }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </ModalPortal>
  );
});
