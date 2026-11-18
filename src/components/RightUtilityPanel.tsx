import { Volume2 } from 'lucide-react';
import {
  formatAlarmTime,
  formatClockTime,
  NextAlarmInfo,
} from '../lib/dateUtils';
import { DayTimePhase, PHASE_THEME_TOKENS, useI18n } from '../lib/i18n';
import { PWAInstallCard } from './PWAInstallBanner';

interface RightUtilityPanelProps {
  now: Date;
  timePhase: DayTimePhase;
  nextAlarm: NextAlarmInfo | null;
  audioUnlocked: boolean;
  onUnlockAudio: () => Promise<void>;
}

export function RightUtilityPanel({
  now,
  timePhase,
  nextAlarm,
  audioUnlocked,
  onUnlockAudio,
}: RightUtilityPanelProps) {
  const { clockFormat, t } = useI18n();
  const formattedClock = formatClockTime(now, clockFormat, true);
  const phaseToken = PHASE_THEME_TOKENS[timePhase];
  const phaseLabel =
    timePhase === 'morning'
      ? t('Pagi', 'Morning')
      : timePhase === 'afternoon'
        ? t('Siang', 'Afternoon')
        : t('Malam', 'Night');

  return (
    <aside className="space-y-5">
      {/* Live Clock & Next Alarm Card */}
      <section
        className={`glass-surface rounded-2xl border p-5 transition-colors duration-500 ${phaseToken.subtleBorder}`}
      >
        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
          <span className="font-semibold uppercase tracking-wider">
            {t('Jam & Alarm Berikutnya', 'Clock & Next Alarm')} ·{' '}
            <span className={phaseToken.labelClass}>{phaseLabel}</span>
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

      <div className="hidden lg:block">
        <PWAInstallCard />
      </div>
    </aside>
  );
}
