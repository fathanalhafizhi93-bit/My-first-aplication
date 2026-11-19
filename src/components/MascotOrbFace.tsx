import { motion } from 'motion/react';
import { MascotMood, TimePhasePose } from '../hooks/useMascotCompanion';

interface MascotOrbFaceProps {
  visualPose: MascotMood | TimePhasePose;
  phaseColor: string;
  isBlinking: boolean;
  glance: { x: number; y: number };
  tapBounce: boolean;
  size?: 'hero' | 'floating';
}

export function MascotOrbFace({
  visualPose,
  phaseColor,
  isBlinking,
  glance,
  tapBounce,
  size = 'hero',
}: MascotOrbFaceProps) {
  const isCelebration =
    visualPose === 'clap' || visualPose === 'celebrate' || visualPose === 'milestone';
  const isSleepPose = visualPose === 'sleep';
  const isYawnPose = visualPose === 'yawn';
  const isTeaPose = visualPose === 'tea';
  const isCoffeePose = visualPose === 'coffee';
  const isWinkPose = visualPose === 'wink';
  const isShadesPose = visualPose === 'shades';
  const isHydratePose = visualPose === 'hydrate';
  const isStretchPose = visualPose === 'stretch';
  const isFlexPose = visualPose === 'flex';
  const isMusicPose = visualPose === 'music';
  const isNightChillPose = visualPose === 'nightChill';
  const isStargazePose = visualPose === 'stargaze';
  const isZenPose = visualPose === 'zen';
  const isCalmEyes = visualPose === 'rest';
  const isFocusedEyes = visualPose === 'timerActive';
  const isCuriousPose = visualPose === 'curious';

  const orbAnimation = tapBounce
    ? { scale: [1, 1.13, 0.95, 1.04, 1], y: [0, -3.5, 0] }
    : isCelebration
      ? { scale: [1, 1.13, 0.95, 1.09, 1], y: [0, -3, 0] }
      : isSleepPose
        ? { scale: [1, 1.03, 1], y: [0, 1.2, 0] }
        : isZenPose
          ? { scale: [1, 1.045, 1], y: [0, -1.5, 0] }
          : isMusicPose
            ? { y: [0, -2.6, 0, -1.8, 0], rotate: [0, -4, 0, 4, 0] }
            : isFlexPose
              ? { scale: [1, 1.06, 0.99, 1.04, 1], y: [0, -2, 0] }
              : isWinkPose
                ? { rotate: [0, -4, 2, 0], scale: [1, 1.03, 1] }
                : isYawnPose
                  ? { scale: [1, 1.045, 0.99, 1], rotate: [0, -3, 2, 0] }
                  : isTeaPose || isCoffeePose
                    ? { y: [0, -1.6, 0], rotate: [0, 2.5, 0, -2, 0] }
                    : isStretchPose
                      ? { y: [0, -3, 0], scale: [1, 1.04, 1] }
                      : isCuriousPose
                        ? { rotate: [0, -7, 4, 0], y: [0, -1.5, 0] }
                        : isStargazePose
                          ? { y: [0, -1.8, 0], scale: [1, 1.03, 1] }
                          : visualPose === 'timerActive'
                            ? { scale: [1, 1.045, 1] }
                            : { scale: [1, 1.025, 1] };

  const orbTransition =
    tapBounce || isCelebration
      ? { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const }
      : {
          duration: isSleepPose || isZenPose
            ? 3.8
            : isMusicPose
              ? 1.8
              : isFlexPose
                ? 2.1
                : isTeaPose || isCoffeePose
                  ? 3.1
                  : 2.6,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        };

  const outerSizeClass = size === 'floating' ? 'h-[54px] w-[54px]' : 'h-16 w-16';
  const bodySizeClass = size === 'floating' ? 'h-[48px] w-[48px]' : 'h-14 w-14';
  const svgSizeClass = size === 'floating' ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <span className={`relative flex ${outerSizeClass} items-center justify-center rounded-full`}>
      {/* Outer Breathing Pulse Ring */}
      <motion.span
        aria-hidden="true"
        animate={
          isCelebration || tapBounce
            ? { scale: [0.95, 1.3], opacity: [0.72, 0] }
            : isSleepPose
              ? { scale: [0.98, 1.1, 0.98], opacity: [0.22, 0.06, 0.22] }
              : isZenPose
                ? { scale: [0.96, 1.22, 0.96], opacity: [0.44, 0.08, 0.44] }
                : isMusicPose || isFlexPose
                  ? { scale: [0.97, 1.2, 0.97], opacity: [0.46, 0.1, 0.46] }
                  : { scale: [0.98, 1.16, 0.98], opacity: [0.36, 0.1, 0.36] }
        }
        transition={{
          duration: isCelebration ? 0.85 : isSleepPose || isZenPose ? 3.8 : isMusicPose ? 1.8 : 2.7,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="pointer-events-none absolute inset-0 rounded-full border-2"
        style={{ borderColor: phaseColor }}
      />

      {/* Core Circular Orb Body */}
      <motion.div
        animate={orbAnimation}
        transition={orbTransition}
        className={`relative flex ${bodySizeClass} items-center justify-center rounded-full border-2 bg-[#121620]/95 shadow-[inset_0_2px_6px_rgba(255,255,255,0.12)]`}
        style={{ borderColor: phaseColor }}
      >
        <svg viewBox="0 0 64 64" className={svgSizeClass} fill="none" aria-hidden="true">
          {/* Headphones Band for Music Pose */}
          {isMusicPose && (
            <g>
              <path
                d="M11 31C11 18.5 20.5 10.5 32 10.5C43.5 10.5 53 18.5 53 31"
                stroke={phaseColor}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <rect x="7.5" y="26.5" width="5.5" height="11" rx="2.7" fill={phaseColor} />
              <rect x="51" y="26.5" width="5.5" height="11" rx="2.7" fill={phaseColor} />
            </g>
          )}

          {/* Subtle Eyebrows */}
          {isFocusedEyes || isFlexPose ? (
            <>
              <path d="M17.5 21.5L25.5 23.8" stroke="#D1D5DB" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M46.5 21.5L38.5 23.8" stroke="#D1D5DB" strokeWidth="2.3" strokeLinecap="round" />
            </>
          ) : isCuriousPose ? (
            <>
              <path d="M18 22.5C20 20.5 23 20.5 25 22.5" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
              <path d="M39 20C41 17.8 44 17.8 46 20" stroke="#D1D5DB" strokeWidth="2.1" strokeLinecap="round" />
            </>
          ) : isWinkPose ? (
            <>
              <path d="M18 21.5C20 19.6 23.5 19.6 25.5 21.5" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
              <path d="M39 22.8C41 21.5 44 21.5 46 22.8" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : isYawnPose ? (
            <>
              <path d="M18 22C20 20.5 23.5 21 25 22.5" stroke="#9CA3AF" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M39 22.5C40.5 21 44 20.5 46 22" stroke="#9CA3AF" strokeWidth="1.9" strokeLinecap="round" />
            </>
          ) : null}

          {/* Animated Glancing Eye Group */}
          <motion.g
            animate={
              isSleepPose || isZenPose || isMusicPose
                ? { x: 0, y: 0 }
                : { x: glance.x, y: glance.y }
            }
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {isCelebration || isMusicPose ? (
              <>
                <path d="M18 28C19.8 24.4 24.2 24.4 26 28" stroke="#F4F5F7" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M38 28C39.8 24.4 44.2 24.4 46 28" stroke="#F4F5F7" strokeWidth="2.8" strokeLinecap="round" />
              </>
            ) : isWinkPose ? (
              <>
                <circle cx="22" cy="27.5" r="3.2" fill="#F4F5F7" />
                <circle cx="21" cy="26.3" r="1.05" fill={phaseColor} />
                <path
                  d="M38 27.6C40 24.8 44 24.8 46 27.6"
                  stroke="#F4F5F7"
                  strokeWidth="2.7"
                  strokeLinecap="round"
                />
              </>
            ) : isShadesPose ? (
              <>
                <rect x="14.5" y="23" width="14.5" height="9.2" rx="3" fill="#0B0E14" stroke={phaseColor} strokeWidth="2" />
                <rect x="35" y="23" width="14.5" height="9.2" rx="3" fill="#0B0E14" stroke={phaseColor} strokeWidth="2" />
                <path d="M29 26.5H35" stroke={phaseColor} strokeWidth="2" strokeLinecap="round" />
                <path d="M17.5 25.5L21 29.2" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M38 25.5L41.5 29.2" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : isSleepPose || isZenPose ? (
              <>
                <path d="M17.5 28.2C19.8 31.2 24.2 31.2 26.5 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M37.5 28.2C39.8 31.2 44.2 31.2 46.5 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
              </>
            ) : isYawnPose ? (
              <>
                <path d="M17.5 27.8H26.5" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="22" cy="29.4" r="1.8" fill="#F4F5F7" />
                <path d="M38 28.4C40 30.8 44 30.8 46 28.4" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : isTeaPose ? (
              <>
                <path d="M18 28.2C19.8 25.2 24.2 25.2 26 28.2" stroke="#F4F5F7" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M38 28.2C39.8 25.2 44.2 25.2 46 28.2" stroke="#F4F5F7" strokeWidth="2.6" strokeLinecap="round" />
              </>
            ) : isStargazePose ? (
              <>
                <circle cx="22" cy="27.2" r="3.4" fill="#F4F5F7" />
                <circle cx="42" cy="27.2" r="3.4" fill="#F4F5F7" />
                <path d="M22 25V27.6M20.7 26.3H23.3" stroke={phaseColor} strokeWidth="1.25" strokeLinecap="round" />
                <path d="M42 25V27.6M40.7 26.3H43.3" stroke={phaseColor} strokeWidth="1.25" strokeLinecap="round" />
              </>
            ) : isCoffeePose ? (
              <>
                <circle cx="22" cy="27.2" r="3.5" fill="#F4F5F7" />
                <circle cx="42" cy="27.2" r="3.5" fill="#F4F5F7" />
                <circle cx="21" cy="25.9" r="1.15" fill={phaseColor} />
                <circle cx="41" cy="25.9" r="1.15" fill={phaseColor} />
                <circle cx="23.4" cy="28.3" r="0.65" fill="#0B0E14" />
                <circle cx="43.4" cy="28.3" r="0.65" fill="#0B0E14" />
              </>
            ) : isCalmEyes || isBlinking ? (
              <>
                <path d="M18 28.2C20 30.8 24 30.8 26 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M38 28.2C40 30.8 44 30.8 46 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="22" cy="27.5" r={visualPose === 'perk' || isStretchPose || isFlexPose ? 3.2 : 2.9} fill="#F4F5F7" />
                <circle cx="42" cy="27.5" r={visualPose === 'perk' || isStretchPose || isFlexPose ? 3.2 : 2.9} fill="#F4F5F7" />
                <circle cx="21" cy="26.3" r="0.95" fill={phaseColor} />
                <circle cx="41" cy="26.3" r="0.95" fill={phaseColor} />
              </>
            )}
          </motion.g>

          {/* Subtle Cheek Warmth */}
          {(isCelebration ||
            isTeaPose ||
            isCoffeePose ||
            isWinkPose ||
            isStretchPose ||
            isZenPose ||
            isMusicPose ||
            visualPose === 'perk') && (
            <>
              <circle cx="16.2" cy="34" r="2.5" fill={phaseColor} fillOpacity="0.22" />
              <circle cx="47.8" cy="34" r="2.5" fill={phaseColor} fillOpacity="0.22" />
            </>
          )}

          {/* Dynamic Mouth Expressions */}
          {isCelebration || isFlexPose ? (
            <path
              d="M22.5 36.5C25.5 42.5 38.5 42.5 41.5 36.5Z"
              fill={phaseColor}
              fillOpacity="0.22"
              stroke={phaseColor}
              strokeWidth="2.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : isYawnPose ? (
            <motion.ellipse
              cx="32"
              cy="39.2"
              rx="3.1"
              ry="4"
              fill={phaseColor}
              fillOpacity="0.18"
              stroke={phaseColor}
              strokeWidth="2.3"
              animate={{ scaleY: [0.85, 1.15, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : isSleepPose ? (
            <motion.circle
              cx="32"
              cy="38.5"
              r="2.1"
              fill={phaseColor}
              fillOpacity="0.2"
              stroke={phaseColor}
              strokeWidth="2.1"
              animate={{ scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : isCuriousPose || isStargazePose ? (
            <circle cx="32" cy="38.5" r="2.4" stroke={phaseColor} strokeWidth="2.4" />
          ) : isFocusedEyes ? (
            <path d="M25.5 38.5H38.5" stroke={phaseColor} strokeWidth="2.6" strokeLinecap="round" />
          ) : isTeaPose || isCoffeePose ? (
            <path d="M24.5 36.5C27.2 39.5 33.2 39.5 36 36.5" stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round" />
          ) : isShadesPose || isWinkPose ? (
            <path d="M24.5 37.5C28.5 40.8 36 40.2 40 36" stroke={phaseColor} strokeWidth="2.7" strokeLinecap="round" />
          ) : isNightChillPose || isZenPose || isCalmEyes ? (
            <path d="M26.5 37.5C29 39.8 35 39.8 37.5 37.5" stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <path d="M23.5 36.5C27 40.8 37 40.8 40.5 36.5" stroke={phaseColor} strokeWidth="2.8" strokeLinecap="round" />
          )}

          {/* Contextual Props */}
          {isCelebration && (
            <motion.path
              d="M11 18L15.5 20.5M53 18L48.5 20.5M32 9V14"
              stroke={phaseColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.65, repeat: Infinity }}
            />
          )}

          {isTeaPose && (
            <g>
              <motion.path
                d="M44.5 35.5C43.5 33.8 45.8 32.5 44.8 30.8"
                stroke={phaseColor}
                strokeWidth="1.6"
                strokeLinecap="round"
                animate={{ y: [1.5, -2.5], opacity: [0.25, 0.95, 0.15] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.path
                d="M49 35.8C48.2 34 50.2 32.6 49.2 31"
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{ y: [1.5, -2.5], opacity: [0.2, 0.85, 0.1] }}
                transition={{ duration: 1.8, delay: 0.55, repeat: Infinity, ease: 'easeInOut' }}
              />
              <rect x="41" y="38.5" width="11" height="9" rx="2.5" fill="#1F2937" stroke={phaseColor} strokeWidth="2" />
              <path d="M52 40.5C54.6 40.5 54.6 45.5 52 45.5" stroke={phaseColor} strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}

          {isCoffeePose && (
            <g>
              <motion.path
                d="M45 35C44 33 46.5 31.8 45.5 29.8"
                stroke="#FBBF24"
                strokeWidth="1.7"
                strokeLinecap="round"
                animate={{ y: [1.5, -2.8], opacity: [0.25, 1, 0.15] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <rect x="40.5" y="38" width="11.5" height="9.5" rx="2.2" fill="#291B12" stroke="#FBBF24" strokeWidth="2" />
              <path d="M52 40.2C54.8 40.2 54.8 45.4 52 45.4" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
              <motion.path
                d="M14 14V18M12 16H16"
                stroke={phaseColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '14px', originY: '16px' }}
              />
            </g>
          )}

          {isWinkPose && (
            <motion.path
              d="M49 14V19M46.5 16.5H51.5"
              stroke={phaseColor}
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.2, 0.85] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '49px', originY: '16.5px' }}
            />
          )}

          {isFlexPose && (
            <motion.path
              d="M48 11L44.5 17.5H48.5L45.5 23.5"
              stroke={phaseColor}
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ opacity: [0.45, 1, 0.45], y: [0, -1.2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {isMusicPose && (
            <motion.g
              animate={{ y: [1.5, -2.5, 1.5], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M48.5 18V11.5L54 10V16.2"
                stroke={phaseColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="47" cy="18.2" r="1.6" fill={phaseColor} />
              <circle cx="52.5" cy="16.5" r="1.6" fill={phaseColor} />
            </motion.g>
          )}

          {isStretchPose && (
            <motion.g
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1.05, 0.96] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '32px', originY: '16px' }}
            >
              <path d="M32 7.5V12.5" stroke={phaseColor} strokeWidth="2.3" strokeLinecap="round" />
              <path d="M21 10.5L24 14.5" stroke={phaseColor} strokeWidth="2.1" strokeLinecap="round" />
              <path d="M43 10.5L40 14.5" stroke={phaseColor} strokeWidth="2.1" strokeLinecap="round" />
            </motion.g>
          )}

          {isHydratePose && (
            <motion.path
              d="M49.5 13C49.5 13 54 18 54 20.6C54 23.1 52 25 49.5 25C47 25 45 23.1 45 20.6C45 18 49.5 13 49.5 13Z"
              fill="#38BDF8"
              fillOpacity="0.88"
              stroke="#BAE6FD"
              strokeWidth="1.4"
              animate={{ y: [0, 2.2, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {isSleepPose && (
            <g>
              <motion.path
                d="M44 17H50L44 23H50"
                stroke={phaseColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ y: [2, -3.5], opacity: [0.3, 1, 0.15] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.path
                d="M51 11H55L51 15H55"
                stroke={phaseColor}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ y: [2, -3.5], opacity: [0.2, 0.9, 0.1] }}
                transition={{ duration: 2.4, delay: 0.7, repeat: Infinity, ease: 'easeInOut' }}
              />
            </g>
          )}

          {(isYawnPose || isNightChillPose || isStargazePose) && (
            <g>
              <path
                d="M48.5 11.5C45.8 12.1 44 14.5 44.3 17.3C44.6 20 47.1 22 49.9 21.8C51.2 21.7 52.4 21.1 53.2 20.2C51.1 20.4 49 18.8 48.7 16.4C48.4 14.6 49.2 12.9 50.5 11.9C49.9 11.5 49.2 11.4 48.5 11.5Z"
                fill={phaseColor}
              />
              <motion.path
                d="M15.5 13V17M13.5 15H17.5"
                stroke={phaseColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '15.5px', originY: '15px' }}
              />
              {isStargazePose && (
                <motion.path
                  d="M27 11.5V14.5M25.5 13H28.5"
                  stroke="#E0E7FF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0.2, 0.95, 0.2] }}
                  transition={{ duration: 2.3, delay: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </g>
          )}

          {isZenPose && (
            <motion.circle
              cx="32"
              cy="14"
              r="3.2"
              stroke={phaseColor}
              strokeWidth="1.7"
              animate={{ scale: [0.88, 1.18, 0.88], opacity: [0.35, 0.95, 0.35] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '32px', originY: '14px' }}
            />
          )}

          {isFocusedEyes && (
            <motion.path
              d="M50 18C50 18 53 21.5 53 23.3C53 24.8 51.7 26 50 26C48.3 26 47 24.8 47 23.3C47 21.5 50 18 50 18Z"
              fill="#38BDF8"
              animate={{ y: [0, 3.5, 0], opacity: [0.95, 0.45, 0.95] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </motion.div>
    </span>
  );
}
