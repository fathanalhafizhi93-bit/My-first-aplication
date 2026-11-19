import { UiTheme } from './i18n';

export const TAB_INDICATOR_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 30,
  mass: 0.72,
};

export const SHARED_IDS = {
  exerciseDayPill: 'exercise-day-pill',
  settingsSubTabPill: 'settings-subtab-pill',
} as const;

export function resolveCardRadiusPx(uiTheme: UiTheme): number {
  switch (uiTheme) {
    case 'material-you':
      return 28;
    case 'midnight-frosted':
      return 24;
    case 'aeroglass':
      return 14;
    case 'ubuntu-yaru':
      return 12;
    case 'carbon-forge':
      return 10;
    default:
      return 16;
  }
}
