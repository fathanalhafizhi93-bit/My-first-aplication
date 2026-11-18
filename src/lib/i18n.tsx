import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { DayKey, MuscleGroup } from '../types/gym';

export type AppLanguage = 'id' | 'en';
export type ClockFormat = '12h' | '24h';
export type DayTimeMode = 'auto' | 'morning' | 'afternoon' | 'night';
export type DayTimePhase = 'morning' | 'afternoon' | 'night';

const LANG_STORAGE_KEY = 'ironpulse_lang';
const CLOCK_FORMAT_STORAGE_KEY = 'ironpulse_clock_format';
const TIME_THEME_STORAGE_KEY = 'ironpulse_today_theme_mode';

export function getStoredLanguage(): AppLanguage {
  try {
    const val = localStorage.getItem(LANG_STORAGE_KEY);
    return val === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

export function getStoredClockFormat(): ClockFormat {
  try {
    const val = localStorage.getItem(CLOCK_FORMAT_STORAGE_KEY);
    return val === '12h' ? '12h' : '24h';
  } catch {
    return '24h';
  }
}

export function getStoredDayTimeMode(): DayTimeMode {
  try {
    const val = localStorage.getItem(TIME_THEME_STORAGE_KEY);
    if (val === 'morning' || val === 'afternoon' || val === 'night' || val === 'auto') {
      return val;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

export function saveStoredDayTimeMode(mode: DayTimeMode): void {
  try {
    localStorage.setItem(TIME_THEME_STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}

export function resolveDayTimePhase(mode: DayTimeMode, now: Date = new Date()): DayTimePhase {
  if (mode !== 'auto') return mode;
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'afternoon';
  return 'night';
}

export const PHASE_THEME_TOKENS: Record<
  DayTimePhase,
  {
    accent: string;
    accentBright: string;
    ambientGlow: string;
    heroGradient: string;
    heroBorder: string;
    subtleBorder: string;
    emblemClass: string;
    labelClass: string;
    headerTint: string;
  }
> = {
  morning: {
    accent: '#F59E0B',
    accentBright: '#FBBF24',
    ambientGlow:
      'radial-gradient(ellipse 85% 58% at 50% -10%, rgba(245, 158, 11, 0.24), rgba(245, 158, 11, 0.06) 48%, transparent 78%)',
    heroGradient: 'from-[#422709]/60 via-[#1D150C]/55 to-[#0C0E14]/65',
    heroBorder: 'border-[#F59E0B]/35',
    subtleBorder: 'border-[#F59E0B]/25',
    emblemClass: 'border-[#F59E0B]/45 bg-[#F59E0B]/18 text-[#FBBF24]',
    labelClass: 'text-[#FBBF24]',
    headerTint: 'border-[#F59E0B]/20',
  },
  afternoon: {
    accent: '#38BDF8',
    accentBright: '#7DD3FC',
    ambientGlow:
      'radial-gradient(ellipse 85% 58% at 50% -10%, rgba(56, 189, 248, 0.22), rgba(14, 165, 233, 0.06) 48%, transparent 78%)',
    heroGradient: 'from-[#0D2E4D]/60 via-[#101C2B]/55 to-[#0C0E14]/65',
    heroBorder: 'border-[#38BDF8]/35',
    subtleBorder: 'border-[#38BDF8]/25',
    emblemClass: 'border-[#38BDF8]/45 bg-[#38BDF8]/18 text-[#7DD3FC]',
    labelClass: 'text-[#7DD3FC]',
    headerTint: 'border-[#38BDF8]/20',
  },
  night: {
    accent: '#818CF8',
    accentBright: '#A5B4FC',
    ambientGlow:
      'radial-gradient(ellipse 85% 58% at 50% -10%, rgba(129, 140, 248, 0.25), rgba(99, 102, 241, 0.07) 48%, transparent 78%)',
    heroGradient: 'from-[#231C52]/62 via-[#14162A]/55 to-[#0C0E14]/65',
    heroBorder: 'border-[#818CF8]/35',
    subtleBorder: 'border-[#818CF8]/25',
    emblemClass: 'border-[#818CF8]/45 bg-[#818CF8]/18 text-[#A5B4FC]',
    labelClass: 'text-[#A5B4FC]',
    headerTint: 'border-[#818CF8]/20',
  },
};

export const DAY_LABELS: Record<AppLanguage, Record<DayKey, { label: string; shortLabel: string }>> = {
  id: {
    mon: { label: 'Senin', shortLabel: 'SEN' },
    tue: { label: 'Selasa', shortLabel: 'SEL' },
    wed: { label: 'Rabu', shortLabel: 'RAB' },
    thu: { label: 'Kamis', shortLabel: 'KAM' },
    fri: { label: 'Jumat', shortLabel: 'JUM' },
    sat: { label: 'Sabtu', shortLabel: 'SAB' },
    sun: { label: 'Minggu', shortLabel: 'MIN' },
  },
  en: {
    mon: { label: 'Monday', shortLabel: 'MON' },
    tue: { label: 'Tuesday', shortLabel: 'TUE' },
    wed: { label: 'Wednesday', shortLabel: 'WED' },
    thu: { label: 'Thursday', shortLabel: 'THU' },
    fri: { label: 'Friday', shortLabel: 'FRI' },
    sat: { label: 'Saturday', shortLabel: 'SAT' },
    sun: { label: 'Sunday', shortLabel: 'SUN' },
  },
};

export const MUSCLE_LABELS: Record<AppLanguage, Record<MuscleGroup, string>> = {
  id: {
    Dada: 'Dada',
    Punggung: 'Punggung',
    Bahu: 'Bahu',
    Kaki: 'Kaki',
    Lengan: 'Lengan',
    Core: 'Core',
    Kardio: 'Kardio',
  },
  en: {
    Dada: 'Chest',
    Punggung: 'Back',
    Bahu: 'Shoulders',
    Kaki: 'Legs',
    Lengan: 'Arms',
    Core: 'Core',
    Kardio: 'Cardio',
  },
};

interface I18nContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  clockFormat: ClockFormat;
  setClockFormat: (format: ClockFormat) => void;
  todayThemeMode: DayTimeMode;
  setTodayThemeMode: (mode: DayTimeMode) => void;
  t: <T>(idText: T, enText: T) => T;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'id',
  setLang: () => {},
  clockFormat: '24h',
  setClockFormat: () => {},
  todayThemeMode: 'auto',
  setTodayThemeMode: () => {},
  t: (idText) => idText,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(getStoredLanguage);
  const [clockFormat, setClockFormatState] = useState<ClockFormat>(getStoredClockFormat);
  const [todayThemeMode, setTodayThemeModeState] = useState<DayTimeMode>(getStoredDayTimeMode);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setClockFormat = useCallback((next: ClockFormat) => {
    setClockFormatState(next);
    try {
      localStorage.setItem(CLOCK_FORMAT_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setTodayThemeMode = useCallback((next: DayTimeMode) => {
    setTodayThemeModeState(next);
    saveStoredDayTimeMode(next);
  }, []);

  const t = useCallback(
    <T,>(idText: T, enText: T): T => (lang === 'en' ? enText : idText),
    [lang]
  );

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        clockFormat,
        setClockFormat,
        todayThemeMode,
        setTodayThemeMode,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
