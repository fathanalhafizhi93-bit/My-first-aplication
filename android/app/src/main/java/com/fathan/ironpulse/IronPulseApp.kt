package com.fathan.ironpulse

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions

class IronPulseApp : Application() {

    override fun onCreate() {
        super.onCreate()
        ensureFirebaseInitialized()
        runCatching { createNotificationChannels() }
    }

    private fun ensureFirebaseInitialized() {
        if (FirebaseApp.getApps(this).isEmpty()) {
            val options = FirebaseOptions.Builder()
                .setProjectId("gen-lang-client-0024790154")
                .setApplicationId("1:665973010974:android:3f04e185a0083073e6b40f")
                .setApiKey("AIzaSyDCmTbDu9dt1PXrnPCAsEP7iYFXTqFtwVg")
                .setStorageBucket("gen-lang-client-0024790154.firebasestorage.app")
                .setGcmSenderId("665973010974")
                .build()
            FirebaseApp.initializeApp(this, options)
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java) ?: return

        val alarmSoundUri = Uri.parse("android.resource://$packageName/${R.raw.ironpulse_alarm}")
        val alarmAudioAttrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        val alarmChannel = NotificationChannel(
            CHANNEL_GYM_ALARM,
            "Alarm Latihan Gym",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Notifikasi prioritas tinggi saat waktu jadwal latihan tiba"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 450, 220, 450, 220, 600)
            setSound(alarmSoundUri, alarmAudioAttrs)
            lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        }

        val restTimerChannel = NotificationChannel(
            CHANNEL_REST_TIMER,
            "Rest Timer Aktif",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Menampilkan hitungan mundur waktu istirahat antar set"
            setShowBadge(false)
        }

        val restAlertChannel = NotificationChannel(
            CHANNEL_REST_DONE,
            "Istirahat Selesai",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Bunyi & getaran saat waktu istirahat antar set berakhir"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 250, 120, 250)
        }

        manager.createNotificationChannels(listOf(alarmChannel, restTimerChannel, restAlertChannel))
    }

    companion object {
        const val CHANNEL_GYM_ALARM = "ironpulse_gym_alarm_v1"
        const val CHANNEL_REST_TIMER = "ironpulse_rest_timer_v1"
        const val CHANNEL_REST_DONE = "ironpulse_rest_done_v1"
    }
}
