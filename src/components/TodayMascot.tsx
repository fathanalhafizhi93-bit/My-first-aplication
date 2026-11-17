import { motion } from 'motion/react';
import { DayTimePhase, useI18n } from '../lib/i18n';

export type MascotMood =
  | 'welcome'
  | 'clap'
  | 'celebrate'
  | 'rest'
  | 'restday'
  | 'ready';

interface TodayMascotProps {
  mood: MascotMood;
  timePhase: DayTimePhase;
  cooldownRemaining: number;
  dayLabel: string;
  dayJustChanged?: boolean;
}

const PHASE_ACCENT: Record<DayTimePhase, string> = {
  morning: '#F59E0B',
  afternoon: '#38BDF8',
  night: '#818CF8',
};

export function TodayMascot({
  mood,
  timePhase,
  cooldownRemaining,
  dayLabel,
  dayJustChanged = false,
}: TodayMascotProps) {
  const { lang, t } = useI18n();

  const phaseColor =
    mood === 'celebrate' || mood === 'clap'
      ? '#C8FF2E'
      : mood === 'rest'
        ? '#38BDF8'
        : PHASE_ACCENT[timePhase];

  const greetingByPhase =
    timePhase === 'morning'
      ? t('Selamat Pagi!', 'Good Morning!')
      : timePhase === 'afternoon'
        ? t('Selamat Siang!', 'Good Afternoon!')
        : t('Selamat Malam!', 'Good Evening!');

  const getMessage = (): { headline: string; subline: string } => {
    switch (mood) {
      case 'clap':
        return {
          headline: t('Mantap! Tepuk tangan!', 'Nice! Clap it up!'),
          subline: t(
            'Satu set selesai! Tarik napas dulu sebelum set berikutnya.',
            'Set logged! Catch your breath before the next set.'
          ),
        };
      case 'celebrate':
        return {
          headline: t('Sesi Hari Ini Tuntas!', 'Session Complete!'),
          subline: t(
            'Semua target set selesai dikerjakan. Kerja keras yang luar biasa!',
            'Every target set is complete. Outstanding work today!'
          ),
        };
      case 'rest':
        return {
          headline:
            cooldownRemaining > 0
              ? t(`Istirahat dulu (${cooldownRemaining}d)`, `Rest up (${cooldownRemaining}s)`)
              : t('Mode Istirahat Aktif', 'Rest Timer Running'),
          subline: t(
            'Biarkan otot pulih sejenak agar set berikutnya tetap kuat.',
            'Let your muscles recover briefly so your next set stays strong.'
          ),
        };
      case 'restday':
        return {
          headline: `${greetingByPhase} ${t('Hari Istirahat', 'Rest Day')}`,
          subline: t(
            'Waktunya pemulihan, tidur cukup, dan hidrasi yang baik.',
            'Focus on recovery, quality sleep, and staying hydrated.'
          ),
        };
      case 'welcome':
        return {
          headline: dayJustChanged
            ? t(`Hari Baru: ${dayLabel}!`, `New Day: ${dayLabel}!`)
            : `${greetingByPhase} ${t('Ayo Mulai!', "Let's Go!")}`,
          subline: t(
            `Selamat datang di jadwal ${dayLabel}. Siap angkat set pertama?`,
            `Welcome to ${dayLabel}'s session. Ready for your first set?`
          ),
        };
      case 'ready':
      default:
        return {
          headline: `${greetingByPhase} ${t('Tetap Fokus', 'Stay Locked In')}`,
          subline: t(
            'Isi beban & repetisi lalu centang setiap set yang selesai.',
            'Enter weight & reps, then check off each completed set.'
          ),
        };
    }
  };

  const { headline, subline } = getMessage();

  const orbAnimation =
    mood === 'clap' || mood === 'celebrate'
      ? { scale: [1, 1.12, 0.96, 1.08, 1] }
      : mood === 'welcome'
        ? { y: [0, -4, 0] }
        : mood === 'rest'
          ? { scale: [1, 1.04, 1] }
          : { scale: [1, 1.02, 1] };

  const orbTransition =
    mood === 'clap' || mood === 'celebrate'
      ? { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }
      : {
          duration: mood === 'rest' ? 3.2 : 2.6,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        };

  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-[#0A0B0E]/75 px-3.5 py-2.5 backdrop-blur-sm">
      {/* Minimalist Circular Animated Mascot */}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        {/* Outer Pulse Ring */}
        <motion.span
          aria-hidden="true"
          animate={
            mood === 'clap' || mood === 'celebrate'
              ? { scale: [0.95, 1.35], opacity: [0.65, 0] }
              : { scale: [0.98, 1.18, 0.98], opacity: [0.35, 0.08, 0.35] }
          }
          transition={{
            duration: mood === 'clap' || mood === 'celebrate' ? 0.85 : 2.8,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: phaseColor }}
        />

        {/* Core Circle Body */}
        <motion.div
          animate={orbAnimation}
          transition={orbTransition}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[#13161C]"
          style={{ borderColor: phaseColor }}
          aria-label={lang === 'en' ? 'IronPulse workout companion' : 'Maskot latihan IronPulse'}
        >
          {/* Minimalist SVG Face & Reaction */}
          <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" aria-hidden="true">
            {mood === 'clap' || mood === 'celebrate' ? (
              <>
                {/* Happy "^ ^" Eyes */}
                <path
                  d="M14 20C15.2 17.5 17.8 17.5 19 20"
                  stroke="#F4F5F7"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M29 20C30.2 17.5 32.8 17.5 34 20"
                  stroke="#F4F5F7"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {/* Big Cheerful Smile */}
                <path
                  d="M17 26C19.5 30 28.5 30 31 26"
                  stroke={phaseColor}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                {/* Clapping Accent Sparks */}
                <motion.path
                  d="M8 14L12 16M40 14L36 16M24 7V11"
                  stroke={phaseColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </>
            ) : mood === 'rest' || mood === 'restday' ? (
              <>
                {/* Calm Closed / Relaxed Eyes */}
                <path
                  d="M14 21C15.5 22.8 18 22.8 19.5 21"
                  stroke="#D1D5DB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M28.5 21C30 22.8 32.5 22.8 34 21"
                  stroke="#D1D5DB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Calm Breath Smile */}
                <path
                  d="M20 28H28"
                  stroke={phaseColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </>
            ) : mood === 'welcome' ? (
              <>
                {/* Bright Welcoming Eyes */}
                <circle cx="17.5" cy="20" r="2.3" fill="#F4F5F7" />
                <circle cx="30.5" cy="20" r="2.3" fill="#F4F5F7" />
                {/* Warm Greeting Smile */}
                <path
                  d="M18 27C20.5 29.8 27.5 29.8 30 27"
                  stroke={phaseColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Greeting Wave Arc */}
                <motion.path
                  d="M36 11C38.5 13 39.5 15.5 39 18"
                  stroke={phaseColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{ rotate: [0, 12, -8, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ originX: '36px', originY: '15px' }}
                />
              </>
            ) : (
              <>
                {/* Focused Ready Eyes */}
                <circle cx="17.5" cy="20" r="2.2" fill="#F4F5F7" />
                <circle cx="30.5" cy="20" r="2.2" fill="#F4F5F7" />
                {/* Confident Pulse Line Mouth */}
                <path
                  d="M18 27.5H21.5L23.5 24.5L25.5 30L27 27.5H30"
                  stroke={phaseColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </svg>
        </motion.div>
      </div>

      {/* Speech Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold" style={{ color: phaseColor }}>
          {headline}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-[#D1D5DB]">{subline}</p>
      </div>
    </div>
  );
}
