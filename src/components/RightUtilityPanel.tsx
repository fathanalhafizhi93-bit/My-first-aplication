import { HelpCircle, Info, LogOut, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import {
  formatHHMMSS,
  formatRestDuration,
  NextAlarmInfo,
} from '../lib/dateUtils';
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
  onOpenAbout: () => void;
  onOpenTutorial: () => void;
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
  onOpenAbout,
  onOpenTutorial,
  isAboutActive,
}: RightUtilityPanelProps) {
  const progressRatio =
    restTotalSeconds > 0
      ? Math.max(0, Math.min(1, restRemaining / restTotalSeconds))
      : 0;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <aside className="space-y-5">
      {/* Live Clock & Next Alarm Card */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
          <span className="font-semibold uppercase tracking-wider">Jam &amp; Alarm Berikutnya</span>
          {!audioUnlocked && (
            <button
              type="button"
              onClick={onUnlockAudio}
              className="inline-flex items-center gap-1 font-semibold text-[#C8FF2E] hover:underline"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Aktifkan Audio
            </button>
          )}
        </div>

        <p className="mt-2 font-mono text-4xl font-bold tracking-tight tabular-nums text-[#F4F5F7]">
          {formatHHMMSS(now)}
        </p>

        {nextAlarm ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-[#F4F5F7]">
                {nextAlarm.dayLabel} ·{' '}
                <span className="font-mono tabular-nums text-[#C8FF2E]">
                  {nextAlarm.alarmTime}
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
            Belum ada alarm aktif. Aktifkan di tab Jadwal.
          </div>
        )}
      </section>

      {/* Inter-Set Rest Timer */}
      <section className="rounded-2xl border border-white/10 bg-[#13161C] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#F4F5F7]">
            Timer Istirahat
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
              {sec}d
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
            -15d
          </button>

          <button
            type="button"
            onClick={onToggleRestPause}
            className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-4 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
          >
            {restRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                Jeda
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                {restRemaining > 0 ? 'Mulai' : 'Ulangi'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onAdjustRest(15)}
            className="min-h-[42px] rounded-xl border border-white/10 bg-[#1A1E26] px-3 font-mono text-xs font-bold text-[#D1D5DB] hover:bg-[#242B37]"
          >
            +15d
          </button>

          <button
            type="button"
            aria-label="Reset timer istirahat"
            onClick={onResetRest}
            className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-white/10 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Account Sync, Tutorial & About Card */}
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
            Keluar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onOpenTutorial}
            className="flex min-h-[42px] w-full items-center justify-between rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 py-2 text-xs font-semibold text-[#D1D5DB] transition-colors hover:border-[#C8FF2E]/40 hover:text-[#C8FF2E]"
          >
            <span className="inline-flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-[#C8FF2E]" />
              Panduan Fitur (5 Langkah)
            </span>
            <span className="font-mono text-[11px] text-[#9CA3AF]">Tutorial</span>
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
              Tentang IronPulse &amp; Fitur Upcoming
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
