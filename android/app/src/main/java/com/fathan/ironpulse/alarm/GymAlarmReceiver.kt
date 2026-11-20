package com.fathan.ironpulse.alarm

import android.Manifest
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.fathan.ironpulse.IronPulseApp
import com.fathan.ironpulse.R

class GymAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val dayKey = intent.getStringExtra(AlarmScheduler.EXTRA_DAY_KEY) ?: "mon"
        val focusTitle = intent.getStringExtra(AlarmScheduler.EXTRA_FOCUS_TITLE) ?: "Waktunya Latihan Gym!"
        val alarmTime = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_TIME) ?: "06:30"
        val snoozeMin = intent.getIntExtra(AlarmScheduler.EXTRA_SNOOZE_MINUTES, 5)
        val volume = intent.getFloatExtra(AlarmScheduler.EXTRA_VOLUME, 0.85f)
        val ringtoneId = intent.getStringExtra(AlarmScheduler.EXTRA_RINGTONE_ID)
            ?.ifBlank { AlarmScheduler.getDefaultRingtoneId(context) }
            ?: AlarmScheduler.getDefaultRingtoneId(context)
        val isSnooze = intent.getBooleanExtra(AlarmScheduler.EXTRA_IS_SNOOZE, false)

        if (!isSnooze) {
            AlarmScheduler.rescheduleFromPrefs(context)
        }

        val ringIntent = Intent(context, AlarmRingActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(AlarmScheduler.EXTRA_DAY_KEY, dayKey)
            putExtra(AlarmScheduler.EXTRA_FOCUS_TITLE, focusTitle)
            putExtra(AlarmScheduler.EXTRA_ALARM_TIME, alarmTime)
            putExtra(AlarmScheduler.EXTRA_SNOOZE_MINUTES, snoozeMin)
            putExtra(AlarmScheduler.EXTRA_VOLUME, volume)
            putExtra(AlarmScheduler.EXTRA_RINGTONE_ID, ringtoneId)
        }

        val fullScreenPi = PendingIntent.getActivity(
            context,
            4301,
            ringIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val canPostNotifications = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

        if (canPostNotifications) {
            val nm = context.getSystemService(NotificationManager::class.java)
            val notification = NotificationCompat.Builder(context, IronPulseApp.CHANNEL_GYM_ALARM)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("IronPulse Alarm — $alarmTime")
                .setContentText(focusTitle)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setOngoing(true)
                .setFullScreenIntent(fullScreenPi, true)
                .setContentIntent(fullScreenPi)
                .build()
            nm?.notify(NOTIFICATION_ALARM_ID, notification)
        }

        runCatching {
            context.startActivity(ringIntent)
        }
    }

    companion object {
        const val NOTIFICATION_ALARM_ID = 7001
    }
}
