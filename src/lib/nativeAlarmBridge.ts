import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { DAY_LIST, DayKey, DaySchedule } from '../types/gym';

// Capacitor Weekday enum: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
const DAY_TO_CAP_WEEKDAY: Record<DayKey, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

const ALARM_CHANNEL_ID = 'ironpulse_gym_alarm';
const ALARM_IDS = [1001, 1002, 1003, 1004, 1005, 1006, 1007];

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function syncNativeWeeklyAlarms(
  schedules: Record<DayKey, DaySchedule>
): Promise<{ syncedCount: number; granted: boolean }> {
  if (!Capacitor.isNativePlatform()) {
    return { syncedCount: 0, granted: false };
  }

  try {
    const perm = await LocalNotifications.checkPermissions();
    let display = perm.display;
    if (display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      display = req.display;
    }

    if (display !== 'granted') {
      return { syncedCount: 0, granted: false };
    }

    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: ALARM_CHANNEL_ID,
        name: 'Pengingat Jadwal Gym IronPulse',
        description: 'Alarm pengingat latihan harian sesuai jadwal minggu Anda',
        importance: 5,
        visibility: 1,
        vibration: true,
      });
    }

    await LocalNotifications.cancel({
      notifications: ALARM_IDS.map((id) => ({ id })),
    });

    const notifications = DAY_LIST.map((dayMeta, idx) => {
      const sched = schedules[dayMeta.key];
      if (!sched || !sched.isGymDay || !sched.alarmEnabled) return null;

      const [hhStr, mmStr] = sched.alarmTime.split(':');
      const hour = Number(hhStr);
      const minute = Number(mmStr);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

      return {
        id: ALARM_IDS[idx],
        title: `Waktunya Gym (${dayMeta.label} ${sched.alarmTime})`,
        body: `${sched.focusTitle} · ${sched.exercises.length} gerakan siap dikerjakan.`,
        channelId: ALARM_CHANNEL_ID,
        schedule: {
          on: {
            weekday: DAY_TO_CAP_WEEKDAY[dayMeta.key],
            hour,
            minute,
          },
          repeats: true,
          allowWhileIdle: true,
        },
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }

    return { syncedCount: notifications.length, granted: true };
  } catch (err) {
    console.warn('Native alarm sync failed:', err);
    return { syncedCount: 0, granted: false };
  }
}
