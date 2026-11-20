package com.fathan.ironpulse.lib

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class HapticFeedbackHelper(context: Context) {

    private val appContext = context.applicationContext

    @Volatile
    var enabled: Boolean = true

    private var lastRoutineTapAt: Long = 0L

    private fun getVibrator(): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            appContext.getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            appContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    private fun vibrateOneShot(durationMs: Long, amplitude: Int) {
        if (!enabled) return
        runCatching {
            val vib = getVibrator() ?: return
            if (!vib.hasVibrator()) return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val safeAmp = if (vib.hasAmplitudeControl()) amplitude.coerceIn(1, 255) else VibrationEffect.DEFAULT_AMPLITUDE
                vib.vibrate(VibrationEffect.createOneShot(durationMs, safeAmp))
            } else {
                @Suppress("DEPRECATION")
                vib.vibrate(durationMs)
            }
        }
    }

    private fun vibrateWaveform(timings: LongArray, amplitudes: IntArray) {
        if (!enabled) return
        runCatching {
            val vib = getVibrator() ?: return
            if (!vib.hasVibrator()) return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (vib.hasAmplitudeControl()) {
                    vib.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
                } else {
                    vib.vibrate(VibrationEffect.createWaveform(timings, -1))
                }
            } else {
                @Suppress("DEPRECATION")
                vib.vibrate(timings, -1)
            }
        }
    }

    fun buttonTap() {
        val now = System.currentTimeMillis()
        if (now - lastRoutineTapAt < 28L) return
        lastRoutineTapAt = now
        vibrateOneShot(12L, 70)
    }

    fun tabSwitch() {
        vibrateOneShot(10L, 65)
    }

    fun toggle() {
        vibrateOneShot(14L, 85)
    }

    fun setComplete() {
        vibrateWaveform(
            timings = longArrayOf(0, 22, 42, 34),
            amplitudes = intArrayOf(0, 140, 0, 210)
        )
    }

    fun setUncheck() {
        vibrateOneShot(12L, 75)
    }

    fun workoutComplete() {
        vibrateWaveform(
            timings = longArrayOf(0, 30, 50, 42, 55, 70),
            amplitudes = intArrayOf(0, 150, 0, 200, 0, 255)
        )
    }

    fun cooldownBlocked() {
        vibrateWaveform(
            timings = longArrayOf(0, 32, 40, 32),
            amplitudes = intArrayOf(0, 210, 0, 210)
        )
    }

    fun timerStart() {
        vibrateOneShot(22L, 145)
    }

    fun timerPause() {
        vibrateOneShot(14L, 90)
    }

    fun timerReset() {
        vibrateWaveform(
            timings = longArrayOf(0, 14, 38, 14),
            amplitudes = intArrayOf(0, 110, 0, 110)
        )
    }

    fun timerAdjust() {
        vibrateOneShot(10L, 80)
    }

    fun timerCountdownTick() {
        vibrateOneShot(16L, 100)
    }

    fun timerFinished() {
        vibrateWaveform(
            timings = longArrayOf(0, 45, 70, 85),
            amplitudes = intArrayOf(0, 200, 0, 255)
        )
    }

    fun alarmAlert() {
        vibrateWaveform(
            timings = longArrayOf(0, 140, 80, 140, 80, 220),
            amplitudes = intArrayOf(0, 230, 0, 230, 0, 255)
        )
    }

    fun destructive() {
        vibrateWaveform(
            timings = longArrayOf(0, 35, 35, 35),
            amplitudes = intArrayOf(0, 210, 0, 210)
        )
    }

    fun orbSnap() {
        vibrateOneShot(12L, 75)
    }

    fun testPattern() {
        vibrateWaveform(
            timings = longArrayOf(0, 20, 65, 32, 75, 55),
            amplitudes = intArrayOf(0, 95, 0, 175, 0, 255)
        )
    }
}
