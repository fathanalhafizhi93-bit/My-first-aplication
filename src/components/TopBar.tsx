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
  const { t, uiTheme } = useI18n();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';

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
      className={`glass-bar sticky top-0 z-30 border-b transition-colors duration-500 ${
        isFrosted
          ? 'border-white/15'
          : isCarbon
            ? 'border-white/12'
            : phaseToken.headerTint
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7] transition-transform active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-pulse"
        >
          IronPulse
        </button>

        {/* Zone 2: 5 core single-line workspace nav links */}
        <nav
          className={`hidden md:flex items-center ${
            isFrosted
              ? 'gap-2 rounded-full border border-white/12 bg-white/[0.04] px-2 py-1'
              : 'gap-5 lg:gap-7'
          }`}
          aria-label={t('Navigasi Utama', 'Primary Navigation')}
        >
          {navItems.map((item) => {
            const isTabMatch =
              activeTab === item.id || (item.id === 'today' && activeTab === 'workout');
            const isActive = isTabMatch && activePopup === null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative whitespace-nowrap shrink-0 text-sm transition-colors duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-pulse ${
                  isCarbon ? 'font-semibold tracking-wide' : 'font-medium'
                } ${
                  isFrosted ? 'rounded-full px-3.5 py-1.5' : 'py-2'
                } ${
                  isActive
                    ? 'text-pulse'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                {isActive && isFrosted && (
                  <motion.span
                    layoutId="desktop-nav-capsule"
                    transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-full border border-white/20 bg-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                  />
                )}
                {item.label}
                {isActive && !isFrosted && (
                  <motion.span
                    layoutId="desktop-nav-underline"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    className={`absolute inset-x-0 -bottom-[17px] bg-pulse ${
                      isCarbon
                        ? 'h-[2.5px] rounded-none shadow-[0_0_10px_rgba(var(--ip-accent-rgb),0.6)]'
                        : 'h-0.5 rounded-full'
                    }`}
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
            className={`flex min-h-[40px] min-w-[40px] items-center justify-center border transition-all duration-150 active:scale-95 ${
              isFrosted ? 'rounded-full' : isCarbon ? 'rounded-md' : 'rounded-lg'
            } ${
              settingsActive
                ? 'border-pulse/60 bg-pulse/18 text-pulse'
                : isFrosted
                  ? 'border-white/18 bg-white/[0.08] text-[#D1D5DB] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-white/30 hover:text-[#F4F5F7]'
                  : isCarbon
                    ? 'border-white/14 bg-[#12151B]/95 text-[#9CA3AF] hover:border-white/30 hover:text-[#F4F5F7]'
                    : 'border-white/10 bg-[#13161C]/80 text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label={t('Buka pop-up Tentang IronPulse', 'Open About IronPulse popup')}
            onClick={onOpenAbout}
            className={`flex min-h-[40px] min-w-[40px] items-center justify-center border transition-all duration-150 active:scale-95 ${
              isFrosted ? 'rounded-full' : isCarbon ? 'rounded-md' : 'rounded-lg'
            } ${
              aboutActive
                ? 'border-pulse/60 bg-pulse/18 text-pulse'
                : isFrosted
                  ? 'border-white/18 bg-white/[0.08] text-[#D1D5DB] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-white/30 hover:text-[#F4F5F7]'
                  : isCarbon
                    ? 'border-white/14 bg-[#12151B]/95 text-[#9CA3AF] hover:border-white/30 hover:text-[#F4F5F7]'
                    : 'border-white/10 bg-[#13161C]/80 text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
            }`}
          >
            <Info className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onTestAlarm}
            className={`min-h-[40px] bg-pulse px-4 py-2 text-xs font-bold tracking-wide text-pulse-fg transition-transform duration-150 hover:brightness-105 active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse ${
              isFrosted ? 'rounded-full' : isCarbon ? 'rounded-md' : 'rounded-lg'
            }`}
          >
            {t('Tes Alarm', 'Test Alarm')}
          </button>
        </div>
      </div>
    </header>
  );
}
