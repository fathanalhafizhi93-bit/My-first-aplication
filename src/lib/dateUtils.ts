import { DAY_LIST, DayKey, DaySchedule } from '../types/gym';
import { AppLanguage, ClockFormat, DAY_LABELS } from './i18n';

export function getTodayDayKey(now: Date = new Date()): DayKey {
  const jsDay = now.getDay();
  const found = DAY_LIST.find((d) => d.jsDayIndex === jsDay);
  return found ? found.key : 'mon';
}

export function formatLocalDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const FULL_DATE_FORMATTERS: Record<AppLanguage, Intl.DateTimeFormat> = {
  id: new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  en: new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
};

export function formatIndonesianDate(
  now: Date = new Date(),
  lang: AppLanguage = 'id'
): string {
  return FULL_DATE_FORMATTERS[lang].format(now);
}

export function formatHHMM(now: Date = new Date()): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatHHMMSS(now: Date = new Date()): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatClockTime(
  now: Date = new Date(),
  clockFormat: ClockFormat = '24h',
  includeSeconds = true
): { timeText: string; meridiem?: 'AM' | 'PM' } {
  const rawHours = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  if (clockFormat === '12h') {
    const meridiem: 'AM' | 'PM' = rawHours >= 12 ? 'PM' : 'AM';
    const hour12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    const hh = String(hour12).padStart(2, '0');
    return {
      timeText: includeSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`,
      meridiem,
    };
  }

  const hh = String(rawHours).padStart(2, '0');
  return {
    timeText: includeSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`,
  };
}

export function formatAlarmTime(
  hhmm: string,
  clockFormat: ClockFormat = '24h'
): string {
  if (!hhmm || !hhmm.includes(':')) return hhmm;
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;

  const mm = String(Math.max(0, Math.min(59, m))).padStart(2, '0');
  if (clockFormat === '12h') {
    const meridiem = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${mm} ${meridiem}`;
  }

  return `${String(Math.max(0, Math.min(23, h))).padStart(2, '0')}:${mm}`;
}

export function formatRestDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatTimerClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatCompactDuration(totalSeconds: number, lang: AppLanguage = 'id'): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const secUnit = lang === 'en' ? 's' : 'd';
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (mins === 0) return `${secs}${secUnit}`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${String(secs).padStart(2, '0')}${secUnit}`;
}

export interface NextAlarmInfo {
  dayKey: DayKey;
  dayLabel: string;
  alarmTime: string;
  focusTitle: string;
  countdownText: string;
  isToday: boolean;
}

export function computeNextAlarm(
  schedules: Record<DayKey, DaySchedule>,
  now: Date = new Date(),
  lang: AppLanguage = 'id'
): NextAlarmInfo | null {
  const todayIndex = DAY_LIST.findIndex((d) => d.jsDayIndex === now.getDay());
  if (todayIndex === -1) return null;

  for (let offset = 0; offset < 7; offset++) {
    const meta = DAY_LIST[(todayIndex + offset) % 7];
    const sched = schedules[meta.key];
    if (!sched || !sched.isGymDay || !sched.alarmEnabled) continue;

    const [hhStr, mmStr] = sched.alarmTime.split(':');
    const target = new Date(now);
    target.setDate(now.getDate() + offset);
    target.setHours(Number(hhStr) || 0, Number(mmStr) || 0, 0, 0);

    if (target.getTime() <= now.getTime()) {
      continue;
    }

    const diffMs = target.getTime() - now.getTime();
    const totalMinutes = Math.ceil(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;

    let countdownText = '';
    if (lang === 'en') {
      if (days > 0) {
        countdownText = `in ${days}d ${hours}h`;
      } else if (hours > 0) {
        countdownText = `in ${hours}h ${mins}m`;
      } else {
        countdownText = `in ${mins}m`;
      }
    } else {
      if (days > 0) {
        countdownText = `${days} hari ${hours} jam lagi`;
      } else if (hours > 0) {
        countdownText = `${hours} jam ${mins} menit lagi`;
      } else {
        countdownText = `${mins} menit lagi`;
      }
    }

    const localizedDay = DAY_LABELS[lang][meta.key].label;
    const dayLabel =
      offset === 0
        ? lang === 'en'
          ? 'Today'
          : 'Hari Ini'
        : offset === 1
          ? lang === 'en'
            ? 'Tomorrow'
            : 'Besok'
          : localizedDay;

    return {
      dayKey: meta.key,
      dayLabel,
      alarmTime: sched.alarmTime,
      focusTitle: sched.focusTitle,
      countdownText,
      isToday: offset === 0,
    };
  }

  return null;
}
