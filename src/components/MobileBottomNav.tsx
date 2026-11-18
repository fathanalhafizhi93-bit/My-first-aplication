import { CalendarDays, Dumbbell, History, Music, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { formatRestDuration } from '../lib/dateUtils';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';
import { AppTab } from '../types/gym';

interface MobileBottomNavProps {
  activeTab: AppTab;
  timePhase: DayTimePhase;
  onSelectTab: (tab: AppTab) => void;
  restRemaining: number;
  restRunning: boolean;
}

export function MobileBottomNav({
  activeTab,
  timePhase,
  onSelectTab,
  restRemaining,
  restRunning,
}: MobileBottomNavProps) {
  const { t, uiTheme } = useI18n();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';

  const tabs: { id: AppTab; label: string; Icon: typeof PlayCircle }[] = [
    { id: 'today', label: t('Hari Ini', 'Today'), Icon: PlayCircle },
    { id: 'schedule', label: t('Jadwal', 'Schedule'), Icon: CalendarDays },
    { id: 'history', label: t('Riwayat', 'History'), Icon: History },
    { id: 'exercises', label: t('Gerakan', 'Exercises'), Icon: Dumbbell },
    { id: 'ringtones', label: t('Ringtone', 'Ringtones'), Icon: Music },
  ];

  return (
    <nav
      aria-label={t('Navigasi Mobile', 'Mobile Navigation')}
      className={
        isFrosted
          ? 'glass-bar fixed bottom-3 left-3 right-3 z-40 rounded-[28px] border border-white/22 px-1.5 py-1 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.78)] transition-all duration-300 md:hidden'
          : `glass-bar fixed bottom-0 left-0 right-0 z-40 border-t transition-colors duration-500 md:hidden ${
              isCarbon ? 'border-white/12' : phaseToken.headerTint
            }`
      }
    >
      <div className={`grid items-center ${isFrosted ? 'h-14 grid-cols-5 gap-1' : 'h-16 grid-cols-5'}`}>
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id || (id === 'today' && activeTab === 'workout');
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 ${
                isFrosted
                  ? 'min-h-[48px] rounded-[22px]'
                  : isCarbon
                    ? 'min-h-[48px] gap-1 rounded-md'
                    : 'min-h-[48px] gap-1'
              } ${active ? 'text-pulse' : 'text-[#9CA3AF]'}`}
            >
              {active && isFrosted && (
                <motion.span
                  layoutId="mobile-nav-frosted-pill"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className="absolute inset-0 -z-10 rounded-[22px] border border-white/18 bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                />
              )}
              {active && !isFrosted && (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className={`absolute top-0 bg-pulse ${
                    isCarbon
                      ? 'h-[2.5px] w-9 rounded-none shadow-[0_0_10px_rgba(var(--ip-accent-rgb),0.6)]'
                      : 'h-0.5 w-8 rounded-full'
                  }`}
                />
              )}
              <Icon
                className={`h-5 w-5 transition-transform duration-150 ${active ? 'scale-105' : ''}`}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                {id === 'today' && restRunning
                  ? `${t('Istirahat', 'Rest')} ${formatRestDuration(restRemaining)}`
                  : label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
