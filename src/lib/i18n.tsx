import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { DayKey, MuscleGroup } from '../types/gym';

export type AppLanguage = 'id' | 'en';
export type ClockFormat = '12h' | '24h';
export type DayTimeMode = 'auto' | 'morning' | 'afternoon' | 'night';
export type DayTimePhase = 'morning' | 'afternoon' | 'night';
export type UiTheme = 'obsidian' | 'midnight-frosted' | 'carbon-forge';

export const DEFAULT_ACCENT_COLOR = '#C8FF2E';
export const DEFAULT_MATERIAL_TINT_BY_THEME: Record<UiTheme, string> = {
  obsidian: '#161A23',
  'midnight-frosted': '#162238',
  'carbon-forge': '#12151B',
};

export interface ColorPresetOption {
  id: string;
  hex: string;
  labelId: string;
  labelEn: string;
}

export const ACCENT_COLOR_PRESETS: ColorPresetOption[] = [
  { id: 'lime', hex: '#C8FF2E', labelId: 'Hijau Limau', labelEn: 'IronPulse Lime' },
  { id: 'cyan', hex: '#38BDF8', labelId: 'Biru Cyan', labelEn: 'Electric Cyan' },
  { id: 'violet', hex: '#A78BFA', labelId: 'Ungu Violet', labelEn: 'Royal Violet' },
  { id: 'crimson', hex: '#FB7185', labelId: 'Merah Pulse', labelEn: 'Crimson Pulse' },
  { id: 'amber', hex: '#FBBF24', labelId: 'Emas Amber', labelEn: 'Solar Amber' },
  { id: 'emerald', hex: '#34D399', labelId: 'Hijau Mint', labelEn: 'Emerald Mint' },
];

export const MATERIAL_TINT_PRESETS: ColorPresetOption[] = [
  { id: 'slate', hex: '#161A23', labelId: 'Obsidian Slate', labelEn: 'Obsidian Slate' },
  { id: 'gunmetal', hex: '#12151B', labelId: 'Carbon Gunmetal', labelEn: 'Carbon Gunmetal' },
  { id: 'sapphire', hex: '#162238', labelId: 'Midnight Sapphire', labelEn: 'Midnight Sapphire' },
  { id: 'violet', hex: '#23163D', labelId: 'Deep Violet', labelEn: 'Deep Violet' },
  { id: 'emerald', hex: '#112922', labelId: 'Smoked Emerald', labelEn: 'Smoked Emerald' },
  { id: 'graphite', hex: '#25201D', labelId: 'Warm Graphite', labelEn: 'Warm Graphite' },
  { id: 'crystal', hex: '#2C364A', labelId: 'Crystal Frost', labelEn: 'Crystal Frost' },
];

const LANG_STORAGE_KEY = 'ironpulse_lang';
const CLOCK_FORMAT_STORAGE_KEY = 'ironpulse_clock_format';
const TIME_THEME_STORAGE_KEY = 'ironpulse_today_theme_mode';
const UI_THEME_STORAGE_KEY = 'ironpulse_ui_theme';
const ACCENT_COLOR_STORAGE_KEY = 'ironpulse_accent_color';
const MATERIAL_TINT_STORAGE_KEY = 'ironpulse_material_tint';

function normalizeHex(hex: string, fallback: string): string {
  const cleaned = (hex || '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  return fallback;
}

export function hexToRgbTuple(hex: string, fallback = '200, 255, 46'): string {
  const valid = normalizeHex(hex, '');
  if (!valid) return fallback;
  const r = parseInt(valid.slice(1, 3), 16);
  const g = parseInt(valid.slice(3, 5), 16);
  const b = parseInt(valid.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export function computeContrastForeground(hex: string): string {
  const valid = normalizeHex(hex, DEFAULT_ACCENT_COLOR);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(parseInt(valid.slice(1, 3), 16));
  const g = toLinear(parseInt(valid.slice(3, 5), 16));
  const b = toLinear(parseInt(valid.slice(5, 7), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.34 ? '#0A0B0E' : '#FFFFFF';
}

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

export function getStoredUiTheme(): UiTheme {
  try {
    const val = localStorage.getItem(UI_THEME_STORAGE_KEY);
    if (val === 'midnight-frosted') return 'midnight-frosted';
    if (val === 'carbon-forge') return 'carbon-forge';
    return 'obsidian';
  } catch {
    return 'obsidian';
  }
}

export function getStoredAccentColor(): string {
  try {
    const val = localStorage.getItem(ACCENT_COLOR_STORAGE_KEY);
    return val ? normalizeHex(val, DEFAULT_ACCENT_COLOR) : DEFAULT_ACCENT_COLOR;
  } catch {
    return DEFAULT_ACCENT_COLOR;
  }
}

export function getStoredMaterialTintColor(): string | null {
  try {
    const val = localStorage.getItem(MATERIAL_TINT_STORAGE_KEY);
    return val && /^#[0-9A-Fa-f]{6}$/.test(val) ? val.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function applyThemeTokensToDocument(
  uiTheme: UiTheme,
  accentColor: string,
  materialTintColor: string | null
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolvedAccent = normalizeHex(accentColor, DEFAULT_ACCENT_COLOR);
  const resolvedMaterial = normalizeHex(
    materialTintColor || DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme],
    DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme]
  );

  root.dataset.uiTheme = uiTheme;
  root.style.setProperty('--ip-accent', resolvedAccent);
  root.style.setProperty('--ip-accent-fg', computeContrastForeground(resolvedAccent));
  root.style.setProperty('--ip-accent-rgb', hexToRgbTuple(resolvedAccent, '200, 255, 46'));
  root.style.setProperty('--ip-glass-rgb', hexToRgbTuple(resolvedMaterial, '22, 26, 35'));
  const canvasBg =
    uiTheme === 'midnight-frosted'
      ? '#05070C'
      : uiTheme === 'carbon-forge'
        ? '#07080A'
        : '#0A0B0E';
  root.style.setProperty('--ip-canvas-bg', canvasBg);
}

// Synchronously apply stored visual tokens before initial React render to prevent theme flash
if (typeof document !== 'undefined') {
  applyThemeTokensToDocument(
    getStoredUiTheme(),
    getStoredAccentColor(),
    getStoredMaterialTintColor()
  );
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
  uiTheme: UiTheme;
  setUiTheme: (theme: UiTheme) => void;
  accentColor: string;
  setAccentColor: (hex: string) => void;
  materialTintColor: string | null;
  effectiveMaterialTint: string;
  setMaterialTintColor: (hex: string | null) => void;
  resetThemeCustomization: () => void;
  t: <T>(idText: T, enText: T) => T;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'id',
  setLang: () => {},
  clockFormat: '24h',
  setClockFormat: () => {},
  todayThemeMode: 'auto',
  setTodayThemeMode: () => {},
  uiTheme: 'obsidian',
  setUiTheme: () => {},
  accentColor: DEFAULT_ACCENT_COLOR,
  setAccentColor: () => {},
  materialTintColor: null,
  effectiveMaterialTint: DEFAULT_MATERIAL_TINT_BY_THEME.obsidian,
  setMaterialTintColor: () => {},
  resetThemeCustomization: () => {},
  t: (idText) => idText,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(getStoredLanguage);
  const [clockFormat, setClockFormatState] = useState<ClockFormat>(getStoredClockFormat);
  const [todayThemeMode, setTodayThemeModeState] = useState<DayTimeMode>(getStoredDayTimeMode);
  const [uiTheme, setUiThemeState] = useState<UiTheme>(getStoredUiTheme);
  const [accentColor, setAccentColorState] = useState<string>(getStoredAccentColor);
  const [materialTintColor, setMaterialTintColorState] = useState<string | null>(
    getStoredMaterialTintColor
  );

  const effectiveMaterialTint =
    materialTintColor || DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme];

  useEffect(() => {
    applyThemeTokensToDocument(uiTheme, accentColor, materialTintColor);
  }, [uiTheme, accentColor, materialTintColor]);

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

  const setUiTheme = useCallback((next: UiTheme) => {
    setUiThemeState(next);
    try {
      localStorage.setItem(UI_THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setAccentColor = useCallback((next: string) => {
    const normalized = normalizeHex(next, DEFAULT_ACCENT_COLOR);
    setAccentColorState(normalized);
    try {
      localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setMaterialTintColor = useCallback((next: string | null) => {
    if (next === null) {
      setMaterialTintColorState(null);
      try {
        localStorage.removeItem(MATERIAL_TINT_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      return;
    }
    const normalized = normalizeHex(next, DEFAULT_MATERIAL_TINT_BY_THEME.obsidian);
    setMaterialTintColorState(normalized);
    try {
      localStorage.setItem(MATERIAL_TINT_STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }
  }, []);

  const resetThemeCustomization = useCallback(() => {
    setAccentColor(DEFAULT_ACCENT_COLOR);
    setMaterialTintColor(null);
  }, [setAccentColor, setMaterialTintColor]);

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
        uiTheme,
        setUiTheme,
        accentColor,
        setAccentColor,
        materialTintColor,
        effectiveMaterialTint,
        setMaterialTintColor,
        resetThemeCustomization,
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
