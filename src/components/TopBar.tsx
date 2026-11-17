import { Info } from 'lucide-react';
import { AppTab } from '../types/gym';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onTestAlarm: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'schedule', label: 'Jadwal' },
  { id: 'history', label: 'Riwayat' },
  { id: 'exercises', label: 'Gerakan' },
  { id: 'ringtones', label: 'Ringtone' },
];

export function TopBar({ activeTab, onSelectTab, onTestAlarm }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0B0E]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C8FF2E]"
        >
          IronPulse
        </button>

        {/* Zone 2: 5 single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navigasi Utama">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C8FF2E] ${
                  isActive
                    ? 'text-[#C8FF2E]'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#C8FF2E]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Mobile About shortcut + primary CTA button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label="Tentang & Fitur Upcoming"
            onClick={() => onSelectTab('about')}
            className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-colors md:hidden ${
              activeTab === 'about'
                ? 'border-[#C8FF2E]/50 bg-[#C8FF2E]/15 text-[#C8FF2E]'
                : 'border-white/10 bg-[#13161C] text-[#9CA3AF] hover:text-[#F4F5F7]'
            }`}
          >
            <Info className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onTestAlarm}
            className="min-h-[40px] rounded-lg bg-[#C8FF2E] px-4 py-2 text-xs font-bold tracking-wide text-[#0A0B0E] transition-transform hover:brightness-105 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF2E]"
          >
            Tes Alarm
          </button>
        </div>
      </div>
    </header>
  );
}
