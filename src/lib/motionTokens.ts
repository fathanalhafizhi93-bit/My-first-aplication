import { UiTheme } from './i18n';

export const SHARED_LAYOUT_SPRING = {
  type: 'spring' as const,
  stiffness: 310,
  damping: 27,
  mass: 0.85,
};

export const TAB_INDICATOR_SPRING = {
  type: 'spring' as const,
  stiffness: 410,
  damping: 28,
  mass: 0.78,
};

export const TAB_GLIDE_SPRING = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 30,
  mass: 0.82,
};

export const SHARED_IDS = {
  workoutHeroCard: 'shared-workout-hero-card',
  workoutTitle: 'shared-workout-title',
  workoutProgress: 'shared-workout-progress',
  restTimerCard: 'shared-rest-timer-card',
  restTimerDigits: 'shared-rest-timer-digits',
  pageAccentBar: 'shared-page-accent-bar',
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
    case 'carbon-forge':
      return 10;
    default:
      return 16;
  }
}
