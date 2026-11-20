package com.fathan.ironpulse.timer

import android.Manifest
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.fathan.ironpulse.IronPulseApp
import com.fathan.ironpulse.MainActivity
import com.fathan.ironpulse.R
import com.fathan.ironpulse.alarm.AlarmScheduler
import com.fathan.ironpulse.audio.NativeAudioEngine
import com.fathan.ironpulse.data.PreferencesStore
import com.fathan.ironpulse.model.GymModelHelpers
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RestTimerState(
    val isActive: Boolean = false,
    val remainingSeconds: Int = 0,
    val totalSeconds: Int = 0,
    val exerciseName: String = "",
    val completedEventTick: Long = 0L
)

class RestTimerService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var countdownJob: Job? = null
    private var finishStopJob: Job? = null
    private var endTimeMillis: Long = 0L
    private var totalSeconds: Int = 0
    private var exerciseName: String = ""
    private var audioEngine: NativeAudioEngine? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        audioEngine = NativeAudioEngine(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                finishStopJob?.cancel()
                audioEngine?.stop()
                val secs = intent.getIntExtra(EXTRA_SECONDS, 60).coerceIn(1, 600)
                val name = intent.getStringExtra(EXTRA_EXERCISE_NAME) ?: "Istirahat Set"
                startCountdown(secs, name)
            }
            ACTION_ADD_15 -> addSeconds(15)
            ACTION_STOP -> stopCountdown()
        }
        return START_NOT_STICKY
    }

    private fun startCountdown(seconds: Int, name: String) {
        totalSeconds = seconds
        exerciseName = name
        endTimeMillis = System.currentTimeMillis() + seconds * 1000L

        startForegroundWithNotification(seconds)
        countdownJob?.cancel()
        countdownJob = serviceScope.launch {
            while (true) {
                val remainingMs = endTimeMillis - System.currentTimeMillis()
                val remainingSec = ((remainingMs + 999L) / 1000L).toInt().coerceAtLeast(0)
                _state.value = _state.value.copy(
                    isActive = true,
                    remainingSeconds = remainingSec,
                    totalSeconds = totalSeconds,
                    exerciseName = exerciseName
                )
                updateNotification(remainingSec)
                if (remainingMs <= 0L) {
                    onCountdownFinished()
                    break
                }
                delay(250L)
            }
        }
    }

    private fun addSeconds(delta: Int) {
        if (!_state.value.isActive) return
        endTimeMillis += delta * 1000L
        totalSeconds = (totalSeconds + delta).coerceAtLeast(1)
        val remainingSec = (((endTimeMillis - System.currentTimeMillis()) + 999L) / 1000L).toInt().coerceAtLeast(1)
        _state.value = _state.value.copy(
            remainingSeconds = remainingSec,
            totalSeconds = totalSeconds
        )
        updateNotification(remainingSec)
    }

    private fun onCountdownFinished() {
        triggerCompletionFeedback()
        _state.value = _state.value.copy(
            isActive = false,
            remainingSeconds = 0,
            completedEventTick = _state.value.completedEventTick + 1L
        )
        countdownJob?.cancel()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        finishStopJob?.cancel()
        finishStopJob = serviceScope.launch {
            delay(1800L)
            stopSelf()
        }
    }

    private fun stopCountdown() {
        countdownJob?.cancel()
        finishStopJob?.cancel()
        audioEngine?.stop()
        _state.value = _state.value.copy(isActive = false, remainingSeconds = 0)
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun startForegroundWithNotification(remainingSec: Int) {
        val notification = buildNotification(remainingSec)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            ServiceCompat.startForeground(
                this,
                NOTIF_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }

    private fun updateNotification(remainingSec: Int) {
        val canNotify = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        if (!canNotify) return
        getSystemService(NotificationManager::class.java)?.notify(NOTIF_ID, buildNotification(remainingSec))
    }

    private fun buildNotification(remainingSec: Int): android.app.Notification {
        val openAppPi = PendingIntent.getActivity(
            this,
            5001,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val add15Pi = PendingIntent.getService(
            this,
            5002,
            Intent(this, RestTimerService::class.java).apply { action = ACTION_ADD_15 },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val skipPi = PendingIntent.getService(
            this,
            5003,
            Intent(this, RestTimerService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, IronPulseApp.CHANNEL_REST_TIMER)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Istirahat: ${GymModelHelpers.formatRestDuration(remainingSec)}")
            .setContentText(exerciseName.ifEmpty { "Bersiap untuk set berikutnya" })
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(openAppPi)
            .addAction(0, "+15d", add15Pi)
            .addAction(0, "Lewati", skipPi)
            .build()
    }

    private fun triggerCompletionFeedback() {
        val (restToneId, volume) = AlarmScheduler.getRestRingtoneAndVolume(this)
        val hapticsEnabled = PreferencesStore(this).state.value.hapticsEnabled

        runCatching {
            audioEngine?.play(
                ringtoneId = restToneId,
                volume = volume,
                loop = false,
                useAlarmStream = false
            )
        }

        if (!hapticsEnabled) return

        val vib = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as? Vibrator
        }
        if (vib?.hasVibrator() == true) {
            val pattern = longArrayOf(0, 220, 120, 220)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vib.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vib.vibrate(pattern, -1)
            }
        }
    }

    override fun onDestroy() {
        countdownJob?.cancel()
        finishStopJob?.cancel()
        runCatching { audioEngine?.stop() }
        audioEngine = null
        serviceScope.cancel()
        super.onDestroy()
    }

    companion object {
        private val _state = MutableStateFlow(RestTimerState())
        val state: StateFlow<RestTimerState> = _state.asStateFlow()

        private const val NOTIF_ID = 7101
        private const val ACTION_START = "com.fathan.ironpulse.timer.START"
        private const val ACTION_ADD_15 = "com.fathan.ironpulse.timer.ADD_15"
        private const val ACTION_STOP = "com.fathan.ironpulse.timer.STOP"
        private const val EXTRA_SECONDS = "extra_seconds"
        private const val EXTRA_EXERCISE_NAME = "extra_exercise_name"

        fun start(context: Context, seconds: Int, exerciseName: String) {
            val intent = Intent(context, RestTimerService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_SECONDS, seconds)
                putExtra(EXTRA_EXERCISE_NAME, exerciseName)
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun add15Seconds(context: Context) {
            if (!_state.value.isActive) return
            val intent = Intent(context, RestTimerService::class.java).apply {
                action = ACTION_ADD_15
            }
            context.startService(intent)
        }

        fun stop(context: Context) {
            if (!_state.value.isActive) return
            val intent = Intent(context, RestTimerService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
