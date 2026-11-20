import { memo } from 'react';
import { Info, Settings } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';
import { TAB_INDICATOR_SPRING } from '../lib/motionTokens';
import { AppTab } from '../types/gym';

interface TopBarProps {
  activeTab: AppTab;
  activePopup: 'about' | null;
  timePhase: DayTimePhase;
  onSelectTab: (tab: AppTab) => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onTestAlarm: () => void;
}

export const TopBar = memo(function TopBar({
  activeTab,
  activePopup,
  timePhase,
  onSelectTab,
  onOpenSettings,
  onOpenAbout,
  onTestAlarm,
}: TopBarProps) {
  const { t, uiTheme } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const isFrosted = uiTheme === 'midnight-frosted';
  const isCarbon = uiTheme === 'carbon-forge';
  const isMaterialYou = uiTheme === 'material-you';
  const isAero = uiTheme === 'aeroglass';
  const isYaru = uiTheme === 'ubuntu-yaru';

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'today', label: t('Hari Ini', 'Today') },
    { id: 'schedule', label: t('Jadwal', 'Schedule') },
    { id: 'history', label: t('Riwayat', 'History') },
    { id: 'exercises', label: t('Gerakan', 'Exercises') },
  ];

  const settingsActive = activeTab === 'settings' && activePopup === null;
  const aboutActive = activePopup === 'about';

  return (
    <header
      className={`glass-bar sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] transition-colors duration-300 ${
        isAero
          ? 'border-sky-200/30'
          : isMaterialYou
            ? 'border-md-outline-variant'
            : isYaru
              ? 'border-white/10'
              : isFrosted
                ? 'border-white/15'
                : isCarbon
                  ? 'border-white/12'
                  : phaseToken.headerTint
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-line dual-tone brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className="group inline-flex items-baseline font-display text-[1.55rem] font-extrabold tracking-[-0.03em] transition-transform duration-150 active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pulse"
        >
          <span className="bg-gradient-to-b from-white via-[#F4F5F7] to-[#CBD5E1] bg-clip-text text-transparent">
            Iron
          </span>
          <span
            className="relative text-pulse transition-all duration-200 group-hover:brightness-110"
            style={{
              textShadow: '0 0 18px rgba(var(--ip-accent-rgb), 0.32)',
            }}
          >
            Pulse
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-pulse transition-transform duration-200 group-hover:scale-x-100"
            />
          </span>
        </button>

        {/* Zone 2: 5 core single-line workspace nav links */}
        <nav
          className={`hidden md:flex items-center ${
            isAero
              ? 'gap-1.5 rounded-xl border border-sky-200/25 bg-white/[0.06] px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]'
              : isMaterialYou
                ? 'gap-1 rounded-full border border-md-outline-variant bg-md-surface-container px-1.5 py-1'
                : isFrosted
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
                className={`relative isolate whitespace-nowrap shrink-0 text-sm transition-colors duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-pulse ${
                  isCarbon || isMaterialYou || isAero || isYaru
                    ? 'font-semibold tracking-wide'
                    : 'font-medium'
                } ${
                  isAero
                    ? 'rounded-lg px-3.5 py-1.5'
                    : isFrosted || isMaterialYou
                      ? 'rounded-full px-3.5 py-1.5'
                      : isYaru
                        ? 'rounded-lg px-3 py-1.5'
                        : 'py-2'
                } ${
                  isActive
                    ? isMaterialYou
                      ? 'text-md-on-secondary-container'
                      : isYaru
                        ? 'bg-[#353535] text-white'
                        : 'text-pulse'
                    : isMaterialYou
                      ? 'text-md-on-surface-variant hover:text-md-on-surface'
                      : isYaru
                        ? 'text-[#C0BFBC] hover:bg-[#303030] hover:text-white'
                        : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                {isActive && isAero && (
                  <motion.span
                    layoutId={prefersReducedMotion ? undefined : 'desktop-nav-aero-pill'}
                    transition={TAB_INDICATOR_SPRING}
                    className="pointer-events-none absolute inset-0 z-0 rounded-lg border border-sky-200/40 bg-gradient-to-b from-white/22 via-white/10 to-sky-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_10px_rgba(56,189,248,0.22)]"
                  />
                )}
                {isActive && isMaterialYou && (
                  <motion.span
                    layoutId={prefersReducedMotion ? undefined : 'desktop-nav-m3-pill'}
                    transition={TAB_INDICATOR_SPRING}
                    className="pointer-events-none absolute inset-0 z-0 rounded-full bg-md-secondary-container"
                  />
                )}
                {isActive && isFrosted && (
                  <motion.span
                    layoutId={prefersReducedMotion ? undefined : 'desktop-nav-capsule'}
                    transition={TAB_INDICATOR_SPRING}
                    className="pointer-events-none absolute inset-0 z-0 rounded-full border border-white/20 bg-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {isActive && !isFrosted && !isMaterialYou && !isAero && (
                  <motion.span
                    layoutId={prefersReducedMotion ? undefined : 'desktop-nav-underline'}
                    transition={TAB_INDICATOR_SPRING}
                    className={`absolute inset-x-0 bg-pulse ${
                      isYaru
                        ? '-bottom-[13px] h-[2px] rounded-full'
                        : isCarbon
                          ? '-bottom-[17px] h-[2.5px] rounded-none shadow-[0_0_10px_rgba(var(--ip-accent-rgb),0.6)]'
                          : '-bottom-[17px] h-0.5 rounded-full'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Full-Page Settings trigger, About pop-up trigger & Test Alarm CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label={t('Buka halaman pengaturan', 'Open settings page')}
            aria-current={settingsActive ? 'page' : undefined}
            onClick={onOpenSettings}
            className={`flex min-h-[40px] min-w-[40px] items-center justify-center border transition-all duration-150 active:scale-95 ${
              isFrosted || isMaterialYou ? 'rounded-full' : isAero ? 'rounded-lg' : isCarbon ? 'rounded-md' : 'rounded-lg'
            } ${
              settingsActive
                ? isMaterialYou
                  ? 'border-md-secondary-container bg-md-secondary-container text-md-on-secondary-container'
                  : 'border-pulse/60 bg-pulse/18 text-pulse'
                : isAero
                  ? 'border-sky-200/32 bg-gradient-to-b from-white/18 via-white/8 to-sky-400/10 text-[#E5E7EB] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] hover:border-sky-200/55 hover:text-white'
                  : isMaterialYou
                    ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface-variant hover:border-md-outline hover:text-md-on-surface'
                    : isYaru
                      ? 'border-white/12 bg-[#353535] text-[#D5D4D0] shadow-[0_1px_2px_rgba(0,0,0,0.22)] hover:border-white/25 hover:text-white'
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
              isFrosted || isMaterialYou ? 'rounded-full' : isAero ? 'rounded-lg' : isCarbon ? 'rounded-md' : 'rounded-lg'
            } ${
              aboutActive
                ? isMaterialYou
                  ? 'border-md-secondary-container bg-md-secondary-container text-md-on-secondary-container'
                  : 'border-pulse/60 bg-pulse/18 text-pulse'
                : isAero
                  ? 'border-sky-200/32 bg-gradient-to-b from-white/18 via-white/8 to-sky-400/10 text-[#E5E7EB] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] hover:border-sky-200/55 hover:text-white'
                  : isMaterialYou
                    ? 'border-md-outline-variant bg-md-surface-high text-md-on-surface-variant hover:border-md-outline hover:text-md-on-surface'
                    : isYaru
                      ? 'border-white/12 bg-[#353535] text-[#D5D4D0] shadow-[0_1px_2px_rgba(0,0,0,0.22)] hover:border-white/25 hover:text-white'
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
              isFrosted || isMaterialYou ? 'rounded-full' : isAero ? 'rounded-xl' : isCarbon ? 'rounded-md' : 'rounded-lg'
            }`}
          >
            {t('Tes Alarm', 'Test Alarm')}
          </button>
        </div>
      </div>
    </header>
  );
});
