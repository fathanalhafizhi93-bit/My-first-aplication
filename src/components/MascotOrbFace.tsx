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

  // Existing 15 phase poses + workout moods
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

  // 12 New Expressions (Morning: sunrise, protein, salute, sparkle | Afternoon: beast, sweat, smirk, whistle | Night: cozy, dream, moonlit, recharge)
  const isSunrisePose = visualPose === 'sunrise';
  const isProteinPose = visualPose === 'protein';
  const isSalutePose = visualPose === 'salute';
  const isSparklePose = visualPose === 'sparkle';
  const isBeastPose = visualPose === 'beast';
  const isSweatPose = visualPose === 'sweat';
  const isSmirkPose = visualPose === 'smirk';
  const isWhistlePose = visualPose === 'whistle';
  const isCozyPose = visualPose === 'cozy';
  const isDreamPose = visualPose === 'dream';
  const isMoonlitPose = visualPose === 'moonlit';
  const isRechargePose = visualPose === 'recharge';

  const isClosedCalmPose =
    isSleepPose || isZenPose || isCozyPose || isDreamPose;

  const orbAnimation = tapBounce
    ? { scale: [1, 1.13, 0.95, 1.04, 1], y: [0, -3.5, 0] }
    : isCelebration
      ? { scale: [1, 1.13, 0.95, 1.09, 1], y: [0, -3, 0] }
      : isBeastPose
        ? { scale: [1, 1.08, 0.98, 1.06, 1], y: [0, -2.5, 0], rotate: [0, -2.5, 2.5, 0] }
        : isSleepPose || isDreamPose
          ? { scale: [1, 1.03, 1], y: [0, 1.2, 0] }
          : isZenPose || isCozyPose
            ? { scale: [1, 1.045, 1], y: [0, -1.4, 0] }
            : isMusicPose || isWhistlePose
              ? { y: [0, -2.6, 0, -1.8, 0], rotate: [0, -4, 0, 4, 0] }
              : isProteinPose
                ? { y: [0, -2.8, 0.5, -2.2, 0], rotate: [0, 5, -4, 3, 0] }
                : isFlexPose || isSalutePose
                  ? { scale: [1, 1.06, 0.99, 1.04, 1], y: [0, -2, 0] }
                  : isSparklePose || isSunrisePose
                    ? { scale: [1, 1.055, 1], y: [0, -2.8, 0] }
                    : isWinkPose || isSmirkPose
                      ? { rotate: [0, -4, 2, 0], scale: [1, 1.03, 1] }
                      : isYawnPose
                        ? { scale: [1, 1.045, 0.99, 1], rotate: [0, -3, 2, 0] }
                        : isTeaPose || isCoffeePose
                          ? { y: [0, -1.6, 0], rotate: [0, 2.5, 0, -2, 0] }
                          : isStretchPose
                            ? { y: [0, -3, 0], scale: [1, 1.04, 1] }
                            : isCuriousPose
                              ? { rotate: [0, -7, 4, 0], y: [0, -1.5, 0] }
                              : isSweatPose
                                ? { y: [0, -1.6, 0.8, 0], scale: [1, 1.035, 0.99, 1] }
                                : isStargazePose || isMoonlitPose || isRechargePose
                                  ? { y: [0, -1.8, 0], scale: [1, 1.03, 1] }
                                  : visualPose === 'timerActive'
                                    ? { scale: [1, 1.045, 1] }
                                    : { scale: [1, 1.025, 1] };

  const orbTransition =
    tapBounce || isCelebration
      ? { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const }
      : {
          duration: isClosedCalmPose
            ? 3.8
            : isBeastPose || isProteinPose
              ? 1.65
              : isMusicPose || isWhistlePose
                ? 1.85
                : isFlexPose || isSparklePose
                  ? 2.1
                  : isTeaPose || isCoffeePose || isMoonlitPose
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
            : isBeastPose || isSparklePose
              ? { scale: [0.96, 1.24, 0.96], opacity: [0.58, 0.12, 0.58] }
              : isSleepPose || isDreamPose
                ? { scale: [0.98, 1.1, 0.98], opacity: [0.22, 0.06, 0.22] }
                : isZenPose || isCozyPose || isRechargePose
                  ? { scale: [0.96, 1.22, 0.96], opacity: [0.44, 0.08, 0.44] }
                  : isMusicPose || isFlexPose || isSunrisePose
                    ? { scale: [0.97, 1.2, 0.97], opacity: [0.46, 0.1, 0.46] }
                    : { scale: [0.98, 1.16, 0.98], opacity: [0.36, 0.1, 0.36] }
        }
        transition={{
          duration: isCelebration
            ? 0.85
            : isClosedCalmPose
              ? 3.8
              : isBeastPose || isMusicPose
                ? 1.7
                : 2.7,
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

          {/* Cozy Scarf Trim at Bottom for Cozy Pose */}
          {isCozyPose && (
            <g>
              <path
                d="M13 47.5C20 53 44 53 51 47.5"
                stroke={phaseColor}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
              <path
                d="M19 49.5L22 54.5M42 49.5L45 54.5"
                stroke="#F4F5F7"
                strokeWidth="1.6"
                strokeOpacity="0.45"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Subtle Eyebrows */}
          {isBeastPose ? (
            <>
              <path d="M16.5 20L26.2 24.4" stroke={phaseColor} strokeWidth="2.7" strokeLinecap="round" />
              <path d="M47.5 20L37.8 24.4" stroke={phaseColor} strokeWidth="2.7" strokeLinecap="round" />
            </>
          ) : isFocusedEyes || isFlexPose || isSalutePose ? (
            <>
              <path d="M17.5 21.5L25.5 23.8" stroke="#D1D5DB" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M46.5 21.5L38.5 23.8" stroke="#D1D5DB" strokeWidth="2.3" strokeLinecap="round" />
            </>
          ) : isSmirkPose ? (
            <>
              <path d="M17.5 22.8H25.5" stroke="#D1D5DB" strokeWidth="2.1" strokeLinecap="round" />
              <path d="M38.5 20.6C41 18.2 44.5 18.4 46.8 20.8" stroke="#D1D5DB" strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : isCuriousPose ? (
            <>
              <path d="M18 22.5C20 20.5 23 20.5 25 22.5" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
              <path d="M39 20C41 17.8 44 17.8 46 20" stroke="#D1D5DB" strokeWidth="2.1" strokeLinecap="round" />
            </>
          ) : isWinkPose || isWhistlePose ? (
            <>
              <path d="M18 21.5C20 19.6 23.5 19.6 25.5 21.5" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
              <path d="M39 22.8C41 21.5 44 21.5 46 22.8" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : isYawnPose || isSweatPose ? (
            <>
              <path d="M18 22C20 20.5 23.5 21 25 22.5" stroke="#9CA3AF" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M39 22.5C40.5 21 44 20.5 46 22" stroke="#9CA3AF" strokeWidth="1.9" strokeLinecap="round" />
            </>
          ) : null}

          {/* Animated Glancing Eye Group */}
          <motion.g
            animate={
              isClosedCalmPose || isMusicPose || isSparklePose
                ? { x: 0, y: 0 }
                : { x: glance.x, y: glance.y }
            }
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {isCelebration || isMusicPose || isSunrisePose || isSweatPose ? (
              <>
                <path d="M18 28C19.8 24.4 24.2 24.4 26 28" stroke="#F4F5F7" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M38 28C39.8 24.4 44.2 24.4 46 28" stroke="#F4F5F7" strokeWidth="2.8" strokeLinecap="round" />
              </>
            ) : isSparklePose ? (
              <>
                {/* 4-point star-shaped sparkling eyes */}
                <path
                  d="M22 23.2L23.3 26.2L26.3 27.5L23.3 28.8L22 31.8L20.7 28.8L17.7 27.5L20.7 26.2Z"
                  fill="#F4F5F7"
                />
                <path
                  d="M42 23.2L43.3 26.2L46.3 27.5L43.3 28.8L42 31.8L40.7 28.8L37.7 27.5L40.7 26.2Z"
                  fill="#F4F5F7"
                />
                <circle cx="22" cy="27.5" r="1.1" fill={phaseColor} />
                <circle cx="42" cy="27.5" r="1.1" fill={phaseColor} />
              </>
            ) : isBeastPose ? (
              <>
                <path d="M18 26.5L25.5 29" stroke="#F4F5F7" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="22.5" cy="28.2" r="2.5" fill={phaseColor} />
                <path d="M46 26.5L38.5 29" stroke="#F4F5F7" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="41.5" cy="28.2" r="2.5" fill={phaseColor} />
              </>
            ) : isSmirkPose ? (
              <>
                <path d="M17.5 27.5H26" stroke="#F4F5F7" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="22" cy="28.6" r="1.9" fill="#F4F5F7" />
                <circle cx="42" cy="27.2" r="3.1" fill="#F4F5F7" />
                <circle cx="41" cy="26.2" r="1" fill={phaseColor} />
              </>
            ) : isWinkPose || isWhistlePose ? (
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
            ) : isSleepPose || isZenPose || isCozyPose || isDreamPose ? (
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
            ) : isStargazePose || isMoonlitPose ? (
              <>
                <circle cx="22" cy="27.2" r="3.4" fill="#F4F5F7" />
                <circle cx="42" cy="27.2" r="3.4" fill="#F4F5F7" />
                <path d="M22 25V27.6M20.7 26.3H23.3" stroke={phaseColor} strokeWidth="1.25" strokeLinecap="round" />
                <path d="M42 25V27.6M40.7 26.3H43.3" stroke={phaseColor} strokeWidth="1.25" strokeLinecap="round" />
              </>
            ) : isCoffeePose || isProteinPose ? (
              <>
                <circle cx="22" cy="27.2" r="3.5" fill="#F4F5F7" />
                <circle cx="42" cy="27.2" r="3.5" fill="#F4F5F7" />
                <circle cx="21" cy="25.9" r="1.15" fill={phaseColor} />
                <circle cx="41" cy="25.9" r="1.15" fill={phaseColor} />
                <circle cx="23.4" cy="28.3" r="0.65" fill="#0B0E14" />
                <circle cx="43.4" cy="28.3" r="0.65" fill="#0B0E14" />
              </>
            ) : isCalmEyes || isRechargePose || isBlinking ? (
              <>
                <path d="M18 28.2C20 30.8 24 30.8 26 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M38 28.2C40 30.8 44 30.8 46 28.2" stroke="#D1D5DB" strokeWidth="2.6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle
                  cx="22"
                  cy="27.5"
                  r={visualPose === 'perk' || isStretchPose || isFlexPose || isSalutePose ? 3.2 : 2.9}
                  fill="#F4F5F7"
                />
                <circle
                  cx="42"
                  cy="27.5"
                  r={visualPose === 'perk' || isStretchPose || isFlexPose || isSalutePose ? 3.2 : 2.9}
                  fill="#F4F5F7"
                />
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
            isSunrisePose ||
            isSparklePose ||
            isCozyPose ||
            isDreamPose ||
            isSweatPose ||
            visualPose === 'perk') && (
            <>
              <circle
                cx="16.2"
                cy="34"
                r={isCozyPose || isSparklePose ? 2.9 : 2.5}
                fill={phaseColor}
                fillOpacity={isCozyPose ? 0.34 : 0.22}
              />
              <circle
                cx="47.8"
                cy="34"
                r={isCozyPose || isSparklePose ? 2.9 : 2.5}
                fill={phaseColor}
                fillOpacity={isCozyPose ? 0.34 : 0.22}
              />
            </>
          )}

          {/* Dynamic Mouth Expressions */}
          {isCelebration || isFlexPose || isBeastPose || isSparklePose ? (
            <path
              d="M22.5 36.5C25.5 42.5 38.5 42.5 41.5 36.5Z"
              fill={phaseColor}
              fillOpacity="0.22"
              stroke={phaseColor}
              strokeWidth="2.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : isWhistlePose ? (
            <motion.circle
              cx="34"
              cy="38.2"
              r="2.4"
              fill={phaseColor}
              fillOpacity="0.2"
              stroke={phaseColor}
              strokeWidth="2.3"
              animate={{ scale: [0.92, 1.15, 0.92] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : isSmirkPose ? (
            <path
              d="M25 38.6C29.5 40 35.8 39 40.5 35.4"
              stroke={phaseColor}
              strokeWidth="2.6"
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
          ) : isTeaPose || isCoffeePose || isProteinPose ? (
            <path d="M24.5 36.5C27.2 39.5 33.2 39.5 36 36.5" stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round" />
          ) : isShadesPose || isWinkPose || isSalutePose ? (
            <path d="M24.5 37.5C28.5 40.8 36 40.2 40 36" stroke={phaseColor} strokeWidth="2.7" strokeLinecap="round" />
          ) : isNightChillPose || isZenPose || isCalmEyes || isCozyPose || isDreamPose || isMoonlitPose || isRechargePose ? (
            <path d="M26.5 37.5C29 39.8 35 39.8 37.5 37.5" stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <path d="M23.5 36.5C27 40.8 37 40.8 40.5 36.5" stroke={phaseColor} strokeWidth="2.8" strokeLinecap="round" />
          )}

          {/* ═══ CONTEXTUAL ANIMATED PROPS ═══ */}

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

          {/* NEW: Sunrise rising sun rays */}
          {isSunrisePose && (
            <motion.g
              animate={{ opacity: [0.55, 1, 0.55], y: [1.2, -1, 1.2] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M24 16.5C25.5 12.2 38.5 12.2 40 16.5" fill="#FBBF24" fillOpacity="0.35" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M32 8V10.8M22 11L24 13M42 11L40 13" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
            </motion.g>
          )}

          {/* NEW: Protein shaker bottle */}
          {isProteinPose && (
            <motion.g
              animate={{ rotate: [-6, 8, -5, 0], y: [0, -1.5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '47px', originY: '43px' }}
            >
              <rect x="42.5" y="36.5" width="9" height="12" rx="2.2" fill="#18202C" stroke={phaseColor} strokeWidth="1.9" />
              <path d="M41.5 36.5H52.5" stroke="#F4F5F7" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M45 34H49" stroke={phaseColor} strokeWidth="2" strokeLinecap="round" />
              <path d="M44.5 42.5H49.5" stroke={phaseColor} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
            </motion.g>
          )}

          {/* NEW: Salute precision chevron badge */}
          {isSalutePose && (
            <motion.g
              animate={{ y: [0.5, -1.8, 0.5], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M44 15.5L48.5 11.5L53 15.5" stroke={phaseColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M44 20L48.5 16L53 20" stroke={phaseColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" />
            </motion.g>
          )}

          {/* NEW: Sparkle floating mini stars */}
          {isSparklePose && (
            <g>
              <motion.path
                d="M14 13V18M11.5 15.5H16.5"
                stroke={phaseColor}
                strokeWidth="1.9"
                strokeLinecap="round"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '14px', originY: '15.5px' }}
              />
              <motion.path
                d="M50 13.5V18.5M47.5 16H52.5"
                stroke="#FDE68A"
                strokeWidth="1.9"
                strokeLinecap="round"
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.25, 0.85] }}
                transition={{ duration: 1.3, delay: 0.45, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '50px', originY: '16px' }}
              />
            </g>
          )}

          {/* NEW: Beast mode flickering flame crest */}
          {isBeastPose && (
            <motion.path
              d="M32 7.5C34.8 11 36.2 13.2 35.4 15.8C34.8 17.5 33.4 18.4 32 18.4C30.6 18.4 29.2 17.5 28.6 15.8C27.8 13.2 29.2 11 32 7.5Z"
              fill={phaseColor}
              fillOpacity="0.88"
              stroke="#FDE68A"
              strokeWidth="1.2"
              animate={{ scaleY: [0.9, 1.18, 0.94], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '32px', originY: '18px' }}
            />
          )}

          {/* NEW: Sweat drop on temple */}
          {isSweatPose && (
            <motion.path
              d="M50.5 14C50.5 14 54 18.2 54 20.4C54 22.4 52.4 24 50.5 24C48.6 24 47 22.4 47 20.4C47 18.2 50.5 14 50.5 14Z"
              fill="#38BDF8"
              fillOpacity="0.92"
              stroke="#E0F2FE"
              strokeWidth="1.2"
              animate={{ y: [-1, 3.2, -1], opacity: [0.95, 0.55, 0.95] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* NEW: Smirk subtle shine glint */}
          {isSmirkPose && (
            <motion.path
              d="M48 13L50 17L54 19L50 21L48 25L46 21L42 19L46 17Z"
              fill={phaseColor}
              fillOpacity="0.85"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.82, 1.12, 0.82] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '48px', originY: '19px' }}
            />
          )}

          {/* NEW: Whistle drifting mini note */}
          {isWhistlePose && (
            <motion.g
              animate={{ x: [0, 3.5], y: [1, -4], opacity: [0.25, 1, 0.15] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            >
              <path
                d="M46.5 34.5V27.5L51.5 26"
                stroke={phaseColor}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="45" cy="34.8" r="1.7" fill={phaseColor} />
            </motion.g>
          )}

          {/* NEW: Dream floating mini cloud & star */}
          {isDreamPose && (
            <motion.g
              animate={{ y: [1.2, -2.2, 1.2], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <circle cx="43.5" cy="21" r="1.3" fill={phaseColor} fillOpacity="0.7" />
              <path
                d="M45 16.5C43.6 16.5 42.5 15.4 42.5 14C42.5 12.7 43.5 11.7 44.7 11.6C45.3 10.2 46.7 9.3 48.3 9.3C50.4 9.3 52 10.9 52.1 12.9C53.3 13.1 54.2 14.1 54.2 15.3C54.2 16.6 53.1 17.5 51.8 17.5H45.2Z"
                fill="#1E293B"
                stroke={phaseColor}
                strokeWidth="1.6"
              />
            </motion.g>
          )}

          {/* NEW: Moonlit glowing crescent halo */}
          {isMoonlitPose && (
            <motion.g
              animate={{ opacity: [0.65, 1, 0.65], rotate: [-4, 4, -4] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '32px', originY: '13px' }}
            >
              <path
                d="M31.5 8.5C28.8 9.1 27 11.4 27.3 14.1C27.6 16.7 30 18.6 32.7 18.4C34 18.3 35.1 17.7 35.9 16.8C33.9 17 31.9 15.5 31.6 13.2C31.3 11.5 32.1 9.9 33.4 8.9C32.8 8.5 32.1 8.4 31.5 8.5Z"
                fill="#E0E7FF"
              />
              <circle cx="42" cy="13" r="1.2" fill={phaseColor} />
              <circle cx="21" cy="14" r="1.1" fill={phaseColor} />
            </motion.g>
          )}

          {/* NEW: Recharge pulsing mini battery / bolt recovery indicator */}
          {isRechargePose && (
            <motion.g
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
            >
              <rect x="25" y="10" width="13" height="6.8" rx="1.8" stroke={phaseColor} strokeWidth="1.6" />
              <path d="M39.5 12V14.8" stroke={phaseColor} strokeWidth="1.8" strokeLinecap="round" />
              <motion.rect
                x="27"
                y="11.8"
                width="9"
                height="3.2"
                rx="0.8"
                fill={phaseColor}
                animate={{ scaleX: [0.35, 1, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '27px', originY: '13.4px' }}
              />
            </motion.g>
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
