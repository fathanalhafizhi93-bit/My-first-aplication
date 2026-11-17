import { Capacitor, PermissionState } from '@capacitor/core';
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

const LEGACY_ALARM_CHANNEL_ID = 'ironpulse_gym_alarm';
const ALARM_CHANNEL_ID = 'ironpulse_gym_alarm_v2';
const ALARM_SOUND_ASSET = 'ironpulse_alarm.wav';
const ALARM_IDS = [1001, 1002, 1003, 1004, 1005, 1006, 1007];
const TEST_NOTIFICATION_ID = 9901;

export interface AndroidAlarmDiagnostics {
  isNativeAndroid: boolean;
  notificationPermission: PermissionState;
  exactAlarmPermission: PermissionState;
  pendingCount: number;
}

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

async function ensureAlarmChannel(): Promise<void> {
  if (!isNativeAndroid()) return;

  try {
    await LocalNotifications.deleteChannel({ id: LEGACY_ALARM_CHANNEL_ID });
  } catch {
    // ignore if legacy channel does not exist
  }

  await LocalNotifications.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Pengingat Jadwal Gym IronPulse',
    description: 'Alarm pengingat latihan harian sesuai jadwal minggu Anda',
    sound: ALARM_SOUND_ASSET,
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#C8FF2E',
  });
}

export async function getAndroidAlarmDiagnostics(): Promise<AndroidAlarmDiagnostics> {
  if (!isNativeAndroid()) {
    return {
      isNativeAndroid: false,
      notificationPermission: 'prompt',
      exactAlarmPermission: 'prompt',
      pendingCount: 0,
    };
  }

  try {
    const [perm, exact, pending] = await Promise.all([
      LocalNotifications.checkPermissions(),
      LocalNotifications.checkExactNotificationSetting(),
      LocalNotifications.getPending(),
    ]);

    return {
      isNativeAndroid: true,
      notificationPermission: perm.display,
      exactAlarmPermission: exact.exact_alarm,
      pendingCount: pending.notifications.filter((n) => ALARM_IDS.includes(n.id)).length,
    };
  } catch {
    return {
      isNativeAndroid: true,
      notificationPermission: 'prompt',
      exactAlarmPermission: 'prompt',
      pendingCount: 0,
    };
  }
}

export async function requestAndroidNotificationPermission(): Promise<PermissionState> {
  if (!isNativeAndroid()) return 'denied';
  try {
    const res = await LocalNotifications.requestPermissions();
    return res.display;
  } catch {
    return 'denied';
  }
}

export async function openAndroidExactAlarmSettings(): Promise<PermissionState> {
  if (!isNativeAndroid()) return 'denied';
  try {
    const res = await LocalNotifications.changeExactNotificationSetting();
    return res.exact_alarm;
  } catch {
    return 'denied';
  }
}

export async function scheduleAndroidTestNotification(
  delaySeconds = 5
): Promise<{ scheduledAt: Date; exact: boolean; granted: boolean }> {
  const scheduledAt = new Date(Date.now() + delaySeconds * 1000);
  if (!isNativeAndroid()) {
    return { scheduledAt, exact: false, granted: false };
  }

  const perm = await LocalNotifications.checkPermissions();
  let display = perm.display;
  if (display !== 'granted') {
    const req = await LocalNotifications.requestPermissions();
    display = req.display;
  }
  if (display !== 'granted') {
    return { scheduledAt, exact: false, granted: false };
  }

  await ensureAlarmChannel();

  try {
    await LocalNotifications.cancel({ notifications: [{ id: TEST_NOTIFICATION_ID }] });
  } catch {
    // ignore cancel error
  }

  const exactStatus = await LocalNotifications.checkExactNotificationSetting();
  const isExactGranted = exactStatus.exact_alarm === 'granted';

  const result = await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_NOTIFICATION_ID,
        title: 'Tes Alarm IronPulse',
        body: 'Notifikasi background & suara alarm Android berjalan normal.',
        channelId: ALARM_CHANNEL_ID,
        sound: ALARM_SOUND_ASSET,
        foreground: true,
        isExactNotification: isExactGranted,
        schedule: {
          at: scheduledAt,
          allowWhileIdle: true,
        },
      },
    ],
  });

  return {
    scheduledAt,
    exact: isExactGranted && !result.warning,
    granted: true,
  };
}

export async function syncNativeWeeklyAlarms(
  schedules: Record<DayKey, DaySchedule>
): Promise<{ syncedCount: number; granted: boolean; exact: boolean }> {
  if (!Capacitor.isNativePlatform()) {
    return { syncedCount: 0, granted: false, exact: false };
  }

  try {
    const perm = await LocalNotifications.checkPermissions();
    let display = perm.display;
    if (display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      display = req.display;
    }

    if (display !== 'granted') {
      return { syncedCount: 0, granted: false, exact: false };
    }

    await ensureAlarmChannel();

    let isExactGranted = false;
    if (isNativeAndroid()) {
      try {
        const exactRes = await LocalNotifications.checkExactNotificationSetting();
        isExactGranted = exactRes.exact_alarm === 'granted';
      } catch {
        isExactGranted = false;
      }
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
        sound: ALARM_SOUND_ASSET,
        foreground: true,
        isExactNotification: isExactGranted,
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

    return { syncedCount: notifications.length, granted: true, exact: isExactGranted };
  } catch (err) {
    console.warn('Native alarm sync failed:', err);
    return { syncedCount: 0, granted: false, exact: false };
  }
}
