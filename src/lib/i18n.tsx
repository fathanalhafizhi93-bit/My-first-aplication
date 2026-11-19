import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DayKey, MuscleGroup } from '../types/gym';
import { getStoredHapticsEnabled, setHapticsEnabledPref } from './haptics';
import { generateMaterialYouPalette, MaterialYouPalette } from './materialYouPalette';

export type AppLanguage = 'id' | 'en';
export type ClockFormat = '12h' | '24h';
export type DayTimeMode = 'auto' | 'morning' | 'afternoon' | 'night';
export type DayTimePhase = 'morning' | 'afternoon' | 'night';
export type UiTheme =
  | 'obsidian'
  | 'midnight-frosted'
  | 'carbon-forge'
  | 'material-you'
  | 'aeroglass'
  | 'ubuntu-yaru';

export const DEFAULT_ACCENT_COLOR = '#C8FF2E';
export const YARU_ORANGE_ACCENT = '#E95420';
export const DEFAULT_MATERIAL_TINT_BY_THEME: Record<UiTheme, string> = {
  obsidian: '#161A23',
  'midnight-frosted': '#162238',
  'carbon-forge': '#12151B',
  'material-you': '#1C1B22',
  aeroglass: '#1B334B',
  'ubuntu-yaru': '#2C2C2C',
};

export interface ColorPresetOption {
  id: string;
  hex: string;
  labelId: string;
  labelEn: string;
}

export const ACCENT_COLOR_PRESETS: ColorPresetOption[] = [
  { id: 'lime', hex: '#C8FF2E', labelId: 'Hijau Limau', labelEn: 'IronPulse Lime' },
  { id: 'cyan', hex: '#38BDF8', labelId: 'Biru Pixel', labelEn: 'Pixel Sky' },
  { id: 'violet', hex: '#B69DF8', labelId: 'Lavender M3', labelEn: 'Material Lavender' },
  { id: 'crimson', hex: '#FB7185', labelId: 'Merah Rose', labelEn: 'Crimson Rose' },
  { id: 'amber', hex: '#FBBF24', labelId: 'Emas Amber', labelEn: 'Solar Amber' },
  { id: 'emerald', hex: '#34D399', labelId: 'Hijau Sage', labelEn: 'Forest Sage' },
  { id: 'teal', hex: '#2DD4BF', labelId: 'Teal Samudra', labelEn: 'Ocean Teal' },
  { id: 'coral', hex: '#FB923C', labelId: 'Terakota', labelEn: 'Terracotta Clay' },
  { id: 'yaru-orange', hex: '#E95420', labelId: 'Oranye Yaru', labelEn: 'Yaru Orange' },
];

export const MATERIAL_TINT_PRESETS: ColorPresetOption[] = [
  { id: 'slate', hex: '#161A23', labelId: 'Obsidian Slate', labelEn: 'Obsidian Slate' },
  { id: 'gunmetal', hex: '#12151B', labelId: 'Carbon Gunmetal', labelEn: 'Carbon Gunmetal' },
  { id: 'yaru-dark', hex: '#2C2C2C', labelId: 'Yaru Charcoal', labelEn: 'Yaru Charcoal' },
  { id: 'sapphire', hex: '#162238', labelId: 'Midnight Sapphire', labelEn: 'Midnight Sapphire' },
  { id: 'violet', hex: '#23163D', labelId: 'Deep Violet', labelEn: 'Deep Violet' },
  { id: 'emerald', hex: '#112922', labelId: 'Smoked Emerald', labelEn: 'Smoked Emerald' },
  { id: 'graphite', hex: '#25201D', labelId: 'Warm Graphite', labelEn: 'Warm Graphite' },
  { id: 'crystal', hex: '#2C364A', labelId: 'Crystal Frost', labelEn: 'Crystal Frost' },
  { id: 'aero-sky', hex: '#1B334B', labelId: 'Aero Sapphire', labelEn: 'Aero Sapphire' },
];

const LANG_STORAGE_KEY = 'ironpulse_lang';
const CLOCK_FORMAT_STORAGE_KEY = 'ironpulse_clock_format';
const TIME_THEME_STORAGE_KEY = 'ironpulse_today_theme_mode';
const UI_THEME_STORAGE_KEY = 'ironpulse_ui_theme';
const ACCENT_COLOR_STORAGE_KEY = 'ironpulse_accent_color';
const MATERIAL_TINT_STORAGE_KEY = 'ironpulse_material_tint';
const PRE_YARU_ACCENT_STORAGE_KEY = 'ironpulse_pre_yaru_accent';
const PRE_YARU_TINT_STORAGE_KEY = 'ironpulse_pre_yaru_tint';
const PERF_PREFS_STORAGE_KEY = 'ironpulse_perf_prefs';

export interface PerformancePreferences {
  noBlur: boolean;
  noAnimations: boolean;
  noAmbientGlow: boolean;
  staticMascot: boolean;
}

export type PerformancePresetId = 'balanced' | 'battery' | 'ultra';

export const DEFAULT_PERFORMANCE_PREFS: PerformancePreferences = {
  noBlur: false,
  noAnimations: false,
  noAmbientGlow: false,
  staticMascot: false,
};

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
    if (val === 'obsidian') return 'obsidian';
    if (val === 'midnight-frosted') return 'midnight-frosted';
    if (val === 'carbon-forge') return 'carbon-forge';
    if (val === 'material-you') return 'material-you';
    if (val === 'aeroglass') return 'aeroglass';
    if (val === 'ubuntu-yaru') return 'ubuntu-yaru';
    return 'material-you';
  } catch {
    return 'material-you';
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

export function getStoredPerformancePreferences(): PerformancePreferences {
  try {
    const raw = localStorage.getItem(PERF_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PERFORMANCE_PREFS;
    const parsed = JSON.parse(raw) as Partial<PerformancePreferences>;
    return {
      noBlur: Boolean(parsed.noBlur),
      noAnimations: Boolean(parsed.noAnimations),
      noAmbientGlow: Boolean(parsed.noAmbientGlow),
      staticMascot: Boolean(parsed.staticMascot),
    };
  } catch {
    return DEFAULT_PERFORMANCE_PREFS;
  }
}

export function applyPerformanceTokensToDocument(prefs: PerformancePreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (prefs.noBlur) {
    root.dataset.perfNoBlur = 'true';
  } else {
    delete root.dataset.perfNoBlur;
  }
  if (prefs.noAnimations) {
    root.dataset.perfNoAnim = 'true';
  } else {
    delete root.dataset.perfNoAnim;
  }
  if (prefs.noAmbientGlow) {
    root.dataset.perfNoGlow = 'true';
  } else {
    delete root.dataset.perfNoGlow;
  }
  if (prefs.staticMascot) {
    root.dataset.perfStaticMascot = 'true';
  } else {
    delete root.dataset.perfStaticMascot;
  }
}

export function applyThemeTokensToDocument(
  uiTheme: UiTheme,
  accentColor: string,
  materialTintColor: string | null
): MaterialYouPalette {
  const resolvedAccent = normalizeHex(accentColor, DEFAULT_ACCENT_COLOR);
  const palette = generateMaterialYouPalette(resolvedAccent, materialTintColor);

  if (typeof document === 'undefined') return palette;

  const root = document.documentElement;
  const resolvedMaterial =
    uiTheme === 'material-you' && !materialTintColor
      ? palette.surfaceContainer
      : normalizeHex(
          materialTintColor || DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme],
          DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme]
        );

  root.dataset.uiTheme = uiTheme;

  // Material Design 3 (Material You) Dynamic System Tokens — active across the entire app
  root.style.setProperty('--md-sys-color-primary', palette.primary);
  root.style.setProperty('--md-sys-color-on-primary', palette.onPrimary);
  root.style.setProperty('--md-sys-color-primary-rgb', palette.primaryRgb);
  root.style.setProperty('--md-sys-color-primary-container', palette.primaryContainer);
  root.style.setProperty('--md-sys-color-on-primary-container', palette.onPrimaryContainer);
  root.style.setProperty('--md-sys-color-secondary', palette.secondary);
  root.style.setProperty('--md-sys-color-on-secondary', palette.onSecondary);
  root.style.setProperty('--md-sys-color-secondary-container', palette.secondaryContainer);
  root.style.setProperty('--md-sys-color-on-secondary-container', palette.onSecondaryContainer);
  root.style.setProperty('--md-sys-color-secondary-container-rgb', palette.secondaryContainerRgb);
  root.style.setProperty('--md-sys-color-tertiary', palette.tertiary);
  root.style.setProperty('--md-sys-color-on-tertiary', palette.onTertiary);
  root.style.setProperty('--md-sys-color-tertiary-container', palette.tertiaryContainer);
  root.style.setProperty('--md-sys-color-on-tertiary-container', palette.onTertiaryContainer);
  root.style.setProperty('--md-sys-color-surface', palette.surface);
  root.style.setProperty('--md-sys-color-surface-container-lowest', palette.surfaceContainerLowest);
  root.style.setProperty('--md-sys-color-surface-container-low', palette.surfaceContainerLow);
  root.style.setProperty('--md-sys-color-surface-container', palette.surfaceContainer);
  root.style.setProperty('--md-sys-color-surface-container-rgb', palette.surfaceContainerRgb);
  root.style.setProperty('--md-sys-color-surface-container-high', palette.surfaceContainerHigh);
  root.style.setProperty('--md-sys-color-surface-container-highest', palette.surfaceContainerHighest);
  root.style.setProperty('--md-sys-color-on-surface', palette.onSurface);
  root.style.setProperty('--md-sys-color-on-surface-rgb', palette.onSurfaceRgb);
  root.style.setProperty('--md-sys-color-on-surface-variant', palette.onSurfaceVariant);
  root.style.setProperty('--md-sys-color-outline', palette.outline);
  root.style.setProperty('--md-sys-color-outline-variant', palette.outlineVariant);

  // Synced IronPulse bridge tokens so all legacy utility classes inherit the active dynamic palette
  root.style.setProperty('--ip-accent', palette.primary);
  root.style.setProperty('--ip-accent-fg', palette.onPrimary);
  root.style.setProperty('--ip-accent-rgb', palette.primaryRgb);
  root.style.setProperty(
    '--ip-glass-rgb',
    uiTheme === 'material-you' && !materialTintColor
      ? palette.surfaceContainerRgb
      : hexToRgbTuple(resolvedMaterial, palette.surfaceContainerRgb)
  );

  const canvasBg =
    uiTheme === 'material-you'
      ? palette.surface
      : uiTheme === 'ubuntu-yaru'
        ? '#1E1E1E'
        : uiTheme === 'midnight-frosted'
          ? '#05070C'
          : uiTheme === 'carbon-forge'
            ? '#07080A'
            : uiTheme === 'aeroglass'
              ? '#06101B'
              : '#0A0B0E';
  root.style.setProperty('--ip-canvas-bg', canvasBg);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', canvasBg);
  }

  return palette;
}

// Synchronously apply stored visual & performance tokens before initial React render to prevent flash
if (typeof document !== 'undefined') {
  applyThemeTokensToDocument(
    getStoredUiTheme(),
    getStoredAccentColor(),
    getStoredMaterialTintColor()
  );
  applyPerformanceTokensToDocument(getStoredPerformancePreferences());
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
  materialPalette: MaterialYouPalette;
  setMaterialTintColor: (hex: string | null) => void;
  resetThemeCustomization: () => void;
  performance: PerformancePreferences;
  setPerformance: (patch: Partial<PerformancePreferences>) => void;
  applyPerformancePreset: (preset: PerformancePresetId) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  t: <T>(idText: T, enText: T) => T;
}

const DEFAULT_MATERIAL_PALETTE = generateMaterialYouPalette(DEFAULT_ACCENT_COLOR, null);

const I18nContext = createContext<I18nContextValue>({
  lang: 'id',
  setLang: () => {},
  clockFormat: '24h',
  setClockFormat: () => {},
  todayThemeMode: 'auto',
  setTodayThemeMode: () => {},
  uiTheme: 'material-you',
  setUiTheme: () => {},
  accentColor: DEFAULT_ACCENT_COLOR,
  setAccentColor: () => {},
  materialTintColor: null,
  effectiveMaterialTint: DEFAULT_MATERIAL_PALETTE.surfaceContainer,
  materialPalette: DEFAULT_MATERIAL_PALETTE,
  setMaterialTintColor: () => {},
  resetThemeCustomization: () => {},
  performance: DEFAULT_PERFORMANCE_PREFS,
  setPerformance: () => {},
  applyPerformancePreset: () => {},
  hapticsEnabled: true,
  setHapticsEnabled: () => {},
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
  const [performance, setPerformanceState] = useState<PerformancePreferences>(
    getStoredPerformancePreferences
  );
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(getStoredHapticsEnabled);

  const materialPalette = useMemo(
    () => generateMaterialYouPalette(accentColor, materialTintColor),
    [accentColor, materialTintColor]
  );

  const effectiveMaterialTint =
    materialTintColor ||
    (uiTheme === 'material-you'
      ? materialPalette.surfaceContainer
      : DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme]);

  useEffect(() => {
    applyThemeTokensToDocument(uiTheme, accentColor, materialTintColor);
  }, [uiTheme, accentColor, materialTintColor]);

  useEffect(() => {
    applyPerformanceTokensToDocument(performance);
  }, [performance]);

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

  const setUiTheme = useCallback(
    (next: UiTheme) => {
      if (next === uiTheme) return;

      if (next === 'ubuntu-yaru' && uiTheme !== 'ubuntu-yaru') {
        try {
          localStorage.setItem(PRE_YARU_ACCENT_STORAGE_KEY, accentColor);
          localStorage.setItem(
            PRE_YARU_TINT_STORAGE_KEY,
            materialTintColor === null ? '__AUTO__' : materialTintColor
          );
        } catch {
          // ignore storage errors
        }
        setAccentColor(YARU_ORANGE_ACCENT);
        setMaterialTintColor(null);
      } else if (uiTheme === 'ubuntu-yaru' && next !== 'ubuntu-yaru') {
        let savedAccent: string | null = null;
        let savedTint: string | null = null;
        try {
          savedAccent = localStorage.getItem(PRE_YARU_ACCENT_STORAGE_KEY);
          savedTint = localStorage.getItem(PRE_YARU_TINT_STORAGE_KEY);
          localStorage.removeItem(PRE_YARU_ACCENT_STORAGE_KEY);
          localStorage.removeItem(PRE_YARU_TINT_STORAGE_KEY);
        } catch {
          // ignore storage errors
        }

        if (accentColor.toUpperCase() === YARU_ORANGE_ACCENT.toUpperCase()) {
          setAccentColor(
            savedAccent ? normalizeHex(savedAccent, DEFAULT_ACCENT_COLOR) : DEFAULT_ACCENT_COLOR
          );
        }
        if (materialTintColor === null && savedTint) {
          setMaterialTintColor(
            savedTint === '__AUTO__'
              ? null
              : normalizeHex(savedTint, DEFAULT_MATERIAL_TINT_BY_THEME[next])
          );
        }
      }

      setUiThemeState(next);
      try {
        localStorage.setItem(UI_THEME_STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
    },
    [uiTheme, accentColor, materialTintColor, setAccentColor, setMaterialTintColor]
  );

  const resetThemeCustomization = useCallback(() => {
    try {
      localStorage.removeItem(PRE_YARU_ACCENT_STORAGE_KEY);
      localStorage.removeItem(PRE_YARU_TINT_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    setAccentColor(uiTheme === 'ubuntu-yaru' ? YARU_ORANGE_ACCENT : DEFAULT_ACCENT_COLOR);
    setMaterialTintColor(null);
  }, [uiTheme, setAccentColor, setMaterialTintColor]);

  const setPerformance = useCallback((patch: Partial<PerformancePreferences>) => {
    setPerformanceState((prev) => {
      const next: PerformancePreferences = { ...prev, ...patch };
      try {
        localStorage.setItem(PERF_PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const applyPerformancePreset = useCallback((preset: PerformancePresetId) => {
    const next: PerformancePreferences =
      preset === 'ultra'
        ? { noBlur: true, noAnimations: true, noAmbientGlow: true, staticMascot: true }
        : preset === 'battery'
          ? { noBlur: true, noAnimations: false, noAmbientGlow: true, staticMascot: false }
          : DEFAULT_PERFORMANCE_PREFS;
    setPerformanceState(next);
    try {
      localStorage.setItem(PERF_PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const setHapticsEnabled = useCallback((enabled: boolean) => {
    setHapticsEnabledState(enabled);
    setHapticsEnabledPref(enabled);
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
        uiTheme,
        setUiTheme,
        accentColor,
        setAccentColor,
        materialTintColor,
        effectiveMaterialTint,
        materialPalette,
        setMaterialTintColor,
        resetThemeCustomization,
        performance,
        setPerformance,
        applyPerformancePreset,
        hapticsEnabled,
        setHapticsEnabled,
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
