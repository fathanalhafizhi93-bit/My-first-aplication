import { CalendarDays, Dumbbell, History, Music, PlayCircle } from 'lucide-react';
import { AppTab } from '../types/gym';
import { formatRestDuration } from '../lib/dateUtils';

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
  const tabs: { id: AppTab; label: string; Icon: typeof PlayCircle }[] = [
    { id: 'today', label: 'Hari Ini', Icon: PlayCircle },
    { id: 'schedule', label: 'Jadwal', Icon: CalendarDays },
    { id: 'history', label: 'Riwayat', Icon: History },
    { id: 'exercises', label: 'Gerakan', Icon: Dumbbell },
    { id: 'ringtones', label: 'Ringtone', Icon: Music },
  ];

  return (
    <nav
      aria-label="Navigasi Mobile"
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
                  ? `Istirahat ${formatRestDuration(restRemaining)}`
                  : label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
