package com.fathan.ironpulse.model

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

enum class DayKey(
    val key: String,
    val label: String,
    val shortLabel: String,
    val calendarDayOfWeek: Int
) {
    MON("mon", "Senin", "SEN", Calendar.MONDAY),
    TUE("tue", "Selasa", "SEL", Calendar.TUESDAY),
    WED("wed", "Rabu", "RAB", Calendar.WEDNESDAY),
    THU("thu", "Kamis", "KAM", Calendar.THURSDAY),
    FRI("fri", "Jumat", "JUM", Calendar.FRIDAY),
    SAT("sat", "Sabtu", "SAB", Calendar.SATURDAY),
    SUN("sun", "Minggu", "MIN", Calendar.SUNDAY);

    companion object {
        fun fromKey(raw: String?): DayKey =
            entries.firstOrNull { it.key == raw } ?: MON

        fun fromCalendar(calendar: Calendar): DayKey {
            val dow = calendar.get(Calendar.DAY_OF_WEEK)
            return entries.firstOrNull { it.calendarDayOfWeek == dow } ?: MON
        }
    }
}

enum class MuscleGroup(val label: String) {
    DADA("Dada"),
    PUNGGUNG("Punggung"),
    BAHU("Bahu"),
    KAKI("Kaki"),
    LENGAN("Lengan"),
    CORE("Core"),
    KARDIO("Kardio");

    companion object {
        fun fromLabel(raw: String?): MuscleGroup =
            entries.firstOrNull { it.label.equals(raw, ignoreCase = true) } ?: DADA
    }
}

enum class ExerciseTrackingMode(val wireValue: String) {
    REPS("reps"),
    TIMER("timer");

    companion object {
        fun fromWire(raw: String?): ExerciseTrackingMode =
            if (raw == "timer") TIMER else REPS
    }
}

enum class TimerDirection(val wireValue: String) {
    COUNTDOWN("countdown"),
    COUNTUP("countup");

    companion object {
        fun fromWire(raw: String?): TimerDirection =
            if (raw == "countup") COUNTUP else COUNTDOWN
    }
}

data class ExerciseItem(
    val id: String,
    val name: String,
    val muscleGroup: MuscleGroup,
    val equipment: String,
    val targetSets: Int,
    val targetReps: String,
    val targetWeightKg: Double,
    val restSeconds: Int,
    val notes: String,
    val trackingMode: ExerciseTrackingMode = ExerciseTrackingMode.REPS,
    val usesWeight: Boolean = true,
    val timerDirection: TimerDirection = TimerDirection.COUNTDOWN,
    val targetDurationSeconds: Int = 60
)

data class DaySchedule(
    val userId: String,
    val dayKey: DayKey,
    val isGymDay: Boolean,
    val alarmEnabled: Boolean,
    val alarmTime: String,
    val focusTitle: String,
    val ringtoneId: String = "default",
    val exercises: List<ExerciseItem> = emptyList()
)

data class WorkoutSetLog(
    val setNumber: Int,
    val weightKg: Double,
    val reps: Int,
    val durationSeconds: Int = 0,
    val completed: Boolean = false
)

data class WorkoutLogEntry(
    val exerciseId: String,
    val name: String,
    val muscleGroup: MuscleGroup,
    val trackingMode: ExerciseTrackingMode = ExerciseTrackingMode.REPS,
    val usesWeight: Boolean = true,
    val timerDirection: TimerDirection = TimerDirection.COUNTDOWN,
    val targetDurationSeconds: Int = 60,
    val sets: List<WorkoutSetLog> = emptyList()
)

data class WorkoutLog(
    val userId: String,
    val dateKey: String,
    val dayKey: DayKey,
    val focusTitle: String,
    val entries: List<WorkoutLogEntry> = emptyList(),
    val completed: Boolean = false
)

data class UserProfile(
    val userId: String,
    val displayName: String,
    val email: String,
    val defaultRingtoneId: String = "builtin_athletic_bell",
    val restRingtoneId: String = "builtin_kettlebell_chime",
    val volume: Double = 0.85,
    val notificationsEnabled: Boolean = false,
    val snoozeMinutes: Int = 5,
    val autoStartRestTimer: Boolean = true
)

data class NextAlarmSummary(
    val dayKey: DayKey,
    val dayLabel: String,
    val alarmTime: String,
    val focusTitle: String,
    val isToday: Boolean,
    val triggerAtMillis: Long
)

object GymModelHelpers {

    fun formatLocalDateKey(date: Date = Date()): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return sdf.format(date)
    }

    fun getTodayDayKey(): DayKey = DayKey.fromCalendar(Calendar.getInstance())

    fun sanitizeExerciseItem(item: ExerciseItem): ExerciseItem {
        val safeUsesWeight = resolveUsesWeight(
            usesWeight = item.usesWeight,
            trackingMode = item.trackingMode,
            targetWeightKg = item.targetWeightKg,
            equipment = item.equipment
        )
        val safeTargetDuration = resolveTargetDurationSeconds(
            targetDurationSeconds = item.targetDurationSeconds,
            targetReps = item.targetReps
        )
        return item.copy(
            name = item.name.trim().take(60).ifEmpty { "Gerakan Baru" },
            equipment = item.equipment.trim().take(40).ifEmpty {
                if (safeUsesWeight) "Bebas" else "Tanpa Alat"
            },
            targetSets = item.targetSets.coerceIn(1, 12),
            targetReps = item.targetReps.trim().take(20).ifEmpty { "10" },
            targetWeightKg = if (safeUsesWeight) item.targetWeightKg.coerceIn(0.0, 999.0) else 0.0,
            restSeconds = item.restSeconds.coerceIn(15, 600),
            notes = item.notes.trim().take(200),
            usesWeight = safeUsesWeight,
            targetDurationSeconds = safeTargetDuration
        )
    }

    fun resolveUsesWeight(
        usesWeight: Boolean? = null,
        trackingMode: ExerciseTrackingMode? = null,
        targetWeightKg: Double? = null,
        equipment: String? = null
    ): Boolean {
        if (usesWeight != null) return usesWeight
        if ((targetWeightKg ?: 0.0) > 0.0) return true
        if (trackingMode == ExerciseTrackingMode.TIMER) return false
        val eq = (equipment ?: "").lowercase(Locale.ROOT)
        if (eq.contains("tanpa alat") || eq.contains("bodyweight") || eq.contains("no equipment")) {
            return false
        }
        return true
    }

    fun resolveTargetDurationSeconds(
        targetDurationSeconds: Int? = null,
        targetReps: String? = null
    ): Int {
        if (targetDurationSeconds != null && targetDurationSeconds > 0) {
            return targetDurationSeconds.coerceIn(5, 10800)
        }
        val raw = (targetReps ?: "").trim().lowercase(Locale.ROOT)
        if (raw.isNotEmpty()) {
            val mmss = Regex("^(\\d{1,3}):(\\d{1,2})$").find(raw)
            if (mmss != null) {
                val m = mmss.groupValues[1].toIntOrNull() ?: 0
                val s = mmss.groupValues[2].toIntOrNull() ?: 0
                if (m * 60 + s > 0) return (m * 60 + s).coerceAtMost(10800)
            }
            val num = Regex("\\d+").find(raw)?.value?.toIntOrNull()
            if (num != null && num > 0) {
                if (raw.contains("menit") || raw.contains("min") || Regex("\\bm\\b").containsMatchIn(raw)) {
                    return (num * 60).coerceAtMost(10800)
                }
                return num.coerceAtMost(10800)
            }
        }
        return 60
    }

    fun buildEntriesFromSchedule(
        exercises: List<ExerciseItem>,
        existingEntries: List<WorkoutLogEntry> = emptyList()
    ): List<WorkoutLogEntry> {
        val existingMap = existingEntries.associateBy { it.exerciseId }
        return exercises.take(30).map { ex ->
            val safeUsesWeight = resolveUsesWeight(ex.usesWeight, ex.trackingMode, ex.targetWeightKg, ex.equipment)
            val safeDuration = resolveTargetDurationSeconds(ex.targetDurationSeconds, ex.targetReps)
            val prev = existingMap[ex.id]
            if (prev != null && prev.sets.isNotEmpty()) {
                prev.copy(
                    name = ex.name,
                    muscleGroup = ex.muscleGroup,
                    trackingMode = ex.trackingMode,
                    usesWeight = safeUsesWeight,
                    timerDirection = ex.timerDirection,
                    targetDurationSeconds = safeDuration,
                    sets = prev.sets.map { s ->
                        s.copy(
                            weightKg = if (safeUsesWeight) s.weightKg else 0.0,
                            durationSeconds = if (s.durationSeconds > 0) {
                                s.durationSeconds
                            } else if (ex.trackingMode == ExerciseTrackingMode.TIMER) {
                                safeDuration
                            } else {
                                0
                            }
                        )
                    }
                )
            } else {
                val setsCount = ex.targetSets.coerceIn(1, 12)
                val parsedReps = Regex("\\d+").find(ex.targetReps)?.value?.toIntOrNull()
                val defaultReps = if (parsedReps != null && parsedReps > 0) parsedReps else 10
                WorkoutLogEntry(
                    exerciseId = ex.id,
                    name = ex.name,
                    muscleGroup = ex.muscleGroup,
                    trackingMode = ex.trackingMode,
                    usesWeight = safeUsesWeight,
                    timerDirection = ex.timerDirection,
                    targetDurationSeconds = safeDuration,
                    sets = (1..setsCount).map { idx ->
                        WorkoutSetLog(
                            setNumber = idx,
                            weightKg = if (safeUsesWeight) ex.targetWeightKg else 0.0,
                            reps = if (ex.trackingMode == ExerciseTrackingMode.TIMER) 1 else defaultReps,
                            durationSeconds = if (ex.trackingMode == ExerciseTrackingMode.TIMER) safeDuration else 0,
                            completed = false
                        )
                    }
                )
            }
        }
    }

    fun formatRestDuration(totalSeconds: Int): String {
        val safe = totalSeconds.coerceAtLeast(0)
        val mins = safe / 60
        val secs = safe % 60
        return String.format(Locale.US, "%02d:%02d", mins, secs)
    }

    fun formatWeight(weightKg: Double): String {
        return if (weightKg % 1.0 == 0.0) {
            weightKg.toInt().toString()
        } else {
            String.format(Locale.US, "%.1f", weightKg)
        }
    }

    fun computeNextAlarm(schedules: Map<DayKey, DaySchedule>): NextAlarmSummary? {
        val now = Calendar.getInstance()
        var best: NextAlarmSummary? = null

        for (dayMeta in DayKey.entries) {
            val sched = schedules[dayMeta] ?: continue
            if (!sched.isGymDay || !sched.alarmEnabled) continue
            val parts = sched.alarmTime.split(":")
            val hour = parts.getOrNull(0)?.toIntOrNull() ?: continue
            val minute = parts.getOrNull(1)?.toIntOrNull() ?: continue
            if (hour !in 0..23 || minute !in 0..59) continue

            val candidate = Calendar.getInstance().apply {
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
            }
            val currentDow = now.get(Calendar.DAY_OF_WEEK)
            var dayOffset = (dayMeta.calendarDayOfWeek - currentDow + 7) % 7
            if (dayOffset == 0 && candidate.timeInMillis <= now.timeInMillis) {
                dayOffset = 7
            }
            candidate.add(Calendar.DAY_OF_YEAR, dayOffset)

            val summary = NextAlarmSummary(
                dayKey = dayMeta,
                dayLabel = dayMeta.label,
                alarmTime = sched.alarmTime,
                focusTitle = sched.focusTitle,
                isToday = dayOffset == 0,
                triggerAtMillis = candidate.timeInMillis
            )
            if (best == null || summary.triggerAtMillis < best.triggerAtMillis) {
                best = summary
            }
        }
        return best
    }
}
