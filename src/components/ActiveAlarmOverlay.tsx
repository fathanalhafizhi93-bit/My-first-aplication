import { BellRing, Clock, Play, VolumeX } from 'lucide-react';
import { formatAlarmTime, formatCompactDuration } from '../lib/dateUtils';
import { useI18n } from '../lib/i18n';
import {
  DaySchedule,
  resolveExerciseTrackingMode,
  resolveTargetDurationSeconds,
} from '../types/gym';
import { ModalPortal, useBodyScrollLock } from './ModalPortal';

interface ActiveAlarmOverlayProps {
  schedule: DaySchedule;
  snoozeMinutes: number;
  ringtoneName: string;
  isTest: boolean;
  onStartWorkout: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export function ActiveAlarmOverlay({
  schedule,
  snoozeMinutes,
  ringtoneName,
  isTest,
  onStartWorkout,
  onSnooze,
  onDismiss,
}: ActiveAlarmOverlayProps) {
  const { lang, clockFormat, t } = useI18n();
  useBodyScrollLock(true);

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alarm-title"
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      >
        <div className="glass-surface max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-pulse/40 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-pulse">
          <span>
            {isTest
              ? t('Pratinjau Alarm Gym', 'Gym Alarm Preview')
              : t('Waktunya Latihan Gym', 'Time for Gym Workout')}
          </span>
          <span className="font-mono tabular-nums text-[#F4F5F7]">
            {formatAlarmTime(schedule.alarmTime, clockFormat)}
          </span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pulse text-pulse-fg">
            <BellRing className="h-7 w-7 animate-bounce" />
          </div>
          <div>
            <h2
              id="alarm-title"
              className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]"
            >
              {schedule.focusTitle}
            </h2>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              {schedule.exercises.length} {t('gerakan terjadwal', 'scheduled exercises')} ·{' '}
              {t('Nada:', 'Tone:')} {ringtoneName}
            </p>
          </div>
        </div>

        {schedule.exercises.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-[#9CA3AF]">
              {t('Gerakan pembuka hari ini:', "Today's opening exercises:")}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-[#E5E7EB]">
              {schedule.exercises.slice(0, 4).map((ex, idx) => {
                const isTimer = resolveExerciseTrackingMode(ex) === 'timer';
                const targetText = isTimer
                  ? `${ex.targetSets}×${formatCompactDuration(
                      resolveTargetDurationSeconds(ex),
                      lang
                    )}`
                  : `${ex.targetSets}×${ex.targetReps}`;
                return (
                  <li key={ex.id} className="flex items-center justify-between">
                    <span className="truncate pr-3">
                      {idx + 1}. {ex.name}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-[#9CA3AF] shrink-0">
                      {targetText}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStartWorkout}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-pulse px-5 py-3 text-sm font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            {t('Mulai Latihan', 'Start Workout')}
          </button>

          <button
            type="button"
            onClick={onSnooze}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#1A1E26] px-4 py-3 text-sm font-semibold text-[#F4F5F7] transition-colors hover:bg-[#222834]"
          >
            <Clock className="h-4 w-4" />
            {t('Tunda', 'Snooze')} {snoozeMinutes}m
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/15 px-4 py-3 text-sm font-semibold text-[#FCA5A5] transition-colors hover:bg-[#DC2626]/25"
          >
            <VolumeX className="h-4 w-4" />
            {t('Matikan', 'Dismiss')}
          </button>
        </div>
        </div>
      </div>
    </ModalPortal>
  );
}
