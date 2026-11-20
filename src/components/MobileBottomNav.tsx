import { memo } from 'react';
import { CalendarDays, Dumbbell, History, PlayCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { formatRestDuration } from '../lib/dateUtils';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';
import { TAB_INDICATOR_SPRING } from '../lib/motionTokens';
import { AppTab } from '../types/gym';

interface MobileBottomNavProps {
  activeTab: AppTab;
  timePhase: DayTimePhase;
  onSelectTab: (tab: AppTab) => void;
  restRemaining: number;
  restRunning: boolean;
}

export const MobileBottomNav = memo(function MobileBottomNav({
  activeTab,
  timePhase,
  onSelectTab,
  restRemaining,
  restRunning,
}: MobileBottomNavProps) {
  const { t, uiTheme } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';
  const isMaterialYou = uiTheme === 'material-you';
  const isAero = uiTheme === 'aeroglass';
  const isYaru = uiTheme === 'ubuntu-yaru';

  const tabs: { id: AppTab; label: string; Icon: typeof PlayCircle }[] = [
    { id: 'today', label: t('Hari Ini', 'Today'), Icon: PlayCircle },
    { id: 'schedule', label: t('Jadwal', 'Schedule'), Icon: CalendarDays },
    { id: 'history', label: t('Riwayat', 'History'), Icon: History },
    { id: 'exercises', label: t('Gerakan', 'Exercises'), Icon: Dumbbell },
  ];

  return (
    <nav
      aria-label={t('Navigasi Mobile', 'Mobile Navigation')}
      className={
        isFrosted
          ? 'glass-bar fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 rounded-[28px] border border-white/22 px-1.5 py-1 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.78)] transition-all duration-300 md:hidden'
          : `glass-bar fixed bottom-0 left-0 right-0 z-40 border-t pb-[env(safe-area-inset-bottom)] transition-colors duration-300 md:hidden ${
              isAero
                ? 'border-sky-200/35 px-1'
                : isMaterialYou
                  ? 'border-md-outline-variant'
                  : isYaru
                    ? 'border-white/10'
                    : isCarbon
                      ? 'border-white/12'
                      : phaseToken.headerTint
            }`
      }
    >
      <div className={`grid items-center ${isFrosted ? 'h-14 grid-cols-4 gap-1' : 'h-16 grid-cols-4'}`}>
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id || (id === 'today' && activeTab === 'workout');
          const showCompactRest = id === 'today' && restRunning && activeTab !== 'workout';
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`relative isolate flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 transition-all duration-150 active:scale-95 ${
                isFrosted
                  ? 'min-h-[48px] rounded-[22px]'
                  : isAero
                    ? 'min-h-[50px] gap-0.5 rounded-xl mx-0.5'
                    : isMaterialYou
                      ? 'min-h-[52px] gap-1'
                      : isYaru
                        ? 'min-h-[48px] gap-1 rounded-lg'
                        : isCarbon
                          ? 'min-h-[48px] gap-1 rounded-md'
                          : 'min-h-[48px] gap-1'
              } ${
                active
                  ? isMaterialYou
                    ? 'text-md-on-surface'
                    : 'text-pulse'
                  : isMaterialYou
                    ? 'text-md-on-surface-variant'
                    : isYaru
                      ? 'text-[#B5B4B0]'
                      : 'text-[#9CA3AF]'
              }`}
            >
              {active && isAero && (
                <motion.span
                  layoutId={prefersReducedMotion ? undefined : 'mobile-nav-aero-pill'}
                  transition={TAB_INDICATOR_SPRING}
                  className="pointer-events-none absolute inset-0 z-0 rounded-xl border border-sky-200/40 bg-gradient-to-b from-white/22 via-white/8 to-sky-400/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_12px_rgba(56,189,248,0.22)]"
                />
              )}
              {active && isFrosted && (
                <motion.span
                  layoutId={prefersReducedMotion ? undefined : 'mobile-nav-frosted-pill'}
                  transition={TAB_INDICATOR_SPRING}
                  className="pointer-events-none absolute inset-0 z-0 rounded-[22px] border border-white/18 bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                />
              )}
              {active && !isFrosted && !isMaterialYou && !isAero && (
                <motion.span
                  layoutId={prefersReducedMotion ? undefined : 'mobile-nav-indicator'}
                  transition={TAB_INDICATOR_SPRING}
                  className={`pointer-events-none absolute top-0 z-10 bg-pulse ${
                    isCarbon
                      ? 'h-[2.5px] w-9 rounded-none shadow-[0_0_10px_rgba(var(--ip-accent-rgb),0.6)]'
                      : 'h-0.5 w-8 rounded-full'
                  }`}
                />
              )}
              <span className="relative z-10 flex h-7 w-14 items-center justify-center">
                {active && isMaterialYou && (
                  <motion.span
                    layoutId={prefersReducedMotion ? undefined : 'mobile-nav-m3-capsule'}
                    transition={TAB_INDICATOR_SPRING}
                    className="pointer-events-none absolute inset-0 rounded-full bg-md-secondary-container"
                  />
                )}
                <Icon
                  className={`relative h-5 w-5 transition-transform duration-150 ${
                    active ? 'scale-105' : ''
                  } ${active && isMaterialYou ? 'text-md-on-secondary-container' : ''}`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
              </span>
              <span
                className={`relative z-10 max-w-full truncate text-[10.5px] tracking-tight whitespace-nowrap ${
                  showCompactRest
                    ? 'inline-flex items-center gap-1 font-mono font-bold tabular-nums text-pulse'
                    : active && isMaterialYou
                      ? 'font-bold text-md-on-surface'
                      : 'font-medium'
                }`}
              >
                {showCompactRest ? (
                  <span>{formatRestDuration(restRemaining)}</span>
                ) : (
                  label
                )}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
