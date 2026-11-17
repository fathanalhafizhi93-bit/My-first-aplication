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
