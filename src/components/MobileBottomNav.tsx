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
  const { t } = useI18n();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];

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
      className={`glass-bar fixed bottom-0 left-0 right-0 z-40 border-t transition-colors duration-500 md:hidden ${phaseToken.headerTint}`}
    >
      <div className="grid h-16 grid-cols-5 items-center">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-95 ${
                active ? 'text-[#C8FF2E]' : 'text-[#9CA3AF]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-[#C8FF2E]"
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
