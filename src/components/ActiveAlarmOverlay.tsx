import { BellRing, Clock, Play, VolumeX } from 'lucide-react';
import { DaySchedule } from '../types/gym';

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
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#C8FF2E]/40 bg-[#13161C] p-6 sm:p-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-[#C8FF2E]">
          <span>{isTest ? 'Pratinjau Alarm Gym' : 'Waktunya Latihan Gym'}</span>
          <span className="font-mono tabular-nums text-[#F4F5F7]">{schedule.alarmTime}</span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#C8FF2E] text-[#0A0B0E]">
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
              {schedule.exercises.length} gerakan terjadwal · Nada: {ringtoneName}
            </p>
          </div>
        </div>

        {schedule.exercises.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-[#9CA3AF]">Gerakan pembuka hari ini:</p>
            <ul className="mt-2 space-y-1.5 text-sm text-[#E5E7EB]">
              {schedule.exercises.slice(0, 4).map((ex, idx) => (
                <li key={ex.id} className="flex items-center justify-between">
                  <span className="truncate pr-3">
                    {idx + 1}. {ex.name}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[#9CA3AF] shrink-0">
                    {ex.targetSets}×{ex.targetReps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStartWorkout}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#C8FF2E] px-5 py-3 text-sm font-bold text-[#0A0B0E] transition-transform hover:brightness-105 active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            Mulai Latihan
          </button>

          <button
            type="button"
            onClick={onSnooze}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#1A1E26] px-4 py-3 text-sm font-semibold text-[#F4F5F7] transition-colors hover:bg-[#222834]"
          >
            <Clock className="h-4 w-4" />
            Tunda {snoozeMinutes}m
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/15 px-4 py-3 text-sm font-semibold text-[#FCA5A5] transition-colors hover:bg-[#DC2626]/25"
          >
            <VolumeX className="h-4 w-4" />
            Matikan
          </button>
        </div>
      </div>
    </div>
  );
}
