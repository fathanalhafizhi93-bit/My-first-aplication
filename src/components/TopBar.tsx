import { Info, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';
import { AppTab } from '../types/gym';

interface TopBarProps {
  activeTab: AppTab;
  activePopup: 'settings' | 'about' | null;
  timePhase: DayTimePhase;
  onSelectTab: (tab: AppTab) => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onTestAlarm: () => void;
}

export function TopBar({
  activeTab,
  activePopup,
  timePhase,
  onSelectTab,
  onOpenSettings,
  onOpenAbout,
  onTestAlarm,
}: TopBarProps) {
  const { t } = useI18n();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'today', label: t('Hari Ini', 'Today') },
    { id: 'schedule', label: t('Jadwal', 'Schedule') },
    { id: 'history', label: t('Riwayat', 'History') },
    { id: 'exercises', label: t('Gerakan', 'Exercises') },
    { id: 'ringtones', label: t('Ringtone', 'Ringtones') },
  ];

  const settingsActive = activePopup === 'settings';
  const aboutActive = activePopup === 'about';

  return (
    <header
      className={`glass-bar sticky top-0 z-30 border-b transition-colors duration-500 ${phaseToken.headerTint}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7] transition-transform active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C8FF2E]"
        >
          IronPulse
        </button>

        {/* Zone 2: 5 core single-line workspace nav links with fluid spring indicator */}
        <nav
          className="hidden md:flex items-center gap-5 lg:gap-7"
          aria-label={t('Navigasi Utama', 'Primary Navigation')}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id && activePopup === null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C8FF2E] ${
                  isActive
                    ? 'text-[#C8FF2E]'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="desktop-nav-underline"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 rounded-full bg-[#C8FF2E]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Settings & About pop-up triggers + Test Alarm CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label={t('Buka pop-up pengaturan', 'Open settings popup')}
            onClick={onOpenSettings}
            className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-all duration-150 active:scale-95 ${
              settingsActive
                ? 'border-[#C8FF2E]/60 bg-[#C8FF2E]/18 text-[#C8FF2E]'
                : 'border-white/10 bg-[#13161C]/80 text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label={t('Buka pop-up Tentang IronPulse', 'Open About IronPulse popup')}
            onClick={onOpenAbout}
            className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-all duration-150 active:scale-95 ${
              aboutActive
                ? 'border-[#C8FF2E]/60 bg-[#C8FF2E]/18 text-[#C8FF2E]'
                : 'border-white/10 bg-[#13161C]/80 text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
            }`}
          >
            <Info className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onTestAlarm}
            className="min-h-[40px] rounded-lg bg-[#C8FF2E] px-4 py-2 text-xs font-bold tracking-wide text-[#0A0B0E] transition-transform duration-150 hover:brightness-105 active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF2E]"
          >
            {t('Tes Alarm', 'Test Alarm')}
          </button>
        </div>
      </div>
    </header>
  );
}
