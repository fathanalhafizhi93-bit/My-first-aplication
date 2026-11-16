import { Bell, BellOff, ChevronRight } from 'lucide-react';
import { BUILTIN_RINGTONES } from '../lib/audioEngine';
import {
  CustomRingtone,
  DAY_LIST,
  DayKey,
  DaySchedule,
} from '../types/gym';

interface WeeklyScheduleViewProps {
  todayDayKey: DayKey;
  schedules: Record<DayKey, DaySchedule>;
  customRingtones: CustomRingtone[];
  onUpdateSchedule: (
    dayKey: DayKey,
    patch: Partial<
      Pick<
        DaySchedule,
        'isGymDay' | 'alarmEnabled' | 'alarmTime' | 'focusTitle' | 'ringtoneId'
      >
    >
  ) => Promise<void>;
  onOpenExerciseManager: (dayKey: DayKey) => void;
}

export function WeeklyScheduleView({
  todayDayKey,
  schedules,
  customRingtones,
  onUpdateSchedule,
  onOpenExerciseManager,
}: WeeklyScheduleViewProps) {
  const activeGymDaysCount = DAY_LIST.filter((d) => schedules[d.key]?.isGymDay).length;
  const activeAlarmsCount = DAY_LIST.filter(
    (d) => schedules[d.key]?.isGymDay && schedules[d.key]?.alarmEnabled
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
            Pengaturan Jadwal Hari &amp; Alarm
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Pilih hari aktif gym Anda dari Senin sampai Minggu, atur jam pengingat, fokus otot,
            dan ringtone khusus tiap hari.
          </p>
        </div>
        <div className="text-xs font-medium text-[#D1D5DB] whitespace-nowrap">
          <span className="font-mono tabular-nums text-[#C8FF2E]">{activeGymDaysCount}/7</span>{' '}
          Hari Gym ·{' '}
          <span className="font-mono tabular-nums text-[#C8FF2E]">{activeAlarmsCount}</span> Alarm
          Aktif
        </div>
      </div>

      <div className="space-y-3">
        {DAY_LIST.map((day) => {
          const sched = schedules[day.key];
          if (!sched) return null;
          const isToday = day.key === todayDayKey;

          return (
            <div
              key={day.key}
              className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                sched.isGymDay
                  ? 'border-white/12 bg-[#13161C]'
                  : 'border-white/5 bg-[#13161C]/50'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Day Title & Gym Day Toggle */}
                <div className="flex items-center justify-between gap-4 lg:w-56 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
                        {day.label}
                      </h2>
                      {isToday && (
                        <span className="text-xs font-semibold text-[#C8FF2E]">
                          · Hari Ini
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9CA3AF]">
                      {sched.isGymDay
                        ? `${sched.exercises.length} gerakan terjadwal`
                        : 'Rest Day'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSchedule(day.key, {
                        isGymDay: !sched.isGymDay,
                        alarmEnabled: !sched.isGymDay ? true : false,
                      })
                    }
                    className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                      sched.isGymDay
                        ? 'bg-[#C8FF2E] text-[#0A0B0E]'
                        : 'border border-white/15 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {sched.isGymDay ? 'Hari Gym' : 'Rest Day'}
                  </button>
                </div>

                {/* Schedule Fields when Gym Day is active */}
                {sched.isGymDay ? (
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                    {/* Focus Title */}
                    <div className="sm:col-span-5">
                      <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
                        Fokus Latihan
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        defaultValue={sched.focusTitle}
                        key={`${day.key}-${sched.focusTitle}`}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val !== sched.focusTitle) {
                            void onUpdateSchedule(day.key, { focusTitle: val });
                          }
                        }}
                        placeholder="Misal: Push — Dada & Bahu"
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
                      />
                    </div>

                    {/* Alarm Time + Toggle */}
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
                        Jam Pengingat
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={sched.alarmTime}
                          onChange={(e) => {
                            if (e.target.value) {
                              void onUpdateSchedule(day.key, {
                                alarmTime: e.target.value,
                              });
                            }
                          }}
                          className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm font-semibold tabular-nums text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
                        />
                        <button
                          type="button"
                          aria-label={`Toggle alarm hari ${day.label}`}
                          onClick={() =>
                            onUpdateSchedule(day.key, {
                              alarmEnabled: !sched.alarmEnabled,
                            })
                          }
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                            sched.alarmEnabled
                              ? 'border-[#C8FF2E]/50 bg-[#C8FF2E]/15 text-[#C8FF2E]'
                              : 'border-white/10 bg-[#1A1E26] text-[#6B7280]'
                          }`}
                        >
                          {sched.alarmEnabled ? (
                            <Bell className="h-4 w-4" />
                          ) : (
                            <BellOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Per-day Ringtone */}
                    <div className="sm:col-span-4">
                      <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
                        Ringtone Hari Ini
                      </label>
                      <select
                        value={sched.ringtoneId}
                        onChange={(e) =>
                          onUpdateSchedule(day.key, { ringtoneId: e.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-[#C8FF2E] focus:outline-none"
                      >
                        <option value="default">Gunakan Ringtone Utama</option>
                        <optgroup label="Nada Bawaan">
                          {BUILTIN_RINGTONES.map((rt) => (
                            <option key={rt.id} value={rt.id}>
                              {rt.name}
                            </option>
                          ))}
                        </optgroup>
                        {customRingtones.length > 0 && (
                          <optgroup label="Ringtone Upload Sendiri">
                            {customRingtones.map((rt) => (
                              <option key={rt.id} value={rt.id}>
                                {rt.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-[#6B7280]">
                    Alarm dinonaktifkan pada hari istirahat. Klik tombol di samping untuk
                    menjadikan {day.label} sebagai Hari Gym.
                  </div>
                )}

                {/* Jump to Exercise Editor */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenExerciseManager(day.key)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#1A1E26] px-4 py-2 text-xs font-semibold text-[#F4F5F7] hover:bg-[#242B37] lg:w-auto whitespace-nowrap"
                  >
                    Atur Gerakan
                    <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
