import { Globe, HelpCircle, Info, LogOut, Pause, Play, RotateCcw, Settings, Volume2 } from 'lucide-react';
import {
  formatAlarmTime,
  formatClockTime,
  formatRestDuration,
  NextAlarmInfo,
} from '../lib/dateUtils';
import { useI18n } from '../lib/i18n';
import { UserProfile } from '../types/gym';
import { PWAInstallCard } from './PWAInstallBanner';

interface RightUtilityPanelProps {
  now: Date;
  nextAlarm: NextAlarmInfo | null;
  audioUnlocked: boolean;
  onUnlockAudio: () => Promise<void>;
  restTotalSeconds: number;
  restRemaining: number;
  restRunning: boolean;
  restExerciseLabel: string | null;
  onStartRest: (seconds: number, label?: string) => void;
  onToggleRestPause: () => void;
  onResetRest: () => void;
  onAdjustRest: (deltaSeconds: number) => void;
  profile: UserProfile;
  onSignOut: () => Promise<void>;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenTutorial: () => void;
  isSettingsActive: boolean;
  isAboutActive: boolean;
}

export function RightUtilityPanel({
  now,
  nextAlarm,
  audioUnlocked,
  onUnlockAudio,
  restTotalSeconds,
  restRemaining,
  restRunning,
  restExerciseLabel,
  onStartRest,
  onToggleRestPause,
  onResetRest,
  onAdjustRest,
  profile,
  onSignOut,
  onOpenSettings,
  onOpenAbout,
  onOpenTutorial,
  isSettingsActive,
  isAboutActive,
}: RightUtilityPanelProps) {
  const { lang, setLang, clockFormat, t } = useI18n();
  const formattedClock = formatClockTime(now, clockFormat, true);

  const progressRatio =
    restTotalSeconds > 0
      ? Math.max(0, Math.min(1, restRemaining / restTotalSeconds))
      : 0;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const secUnit = t('d', 's');

  return (
    <aside className="space-y-5">
      {/* Live Clock & Next Alarm Card */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
          <span className="font-semibold uppercase tracking-wider">
            {t('Jam & Alarm Berikutnya', 'Clock & Next Alarm')}
          </span>
          {!audioUnlocked && (
            <button
              type="button"
              onClick={onUnlockAudio}
              className="inline-flex items-center gap-1 font-semibold text-[#C8FF2E] hover:underline"
            >
              <Volume2 className="h-3.5 w-3.5" />
              {t('Aktifkan Audio', 'Enable Audio')}
            </button>
          )}
        </div>

        <p className="mt-2 flex items-baseline gap-2 font-mono text-4xl font-bold tracking-tight tabular-nums text-[#F4F5F7]">
          <span>{formattedClock.timeText}</span>
          {formattedClock.meridiem && (
            <span className="text-base font-bold text-[#C8FF2E]">
              {formattedClock.meridiem}
            </span>
          )}
        </p>

        {nextAlarm ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-[#F4F5F7]">
                {nextAlarm.dayLabel} ·{' '}
                <span className="font-mono tabular-nums text-[#C8FF2E]">
                  {formatAlarmTime(nextAlarm.alarmTime, clockFormat)}
                </span>
              </p>
              <span className="text-xs font-medium text-[#D1D5DB]">
                {nextAlarm.countdownText}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-[#9CA3AF]">{nextAlarm.focusTitle}</p>
          </div>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-4 text-xs text-[#9CA3AF]">
            {t(
              'Belum ada alarm aktif. Aktifkan di tab Jadwal.',
              'No active alarms yet. Enable them in the Schedule tab.'
            )}
          </div>
        )}
      </section>

      {/* Inter-Set Rest Timer */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#F4F5F7]">
            {t('Timer Istirahat', 'Rest Timer')}
          </h2>
          {restExerciseLabel && (
            <span className="max-w-[140px] truncate text-xs text-[#9CA3AF]">
              {restExerciseLabel}
            </span>
          )}
        </div>

        {/* SVG Circular Timer */}
        <div className="mt-4 flex items-center justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="7"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={restRemaining === 0 ? '#16A34A' : '#C8FF2E'}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute font-mono text-2xl font-bold tabular-nums text-[#F4F5F7]">
              {formatRestDuration(restRemaining)}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[45, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onStartRest(sec)}
              className="min-h-[38px] rounded-lg border border-white/10 bg-[#0A0B0E] font-mono text-xs font-semibold tabular-nums text-[#D1D5DB] hover:border-[#C8FF2E] hover:text-[#C8FF2E]"
            >
              {sec}
              {secUnit}
            </button>
          ))}
        </div>

        {/* Timer Controls */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAdjustRest(-15)}
            className="min-h-[42px] rounded-xl border border-white/10 bg-[#1A1E26] px-3 font-mono text-xs font-bold text-[#D1D5DB] hover:bg-[#242B37]"
          >
            -15{secUnit}
          </button>

          <button
            type="button"
            onClick={onToggleRestPause}
            className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-4 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
          >
            {restRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                {t('Jeda', 'Pause')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                {restRemaining > 0 ? t('Mulai', 'Start') : t('Ulangi', 'Restart')}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onAdjustRest(15)}
            className="min-h-[42px] rounded-xl border border-white/10 bg-[#1A1E26] px-3 font-mono text-xs font-bold text-[#D1D5DB] hover:bg-[#242B37]"
          >
            +15{secUnit}
          </button>

          <button
            type="button"
            aria-label={t('Reset timer istirahat', 'Reset rest timer')}
            onClick={onResetRest}
            className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Account Sync, Language, Tutorial & About Card */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#F4F5F7]">
              {profile.displayName}
            </p>
            <p className="truncate text-xs text-[#9CA3AF]">{profile.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A1E26] px-3 py-2 text-xs font-semibold text-[#D1D5DB] hover:border-[#DC2626]/50 hover:text-[#FCA5A5] shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('Keluar', 'Sign Out')}
          </button>
        </div>

        {/* Language Toggle Row */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#D1D5DB]">
            <Globe className="h-4 w-4 text-[#C8FF2E]" />
            {t('Bahasa', 'Language')}
          </span>
          <div
            role="group"
            aria-label={t('Pilih Bahasa', 'Select Language')}
            className="inline-flex rounded-xl border border-white/10 bg-[#0A0B0E] p-1"
          >
            <button
              type="button"
              onClick={() => setLang('id')}
              className={`min-h-[32px] rounded-lg px-3 text-xs font-bold transition-colors ${
                lang === 'id'
                  ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                  : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`min-h-[32px] rounded-lg px-3 text-xs font-bold transition-colors ${
                lang === 'en'
                  ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                  : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onOpenTutorial}
            className="flex min-h-[42px] w-full items-center justify-between rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 py-2 text-xs font-semibold text-[#D1D5DB] transition-colors hover:border-[#C8FF2E]/40 hover:text-[#C8FF2E]"
          >
            <span className="inline-flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-[#C8FF2E]" />
              {t('Panduan Fitur (5 Langkah)', 'Feature Guide (5 Steps)')}
            </span>
            <span className="font-mono text-[11px] text-[#9CA3AF]">
              {t('Tutorial', 'Guide')}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className={`flex min-h-[42px] w-full items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
              isSettingsActive
                ? 'border-[#C8FF2E] bg-[#C8FF2E]/12 text-[#C8FF2E]'
                : 'border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25 hover:text-[#F4F5F7]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#C8FF2E]" />
              {t('Pengaturan Jam, Tema & Alarm', 'Clock, Theme & Alarm Settings')}
            </span>
            <span className="font-mono text-[11px] text-[#9CA3AF]">
              {clockFormat.toUpperCase()}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenAbout}
            className={`flex min-h-[42px] w-full items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
              isAboutActive
                ? 'border-[#C8FF2E] bg-[#C8FF2E]/12 text-[#C8FF2E]'
                : 'border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25 hover:text-[#F4F5F7]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Info className="h-4 w-4 text-[#C8FF2E]" />
              {t('Tentang IronPulse & Fitur Upcoming', 'About IronPulse & Roadmap')}
            </span>
            <span className="font-mono text-[11px] text-[#9CA3AF]">Roadmap</span>
          </button>
        </div>
      </section>

      <div className="hidden lg:block">
        <PWAInstallCard />
      </div>
    </aside>
  );
}
