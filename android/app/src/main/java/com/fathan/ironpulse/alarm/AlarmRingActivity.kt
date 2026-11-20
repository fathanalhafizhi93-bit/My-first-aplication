package com.fathan.ironpulse.alarm

import android.app.NotificationManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Alarm
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.Snooze
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fathan.ironpulse.MainActivity
import com.fathan.ironpulse.audio.NativeAudioEngine
import com.fathan.ironpulse.data.PreferencesStore
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.ui.theme.IronPulseTheme
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens

class AlarmRingActivity : ComponentActivity() {

    private var audioEngine: NativeAudioEngine? = null
    private var vibrator: Vibrator? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        configureLockScreenWindow()

        val prefsStore = PreferencesStore(this)
        val dayKey = intent.getStringExtra(AlarmScheduler.EXTRA_DAY_KEY) ?: "mon"
        val focusTitle = intent.getStringExtra(AlarmScheduler.EXTRA_FOCUS_TITLE) ?: "Waktunya Latihan!"
        val alarmTime = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_TIME) ?: "06:30"
        val snoozeMin = intent.getIntExtra(AlarmScheduler.EXTRA_SNOOZE_MINUTES, 5).coerceIn(1, 60)
        val volume = intent.getFloatExtra(AlarmScheduler.EXTRA_VOLUME, 0.85f).coerceIn(0.1f, 1f)
        val ringtoneId = intent.getStringExtra(AlarmScheduler.EXTRA_RINGTONE_ID)
            ?.ifBlank { AlarmScheduler.getDefaultRingtoneId(this) }
            ?: AlarmScheduler.getDefaultRingtoneId(this)

        val (_, ringtoneDisplayName) = GymModelHelpers.resolveRingtoneName(
            ringtoneId = ringtoneId,
            defaultRingtoneId = AlarmScheduler.getDefaultRingtoneId(this),
            customRingtones = emptyList()
        )

        startAlarmSoundAndVibration(ringtoneId, volume, prefsStore.state.value.hapticsEnabled)

        setContent {
            val prefs by prefsStore.state.collectAsStateWithLifecycle()
            val timePhase = GymModelHelpers.resolveDayTimePhase(prefs.todayThemeMode)
            val lang = prefs.lang
            fun t(id: String, en: String) = lang.t(id, en)

            IronPulseTheme(prefs = prefs, timePhase = timePhase) {
                val tokens = LocalIronPulseTokens.current
                val pulseTransition = rememberInfiniteTransition(label = "alarmPulse")
                val scale by pulseTransition.animateFloat(
                    initialValue = 0.94f,
                    targetValue = 1.09f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(durationMillis = 850),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "pulseScale"
                )

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = tokens.canvasBg
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(
                                        tokens.accentColor.copy(alpha = 0.16f),
                                        tokens.canvasBg
                                    )
                                )
                            )
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 24.dp, vertical = 48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = t("ALARM LATIHAN IRONPULSE", "IRONPULSE WORKOUT ALARM"),
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.8.sp,
                                    color = tokens.accentColor
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = GymModelHelpers.formatAlarmTime(alarmTime, prefs.clockFormat, lang),
                                    style = MaterialTheme.typography.displayMedium.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.ExtraBold
                                    ),
                                    color = tokens.palette.onSurface
                                )
                            }

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(148.dp)
                                        .scale(if (prefs.performance.noAnimations) 1f else scale)
                                        .background(
                                            color = tokens.accentColor.copy(alpha = 0.18f),
                                            shape = CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(102.dp)
                                            .background(
                                                color = tokens.accentColor,
                                                shape = CircleShape
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Rounded.Alarm,
                                            contentDescription = "Alarm Latihan",
                                            tint = tokens.onAccentColor,
                                            modifier = Modifier.size(48.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(28.dp))
                                Text(
                                    text = focusTitle,
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.ExtraBold,
                                    textAlign = TextAlign.Center,
                                    color = tokens.palette.onSurface
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = t(
                                        "Siapkan perlengkapan dan mulai pemanasan.",
                                        "Grab your gear and start warming up."
                                    ),
                                    style = MaterialTheme.typography.bodyMedium,
                                    textAlign = TextAlign.Center,
                                    color = tokens.palette.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(14.dp))
                                Surface(
                                    shape = RoundedCornerShape(999.dp),
                                    color = tokens.palette.surfaceContainerHigh,
                                    border = BorderStroke(1.dp, tokens.surfaceBorderColor)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Rounded.MusicNote,
                                            contentDescription = null,
                                            tint = tokens.accentColor,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Text(
                                            text = ringtoneDisplayName,
                                            style = MaterialTheme.typography.labelMedium,
                                            color = tokens.palette.onSurface
                                        )
                                    }
                                }
                            }

                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = {
                                        stopAlarmEffects()
                                        val launch = Intent(this@AlarmRingActivity, MainActivity::class.java).apply {
                                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                                            putExtra(MainActivity.EXTRA_OPEN_WORKOUT, true)
                                        }
                                        startActivity(launch)
                                        finish()
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(56.dp),
                                    shape = RoundedCornerShape(tokens.buttonRadius),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = tokens.accentColor,
                                        contentColor = tokens.onAccentColor
                                    )
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.FitnessCenter,
                                        contentDescription = null
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = t("Matikan & Mulai Latihan", "Dismiss & Start Workout"),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                OutlinedButton(
                                    onClick = {
                                        stopAlarmEffects()
                                        AlarmScheduler.scheduleSnooze(
                                            context = this@AlarmRingActivity,
                                            dayKey = dayKey,
                                            focusTitle = focusTitle,
                                            snoozeMinutes = snoozeMin,
                                            volume = volume,
                                            ringtoneId = ringtoneId
                                        )
                                        finish()
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(50.dp),
                                    shape = RoundedCornerShape(tokens.buttonRadius),
                                    border = BorderStroke(1.dp, tokens.surfaceBorderColor)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.Snooze,
                                        contentDescription = null,
                                        tint = tokens.palette.onSurface
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = if (lang == AppLanguage.EN) "Snooze $snoozeMin Min" else "Tunda $snoozeMin Menit",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = tokens.palette.onSurface
                                    )
                                }

                                TextButton(
                                    onClick = {
                                        stopAlarmEffects()
                                        finish()
                                    },
                                    modifier = Modifier.align(Alignment.CenterHorizontally)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.Close,
                                        contentDescription = null,
                                        tint = tokens.palette.onSurfaceVariant,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = t("Tutup Alarm", "Dismiss"),
                                        color = tokens.palette.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun configureLockScreenWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun startAlarmSoundAndVibration(ringtoneId: String, volume: Float, hapticsEnabled: Boolean) {
        val engine = NativeAudioEngine(this)
        audioEngine = engine
        engine.play(
            ringtoneId = ringtoneId,
            volume = volume,
            loop = true,
            useAlarmStream = true
        )

        if (!hapticsEnabled) return

        val vib = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as? Vibrator
        }
        vibrator = vib
        if (vib?.hasVibrator() == true) {
            val pattern = longArrayOf(0, 500, 300, 500, 500)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vib.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vib.vibrate(pattern, 0)
            }
        }
    }

    private fun stopAlarmEffects() {
        runCatching { audioEngine?.stop() }
        audioEngine = null
        runCatching { vibrator?.cancel() }
        getSystemService(NotificationManager::class.java)?.cancel(GymAlarmReceiver.NOTIFICATION_ALARM_ID)
    }

    override fun onDestroy() {
        stopAlarmEffects()
        super.onDestroy()
    }
}
