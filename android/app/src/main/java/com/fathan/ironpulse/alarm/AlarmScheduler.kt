package com.fathan.ironpulse.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.fathan.ironpulse.MainActivity
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.DaySchedule
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object AlarmScheduler {

    private const val PREFS_NAME = "ironpulse_alarm_prefs"
    private const val KEY_SCHEDULES_JSON = "weekly_alarms_json"
    private const val KEY_SNOOZE_MIN = "snooze_minutes"
    private const val KEY_VOLUME = "alarm_volume"
    private const val KEY_ENABLED = "alarms_master_enabled"
    private const val KEY_DEFAULT_RINGTONE_ID = "default_ringtone_id"
    private const val KEY_REST_RINGTONE_ID = "rest_ringtone_id"

    fun canScheduleExactAlarms(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        val am = context.getSystemService(AlarmManager::class.java) ?: return false
        return am.canScheduleExactAlarms()
    }

    fun getRestRingtoneAndVolume(context: Context): Pair<String, Float> {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val tone = prefs.getString(KEY_REST_RINGTONE_ID, "builtin_kettlebell_chime")
            ?.ifBlank { "builtin_kettlebell_chime" } ?: "builtin_kettlebell_chime"
        val vol = prefs.getFloat(KEY_VOLUME, 0.85f).coerceIn(0f, 1f)
        return tone to vol
    }

    fun getDefaultRingtoneId(context: Context): String {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEFAULT_RINGTONE_ID, "builtin_athletic_bell")
            ?.ifBlank { "builtin_athletic_bell" } ?: "builtin_athletic_bell"
    }

    fun syncWeeklyAlarms(
        context: Context,
        schedules: Map<DayKey, DaySchedule>,
        masterEnabled: Boolean,
        snoozeMinutes: Int,
        volume: Double,
        defaultRingtoneId: String = "builtin_athletic_bell",
        restRingtoneId: String = "builtin_kettlebell_chime"
    ) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val arr = JSONArray()
        for (day in DayKey.entries) {
            val s = schedules[day] ?: continue
            arr.put(
                JSONObject().apply {
                    put("dayKey", day.key)
                    put("isGymDay", s.isGymDay)
                    put("alarmEnabled", s.alarmEnabled)
                    put("alarmTime", s.alarmTime)
                    put("focusTitle", s.focusTitle)
                    put("ringtoneId", s.ringtoneId.ifBlank { "default" })
                }
            )
        }
        prefs.edit()
            .putString(KEY_SCHEDULES_JSON, arr.toString())
            .putBoolean(KEY_ENABLED, masterEnabled)
            .putInt(KEY_SNOOZE_MIN, snoozeMinutes.coerceIn(1, 60))
            .putFloat(KEY_VOLUME, volume.toFloat().coerceIn(0f, 1f))
            .putString(KEY_DEFAULT_RINGTONE_ID, defaultRingtoneId.ifBlank { "builtin_athletic_bell" })
            .putString(KEY_REST_RINGTONE_ID, restRingtoneId.ifBlank { "builtin_kettlebell_chime" })
            .apply()

        rescheduleFromPrefs(context)
    }

    fun rescheduleFromPrefs(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val rawJson = prefs.getString(KEY_SCHEDULES_JSON, null) ?: return
        val masterEnabled = prefs.getBoolean(KEY_ENABLED, true)
        val snoozeMin = prefs.getInt(KEY_SNOOZE_MIN, 5).coerceIn(1, 60)
        val volume = prefs.getFloat(KEY_VOLUME, 0.85f).coerceIn(0f, 1f)
        val defaultRingtoneId = prefs.getString(KEY_DEFAULT_RINGTONE_ID, "builtin_athletic_bell")
            ?.ifBlank { "builtin_athletic_bell" } ?: "builtin_athletic_bell"

        val am = context.getSystemService(AlarmManager::class.java) ?: return
        val parsed = runCatching { JSONArray(rawJson) }.getOrNull() ?: return

        val now = Calendar.getInstance()
        val currentDow = now.get(Calendar.DAY_OF_WEEK)

        for (day in DayKey.entries) {
            cancelDayAlarm(context, am, day)
        }

        if (!masterEnabled) return

        for (i in 0 until parsed.length()) {
            val obj = parsed.optJSONObject(i) ?: continue
            val day = DayKey.fromKey(obj.optString("dayKey"))
            val isGymDay = obj.optBoolean("isGymDay", false)
            val alarmEnabled = obj.optBoolean("alarmEnabled", false)
            val alarmTime = obj.optString("alarmTime", "06:30")
            val focusTitle = obj.optString("focusTitle", "Latihan Gym")
            val rawRingtoneId = obj.optString("ringtoneId", "default")
            val effectiveRingtoneId = if (rawRingtoneId.isBlank() || rawRingtoneId == "default") {
                defaultRingtoneId
            } else {
                rawRingtoneId
            }

            if (!isGymDay || !alarmEnabled) continue

            val parts = alarmTime.split(":")
            val hour = parts.getOrNull(0)?.toIntOrNull() ?: continue
            val minute = parts.getOrNull(1)?.toIntOrNull() ?: continue
            if (hour !in 0..23 || minute !in 0..59) continue

            val trigger = Calendar.getInstance().apply {
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
            }
            var offset = (day.calendarDayOfWeek - currentDow + 7) % 7
            if (offset == 0 && trigger.timeInMillis <= now.timeInMillis + 1500L) {
                offset = 7
            }
            trigger.add(Calendar.DAY_OF_YEAR, offset)

            val alarmPi = buildReceiverPendingIntent(
                context = context,
                requestCode = requestCodeForDay(day),
                dayKey = day.key,
                focusTitle = focusTitle,
                alarmTime = alarmTime,
                snoozeMinutes = snoozeMin,
                volume = volume,
                ringtoneId = effectiveRingtoneId,
                isSnooze = false
            )

            scheduleExactOrFallback(context, am, trigger.timeInMillis, alarmPi)
        }
    }

    fun scheduleSnooze(
        context: Context,
        dayKey: String,
        focusTitle: String,
        snoozeMinutes: Int,
        volume: Float,
        ringtoneId: String = "default"
    ) {
        val am = context.getSystemService(AlarmManager::class.java) ?: return
        val safeSnooze = snoozeMinutes.coerceIn(1, 60)
        val triggerAt = System.currentTimeMillis() + safeSnooze * 60_000L
        val effectiveRingtone = if (ringtoneId.isBlank() || ringtoneId == "default") {
            getDefaultRingtoneId(context)
        } else {
            ringtoneId
        }
        val pi = buildReceiverPendingIntent(
            context = context,
            requestCode = REQUEST_CODE_SNOOZE,
            dayKey = dayKey,
            focusTitle = focusTitle,
            alarmTime = "Snooze ${safeSnooze}m",
            snoozeMinutes = safeSnooze,
            volume = volume,
            ringtoneId = effectiveRingtone,
            isSnooze = true
        )
        scheduleExactOrFallback(context, am, triggerAt, pi)
    }

    /**
     * Schedules an end-to-end Android background alarm test in 5 seconds.
     * Returns true if Exact Alarm API is active, false if using fallback window.
     */
    fun scheduleTestAlarm5Seconds(
        context: Context,
        focusTitle: String,
        ringtoneId: String,
        volume: Float
    ): Boolean {
        val am = context.getSystemService(AlarmManager::class.java) ?: return false
        val triggerAt = System.currentTimeMillis() + 5_000L
        val hhmm = SimpleDateFormat("HH:mm", Locale.US).format(Date(triggerAt))
        val effectiveRingtone = if (ringtoneId.isBlank() || ringtoneId == "default") {
            getDefaultRingtoneId(context)
        } else {
            ringtoneId
        }
        val pi = buildReceiverPendingIntent(
            context = context,
            requestCode = REQUEST_CODE_TEST,
            dayKey = DayKey.fromCalendar(Calendar.getInstance()).key,
            focusTitle = focusTitle.ifBlank { "Tes Alarm IronPulse" },
            alarmTime = hhmm,
            snoozeMinutes = 5,
            volume = volume.coerceIn(0.1f, 1f),
            ringtoneId = effectiveRingtone,
            isSnooze = true
        )
        scheduleExactOrFallback(context, am, triggerAt, pi)
        return canScheduleExactAlarms(context)
    }

    private fun scheduleExactOrFallback(
        context: Context,
        am: AlarmManager,
        triggerAtMillis: Long,
        operationPi: PendingIntent
    ) {
        val showIntent = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (canScheduleExactAlarms(context)) {
            val scheduled = runCatching {
                val info = AlarmManager.AlarmClockInfo(triggerAtMillis, showIntent)
                am.setAlarmClock(info, operationPi)
            }.isSuccess
            if (!scheduled) {
                runCatching {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPi)
                }
            }
        } else {
            runCatching {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPi)
            }
        }
    }

    private fun cancelDayAlarm(context: Context, am: AlarmManager, day: DayKey) {
        val intent = Intent(context, GymAlarmReceiver::class.java)
        val pi = PendingIntent.getBroadcast(
            context,
            requestCodeForDay(day),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pi != null) {
            am.cancel(pi)
            pi.cancel()
        }
    }

    private fun buildReceiverPendingIntent(
        context: Context,
        requestCode: Int,
        dayKey: String,
        focusTitle: String,
        alarmTime: String,
        snoozeMinutes: Int,
        volume: Float,
        ringtoneId: String,
        isSnooze: Boolean
    ): PendingIntent {
        val intent = Intent(context, GymAlarmReceiver::class.java).apply {
            putExtra(EXTRA_DAY_KEY, dayKey)
            putExtra(EXTRA_FOCUS_TITLE, focusTitle)
            putExtra(EXTRA_ALARM_TIME, alarmTime)
            putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra(EXTRA_VOLUME, volume)
            putExtra(EXTRA_RINGTONE_ID, ringtoneId)
            putExtra(EXTRA_IS_SNOOZE, isSnooze)
        }
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun requestCodeForDay(day: DayKey): Int = 4100 + day.ordinal

    private const val REQUEST_CODE_SNOOZE = 4200
    private const val REQUEST_CODE_TEST = 4201
    const val EXTRA_DAY_KEY = "extra_day_key"
    const val EXTRA_FOCUS_TITLE = "extra_focus_title"
    const val EXTRA_ALARM_TIME = "extra_alarm_time"
    const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"
    const val EXTRA_VOLUME = "extra_volume"
    const val EXTRA_RINGTONE_ID = "extra_ringtone_id"
    const val EXTRA_IS_SNOOZE = "extra_is_snooze"
}
