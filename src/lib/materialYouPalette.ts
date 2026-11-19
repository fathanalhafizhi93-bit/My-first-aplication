export interface MaterialYouPalette {
  seed: string;
  primary: string;
  onPrimary: string;
  primaryRgb: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryContainerRgb: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerRgb: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceRgb: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHexColor(hex: string, fallback = '#C8FF2E'): string {
  const cleaned = (hex || '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  return fallback.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const valid = normalizeHexColor(hex);
  return {
    r: parseInt(valid.slice(1, 3), 16),
    g: parseInt(valid.slice(3, 5), 16),
    b: parseInt(valid.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToRgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = 60 * (((gn - bn) / delta) % 6);
        break;
      case gn:
        h = 60 * ((bn - rn) / delta + 2);
        break;
      default:
        h = 60 * ((rn - gn) / delta + 4);
        break;
    }
  }

  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const lig = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks an accessible Material 3 foreground tone on top of a given container/accent hex,
 * guaranteeing WCAG AA/AAA readability regardless of user seed hue.
 */
export function computeTonalOnColor(
  bgHex: string,
  hue: number,
  seedSat: number
): string {
  const darkCandidate = hslToHex(hue, clamp(seedSat * 0.35, 6, 32), 8.5);
  const lightCandidate = hslToHex(hue, clamp(seedSat * 0.25, 6, 26), 96);
  const darkRatio = contrastRatio(bgHex, darkCandidate);
  const lightRatio = contrastRatio(bgHex, lightCandidate);

  if (darkRatio >= lightRatio) {
    return darkRatio >= 4.5 ? darkCandidate : '#08090C';
  }
  return lightRatio >= 4.5 ? lightCandidate : '#FFFFFF';
}

/**
 * Derives a complete Android 14/15 Dark Tonal Material You (M3) palette
 * from any user-selected accent seed color (plus optional neutral surface tint hue override).
 */
export function generateMaterialYouPalette(
  seedHex: string,
  surfaceTintOverrideHex?: string | null
): MaterialYouPalette {
  const seed = normalizeHexColor(seedHex, '#C8FF2E');
  const { r, g, b } = hexToRgb(seed);
  const { h: seedH, s: seedS } = rgbToHsl(r, g, b);

  // If the user explicitly chooses a custom surface tint color, gently adopt its hue for neutral tiers
  let surfaceH = seedH;
  let surfaceSatBoost = seedS;
  if (surfaceTintOverrideHex && /^#[0-9A-Fa-f]{6}$/.test(surfaceTintOverrideHex)) {
    const ovRgb = hexToRgb(surfaceTintOverrideHex);
    const ovHsl = rgbToHsl(ovRgb.r, ovRgb.g, ovRgb.b);
    if (ovHsl.s >= 6) {
      surfaceH = ovHsl.h;
      surfaceSatBoost = Math.max(ovHsl.s, 18);
    }
  }

  const isNeutralSeed = seedS < 8;
  const primary = seed;
  const onPrimary = computeTonalOnColor(primary, seedH, seedS);

  // Primary Container (rich dark tonal fill + luminous on-primary-container text)
  const primaryContainer = hslToHex(
    seedH,
    isNeutralSeed ? 6 : clamp(seedS * 0.52, 22, 54),
    22
  );
  const onPrimaryContainer = hslToHex(
    seedH,
    isNeutralSeed ? 8 : clamp(seedS * 0.78, 36, 90),
    90
  );

  // Secondary (calmer desaturated sibling hue used for M3 nav pills & tonal buttons)
  const secondary = hslToHex(
    seedH,
    isNeutralSeed ? 6 : clamp(seedS * 0.34, 14, 34),
    78
  );
  const onSecondary = computeTonalOnColor(secondary, seedH, seedS * 0.4);
  const secondaryContainer = hslToHex(
    seedH,
    isNeutralSeed ? 8 : clamp(seedS * 0.34, 16, 36),
    24
  );
  const onSecondaryContainer = hslToHex(
    seedH,
    isNeutralSeed ? 10 : clamp(seedS * 0.56, 24, 74),
    91
  );

  // Tertiary (analogous +55deg accent for subtle secondary highlights)
  const tertiaryH = (seedH + 55) % 360;
  const tertiary = hslToHex(
    tertiaryH,
    isNeutralSeed ? 10 : clamp(seedS * 0.56, 26, 66),
    78
  );
  const onTertiary = computeTonalOnColor(tertiary, tertiaryH, seedS * 0.5);
  const tertiaryContainer = hslToHex(
    tertiaryH,
    isNeutralSeed ? 10 : clamp(seedS * 0.42, 18, 42),
    23
  );
  const onTertiaryContainer = hslToHex(
    tertiaryH,
    isNeutralSeed ? 10 : clamp(seedS * 0.62, 28, 78),
    90
  );

  // 5-Step Android 14/15 Dark Tonal Neutral Surface Ladder (tinted subtly with seed hue)
  const neutralSat = surfaceSatBoost < 8 ? 3 : clamp(surfaceSatBoost * 0.14, 7, 15);
  const surface = hslToHex(surfaceH, neutralSat, 6.8);
  const surfaceContainerLowest = hslToHex(surfaceH, neutralSat, 4.6);
  const surfaceContainerLow = hslToHex(surfaceH, clamp(neutralSat + 1, 3, 17), 9.6);
  const surfaceContainer = hslToHex(surfaceH, clamp(neutralSat + 2, 4, 18), 12.2);
  const surfaceContainerHigh = hslToHex(surfaceH, clamp(neutralSat + 3, 4, 20), 15.6);
  const surfaceContainerHighest = hslToHex(surfaceH, clamp(neutralSat + 4, 5, 22), 19.6);

  // Tonal On-Surface & Outlines
  const onSurface = hslToHex(surfaceH, clamp(neutralSat * 0.9, 2, 14), 93.5);
  const onSurfaceVariant = hslToHex(surfaceH, clamp(neutralSat + 3, 4, 18), 74);
  const outline = hslToHex(surfaceH, clamp(neutralSat + 5, 5, 20), 47);
  const outlineVariant = hslToHex(surfaceH, clamp(neutralSat + 4, 5, 19), 25);

  return {
    seed,
    primary,
    onPrimary,
    primaryRgb: hexToRgbString(primary),
    primaryContainer,
    onPrimaryContainer,
    secondary,
    onSecondary,
    secondaryContainer,
    onSecondaryContainer,
    secondaryContainerRgb: hexToRgbString(secondaryContainer),
    tertiary,
    onTertiary,
    tertiaryContainer,
    onTertiaryContainer,
    surface,
    surfaceContainerLowest,
    surfaceContainerLow,
    surfaceContainer,
    surfaceContainerRgb: hexToRgbString(surfaceContainer),
    surfaceContainerHigh,
    surfaceContainerHighest,
    onSurface,
    onSurfaceRgb: hexToRgbString(onSurface),
    onSurfaceVariant,
    outline,
    outlineVariant,
  };
}
