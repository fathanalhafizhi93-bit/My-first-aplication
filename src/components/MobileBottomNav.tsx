import { CalendarDays, Dumbbell, History, Music, PlayCircle } from 'lucide-react';
import { AppTab } from '../types/gym';
import { formatRestDuration } from '../lib/dateUtils';
import { useI18n } from '../lib/i18n';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  restRemaining: number;
  restRunning: boolean;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  restRemaining,
  restRunning,
}: MobileBottomNavProps) {
  const { t } = useI18n();

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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0A0B0E]/95 backdrop-blur-md md:hidden"
    >
      <div className="grid h-16 grid-cols-5 items-center">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-[#C8FF2E]' : 'text-[#9CA3AF]'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
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
