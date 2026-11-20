import { memo } from 'react';
import { Bell, BellOff, ChevronRight } from 'lucide-react';
import { BUILTIN_RINGTONES } from '../lib/audioEngine';
import { formatAlarmTime } from '../lib/dateUtils';
import { DAY_LABELS, useI18n } from '../lib/i18n';
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

export const WeeklyScheduleView = memo(function WeeklyScheduleView({
  todayDayKey,
  schedules,
  customRingtones,
  onUpdateSchedule,
  onOpenExerciseManager,
}: WeeklyScheduleViewProps) {
  const { lang, clockFormat, t } = useI18n();
  const activeGymDaysCount = DAY_LIST.filter((d) => schedules[d.key]?.isGymDay).length;
  const activeAlarmsCount = DAY_LIST.filter(
    (d) => schedules[d.key]?.isGymDay && schedules[d.key]?.alarmEnabled
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            aria-hidden="true"
            className="mb-2 block h-[3px] w-10 rounded-full bg-pulse"
          />
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
            {t('Jadwal & Alarm Mingguan', 'Weekly Schedule & Alarms')}
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {t(
              'Pilih hari latihan Senin sampai Minggu, atur jam pengingat, dan tentukan fokus otot tiap hari.',
              'Choose training days Monday through Sunday, set reminder times, and define each day’s muscle focus.'
            )}
          </p>
        </div>
        <div className="text-xs font-medium text-[#D1D5DB] whitespace-nowrap">
          <span className="font-mono tabular-nums text-pulse">{activeGymDaysCount}/7</span>{' '}
          {t('Hari Gym', 'Gym Days')} ·{' '}
          <span className="font-mono tabular-nums text-pulse">{activeAlarmsCount}</span>{' '}
          {t('Alarm Aktif', 'Active Alarms')}
        </div>
      </div>

      <div className="space-y-3">
        {DAY_LIST.map((day) => {
          const sched = schedules[day.key];
          if (!sched) return null;
          const isToday = day.key === todayDayKey;
          const localizedDayLabel = DAY_LABELS[lang][day.key].label;

          return (
            <div
              key={day.key}
              className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                sched.isGymDay
                  ? 'glass-surface border-white/15'
                  : 'glass-surface-subtle border-white/8 opacity-80'
              }`}
            >
              {/* Row 1: Day Header + Toggle + Exercise Link */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
                      {localizedDayLabel}
                    </h2>
                    {isToday && (
                      <span className="text-xs font-semibold text-pulse">
                        · {t('Hari Ini', 'Today')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    {sched.isGymDay
                      ? `${sched.exercises.length} ${t('gerakan terjadwal', 'scheduled exercises')}`
                      : t('Hari istirahat · alarm nonaktif', 'Rest day · alarm off')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSchedule(day.key, {
                        isGymDay: !sched.isGymDay,
                        alarmEnabled: !sched.isGymDay ? true : false,
                      })
                    }
                    className={`min-h-[42px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                      sched.isGymDay
                        ? 'bg-pulse text-pulse-fg'
                        : 'border border-white/15 bg-[#1A1E26] text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {sched.isGymDay ? t('Hari Gym', 'Gym Day') : 'Rest Day'}
                  </button>

                  {sched.isGymDay && (
                    <button
                      type="button"
                      onClick={() => onOpenExerciseManager(day.key)}
                      className="inline-flex min-h-[42px] items-center gap-1 rounded-xl border border-white/10 bg-[#1A1E26] px-3.5 py-2 text-xs font-semibold text-[#F4F5F7] hover:bg-[#242B37] whitespace-nowrap"
                    >
                      {t('Gerakan', 'Exercises')}
                      <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Clean aligned inputs only when Gym Day is active */}
              {sched.isGymDay && (
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-12 sm:items-end">
                  {/* Focus Title */}
                  <div className="sm:col-span-5">
                    <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
                      {t('Fokus Latihan', 'Workout Focus')}
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      defaultValue={sched.focusTitle}
                      key={`${day.key}-${sched.focusTitle}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (!val) {
                          e.target.value = sched.focusTitle;
                          return;
                        }
                        if (val !== sched.focusTitle) {
                          void onUpdateSchedule(day.key, { focusTitle: val });
                        }
                      }}
                      placeholder={t('Misal: Push — Dada & Bahu', 'e.g. Push — Chest & Shoulders')}
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
                    />
                  </div>

                  {/* Alarm Time + Bell */}
                  <div className="sm:col-span-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="block text-[11px] font-medium text-[#9CA3AF]">
                        {t('Jam Alarm', 'Alarm Time')}
                      </label>
                      {clockFormat === '12h' && (
                        <span className="font-mono text-[11px] font-semibold tabular-nums text-pulse">
                          {formatAlarmTime(sched.alarmTime, '12h')}
                        </span>
                      )}
                    </div>
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
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 font-mono text-sm font-semibold tabular-nums text-[#F4F5F7] focus:border-pulse focus:outline-none"
                      />
                      <button
                        type="button"
                        aria-label={`${t('Toggle alarm hari', 'Toggle alarm for')} ${localizedDayLabel}`}
                        onClick={() =>
                          onUpdateSchedule(day.key, {
                            alarmEnabled: !sched.alarmEnabled,
                          })
                        }
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                          sched.alarmEnabled
                            ? 'border-pulse/50 bg-pulse/15 text-pulse'
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
                      {t('Nada Alarm', 'Alarm Tone')}
                    </label>
                    <select
                      value={
                        sched.ringtoneId === 'default' ||
                        BUILTIN_RINGTONES.some((r) => r.id === sched.ringtoneId) ||
                        customRingtones.some((r) => r.id === sched.ringtoneId)
                          ? sched.ringtoneId
                          : 'default'
                      }
                      onChange={(e) =>
                        onUpdateSchedule(day.key, { ringtoneId: e.target.value })
                      }
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F4F5F7] focus:border-pulse focus:outline-none"
                    >
                      <option value="default">
                        {t('Ikuti Ringtone Utama', 'Use Default Ringtone')}
                      </option>
                      <optgroup label={t('Nada Bawaan', 'Built-in Tones')}>
                        {BUILTIN_RINGTONES.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name}
                          </option>
                        ))}
                      </optgroup>
                      {customRingtones.length > 0 && (
                        <optgroup label={t('Ringtone Upload Sendiri', 'Uploaded Ringtones')}>
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
