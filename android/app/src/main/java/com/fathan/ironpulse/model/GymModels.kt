package com.fathan.ironpulse.model

import androidx.compose.runtime.Immutable
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

enum class AppLanguage(val wireValue: String, val displayName: String) {
    ID("id", "Bahasa Indonesia"),
    EN("en", "English");

    fun t(idText: String, enText: String): String = if (this == EN) enText else idText

    companion object {
        fun fromWire(raw: String?): AppLanguage = if (raw == "en") EN else ID
    }
}

enum class ClockFormat(val wireValue: String) {
    H24("24h"),
    H12("12h");

    companion object {
        fun fromWire(raw: String?): ClockFormat = if (raw == "12h") H12 else H24
    }
}

enum class DayTimeMode(val wireValue: String) {
    AUTO("auto"),
    MORNING("morning"),
    AFTERNOON("afternoon"),
    NIGHT("night");

    companion object {
        fun fromWire(raw: String?): DayTimeMode =
            entries.firstOrNull { it.wireValue == raw } ?: AUTO
    }
}

enum class DayTimePhase(val wireValue: String) {
    MORNING("morning"),
    AFTERNOON("afternoon"),
    NIGHT("night");

    fun label(lang: AppLanguage): String = when (this) {
        MORNING -> lang.t("Pagi", "Morning")
        AFTERNOON -> lang.t("Siang / Sore", "Afternoon")
        NIGHT -> lang.t("Malam", "Night")
    }
}

enum class UiTheme(
    val wireValue: String,
    val titleId: String,
    val titleEn: String,
    val subtitleId: String,
    val subtitleEn: String
) {
    MATERIAL_YOU(
        wireValue = "material-you",
        titleId = "Material You (M3)",
        titleEn = "Material You (M3)",
        subtitleId = "Lapisan tonal dinamis Android 14/15 & tombol pil ekspresif",
        subtitleEn = "Dynamic Android 14/15 tonal surface ladder & expressive pill controls"
    ),
    OBSIDIAN(
        wireValue = "obsidian",
        titleId = "Obsidian Glass",
        titleEn = "Obsidian Glass",
        subtitleId = "Kaca matte gelap yang seimbang dan tegas",
        subtitleEn = "Balanced dark matte glass with crisp borders"
    ),
    MIDNIGHT_FROSTED(
        wireValue = "midnight-frosted",
        titleId = "Midnight Frosted",
        titleEn = "Midnight Frosted",
        subtitleId = "Kaca buram reflektif dengan tepian spekular",
        subtitleEn = "Specular frosted glass with luminous rim highlights"
    ),
    CARBON_FORGE(
        wireValue = "carbon-forge",
        titleId = "Carbon Forge",
        titleEn = "Carbon Forge",
        subtitleId = "Anyaman serat karbon presisi bersudut tajam",
        subtitleEn = "Micro-weave carbon fiber texture with precision corners"
    ),
    AEROGLASS(
        wireValue = "aeroglass",
        titleId = "AeroGlass",
        titleEn = "AeroGlass",
        subtitleId = "Kilau kaca transparan berlapis sorot atas",
        subtitleEn = "Glossy translucent glass with upper-half sheen"
    ),
    UBUNTU_YARU(
        wireValue = "ubuntu-yaru",
        titleId = "Ubuntu Yaru",
        titleEn = "Ubuntu Yaru",
        subtitleId = "Matte GTK4 hangat tanpa blur · sangat ringan",
        subtitleEn = "Warm matte GTK4 dark · zero blur & battery friendly"
    );

    companion object {
        fun fromWire(raw: String?): UiTheme =
            entries.firstOrNull { it.wireValue == raw } ?: MATERIAL_YOU
    }
}

@Immutable
data class ColorPresetOption(
    val id: String,
    val hex: String,
    val labelId: String,
    val labelEn: String
)

enum class PerformancePresetId {
    BALANCED,
    BATTERY,
    ULTRA
}

@Immutable
data class PerformancePreferences(
    val noBlur: Boolean = false,
    val noAnimations: Boolean = false,
    val noAmbientGlow: Boolean = false,
    val staticMascot: Boolean = false
)

enum class DayKey(
    val key: String,
    val labelId: String,
    val labelEn: String,
    val shortId: String,
    val shortEn: String,
    val calendarDayOfWeek: Int
) {
    MON("mon", "Senin", "Monday", "SEN", "MON", Calendar.MONDAY),
    TUE("tue", "Selasa", "Tuesday", "SEL", "TUE", Calendar.TUESDAY),
    WED("wed", "Rabu", "Wednesday", "RAB", "WED", Calendar.WEDNESDAY),
    THU("thu", "Kamis", "Thursday", "KAM", "THU", Calendar.THURSDAY),
    FRI("fri", "Jumat", "Friday", "JUM", "FRI", Calendar.FRIDAY),
    SAT("sat", "Sabtu", "Saturday", "SAB", "SAT", Calendar.SATURDAY),
    SUN("sun", "Minggu", "Sunday", "MIN", "SUN", Calendar.SUNDAY);

    val label: String get() = labelId
    val shortLabel: String get() = shortId

    fun label(lang: AppLanguage): String = if (lang == AppLanguage.EN) labelEn else labelId
    fun shortLabel(lang: AppLanguage): String = if (lang == AppLanguage.EN) shortEn else shortId

    companion object {
        fun fromKey(raw: String?): DayKey =
            entries.firstOrNull { it.key == raw } ?: MON

        fun fromCalendar(calendar: Calendar): DayKey {
            val dow = calendar.get(Calendar.DAY_OF_WEEK)
            return entries.firstOrNull { it.calendarDayOfWeek == dow } ?: MON
        }
    }
}

enum class MuscleGroup(val labelId: String, val labelEn: String) {
    DADA("Dada", "Chest"),
    PUNGGUNG("Punggung", "Back"),
    BAHU("Bahu", "Shoulders"),
    KAKI("Kaki", "Legs"),
    LENGAN("Lengan", "Arms"),
    CORE("Core", "Core"),
    KARDIO("Kardio", "Cardio");

    val label: String get() = labelId
    fun label(lang: AppLanguage): String = if (lang == AppLanguage.EN) labelEn else labelId

    companion object {
        fun fromLabel(raw: String?): MuscleGroup =
            entries.firstOrNull {
                it.labelId.equals(raw, ignoreCase = true) ||
                    it.labelEn.equals(raw, ignoreCase = true)
            } ?: DADA
    }
}

enum class EquipmentBucket(val labelId: String, val labelEn: String) {
    ALL("Semua Alat", "All Gear"),
    BODYWEIGHT("Tanpa Alat", "Bodyweight"),
    BARBELL("Barbel / EZ", "Barbell / EZ"),
    DUMBBELL("Dumbbell", "Dumbbell"),
    KETTLEBELL("Kettlebell", "Kettlebell"),
    CABLE("Kabel", "Cable"),
    MACHINE("Mesin", "Machine"),
    CARDIO("Kardio", "Cardio");

    fun label(lang: AppLanguage): String = if (lang == AppLanguage.EN) labelEn else labelId

    fun matches(equipment: String): Boolean {
        if (this == ALL) return true
        val eq = equipment.lowercase(Locale.ROOT)
        return when (this) {
            ALL -> true
            BODYWEIGHT -> eq.contains("tanpa alat") || eq.contains("pull-up") || eq.contains("dip bar") || eq.contains("tali skipping") || eq.contains("bodyweight")
            BARBELL -> eq.contains("barbel") || eq.contains("ez-bar") || eq.contains("pelat")
            DUMBBELL -> eq.contains("dumbbell")
            KETTLEBELL -> eq.contains("kettlebell")
            CABLE -> eq.contains("kabel")
            MACHINE -> eq.contains("mesin")
            CARDIO -> eq.contains("treadmill") || eq.contains("bike") || eq.contains("sepeda") || eq.contains("elliptical") || eq.contains("stair") || eq.contains("dayung")
        }
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

@Immutable
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

@Immutable
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

@Immutable
data class WorkoutSetLog(
    val setNumber: Int,
    val weightKg: Double,
    val reps: Int,
    val durationSeconds: Int = 0,
    val completed: Boolean = false
)

@Immutable
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

@Immutable
data class WorkoutLog(
    val userId: String,
    val dateKey: String,
    val dayKey: DayKey,
    val focusTitle: String,
    val entries: List<WorkoutLogEntry> = emptyList(),
    val completed: Boolean = false
)

@Immutable
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

enum class RingtoneStorageMode(val wireValue: String) {
    CLOUD("cloud"),
    LOCAL_IDB("local_idb");

    companion object {
        fun fromWire(raw: String?): RingtoneStorageMode =
            if (raw == "local_idb") LOCAL_IDB else CLOUD
    }
}

@Immutable
data class CustomRingtone(
    val id: String,
    val userId: String,
    val name: String,
    val mimeType: String,
    val sizeBytes: Long,
    val durationSeconds: Int,
    val storageMode: RingtoneStorageMode,
    val audioDataUrl: String = ""
)

@Immutable
data class BuiltinRingtoneSpec(
    val id: String,
    val name: String,
    val descriptionId: String,
    val descriptionEn: String,
    val patternLabelId: String,
    val patternLabelEn: String
)

@Immutable
data class NextAlarmSummary(
    val dayKey: DayKey,
    val dayLabel: String,
    val alarmTime: String,
    val focusTitle: String,
    val isToday: Boolean,
    val triggerAtMillis: Long
)

enum class MascotMood(val wireValue: String) {
    WELCOME("welcome"),
    READY("ready"),
    STARTING("starting"),
    CLAP("clap"),
    MILESTONE("milestone"),
    TIMER_ACTIVE("timerActive"),
    REST("rest"),
    CELEBRATE("celebrate"),
    RESTDAY("restday")
}

enum class TimePhasePose {
    // Morning (9)
    TEA, COFFEE, STRETCH, PERK, WINK, SUNRISE, PROTEIN, SALUTE, SPARKLE,
    // Afternoon (9)
    HYDRATE, SHADES, FLEX, MUSIC, CURIOUS, BEAST, SWEAT, SMIRK, WHISTLE,
    // Night (9)
    SLEEP, YAWN, NIGHT_CHILL, STARGAZE, ZEN, COZY, DREAM, MOONLIT, RECHARGE
}

@Immutable
data class MascotSpeechLine(
    val id: String,
    val headline: String,
    val subline: String
)

object GymModelHelpers {

    private val dateKeySdf = object : ThreadLocal<SimpleDateFormat>() {
        override fun initialValue(): SimpleDateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    }
    private val hhmmSdf = object : ThreadLocal<SimpleDateFormat>() {
        override fun initialValue(): SimpleDateFormat = SimpleDateFormat("HH:mm", Locale.US)
    }
    private val readableEnSdf = object : ThreadLocal<SimpleDateFormat>() {
        override fun initialValue(): SimpleDateFormat = SimpleDateFormat("EEE, dd MMM yyyy", Locale.US)
    }
    private val readableIdSdf = object : ThreadLocal<SimpleDateFormat>() {
        override fun initialValue(): SimpleDateFormat = SimpleDateFormat("EEE, dd MMM yyyy", Locale.forLanguageTag("id-ID"))
    }
    private val longTodayEnSdf = object : ThreadLocal<SimpleDateFormat>() {
        override fun initialValue(): SimpleDateFormat = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.US)
    }
    private val longTodayIdSdf = object : ThreadLocal<SimpleDateFormat>() {
        override fun initialValue(): SimpleDateFormat = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.forLanguageTag("id-ID"))
    }

    val BUILTIN_RINGTONES: List<BuiltinRingtoneSpec> = listOf(
        BuiltinRingtoneSpec(
            id = "builtin_athletic_bell",
            name = "Athletic Bell",
            descriptionId = "Denting bel sasana tinju & angkat beban yang tegas.",
            descriptionEn = "Crisp boxing & strength gym bell ring.",
            patternLabelId = "3 Nada · Tegas",
            patternLabelEn = "3 Tones · Crisp"
        ),
        BuiltinRingtoneSpec(
            id = "builtin_arena_horn",
            name = "Arena Horn",
            descriptionId = "Sinyal pembuka arena berenergi tinggi untuk sesi pagi.",
            descriptionEn = "High-energy arena opener signal for morning sessions.",
            patternLabelId = "Brass Synth · Keras",
            patternLabelEn = "Brass Synth · Loud"
        ),
        BuiltinRingtoneSpec(
            id = "builtin_digital_pulse",
            name = "Digital Pulse",
            descriptionId = "Bip kronometer presisi cepat untuk fokus interval.",
            descriptionEn = "Sharp digital chronometer beep for interval focus.",
            patternLabelId = "Pulsa Cepat · Presisi",
            patternLabelEn = "Fast Pulse · Precise"
        ),
        BuiltinRingtoneSpec(
            id = "builtin_kettlebell_chime",
            name = "Kettlebell Chime",
            descriptionId = "Lonceng logam jernih yang ideal untuk akhir waktu istirahat.",
            descriptionEn = "Clean metallic chime ideal for rest completion.",
            patternLabelId = "Lonceng Jernih · Sedang",
            patternLabelEn = "Clear Chime · Medium"
        ),
        BuiltinRingtoneSpec(
            id = "builtin_sprint_interval",
            name = "Sprint Interval",
            descriptionId = "Arpeggio naik progresif untuk memacu adrenalin.",
            descriptionEn = "Progressive rising arpeggio to fire up intensity.",
            patternLabelId = "Progresif · Dinamis",
            patternLabelEn = "Progressive · Dynamic"
        )
    )

    val ACCENT_COLOR_PRESETS: List<ColorPresetOption> = listOf(
        ColorPresetOption("lime", "#C8FF2E", "Hijau Limau", "IronPulse Lime"),
        ColorPresetOption("cyan", "#38BDF8", "Biru Pixel", "Pixel Sky"),
        ColorPresetOption("violet", "#B69DF8", "Lavender M3", "Material Lavender"),
        ColorPresetOption("crimson", "#FB7185", "Merah Rose", "Crimson Rose"),
        ColorPresetOption("amber", "#FBBF24", "Emas Amber", "Solar Amber"),
        ColorPresetOption("emerald", "#34D399", "Hijau Sage", "Forest Sage"),
        ColorPresetOption("teal", "#2DD4BF", "Teal Samudra", "Ocean Teal"),
        ColorPresetOption("coral", "#FB923C", "Terakota", "Terracotta Clay"),
        ColorPresetOption("yaru-orange", "#E95420", "Oranye Yaru", "Yaru Orange")
    )

    val MATERIAL_TINT_PRESETS: List<ColorPresetOption> = listOf(
        ColorPresetOption("slate", "#161A23", "Obsidian Slate", "Obsidian Slate"),
        ColorPresetOption("gunmetal", "#12151B", "Carbon Gunmetal", "Carbon Gunmetal"),
        ColorPresetOption("yaru-dark", "#2C2C2C", "Yaru Charcoal", "Yaru Charcoal"),
        ColorPresetOption("sapphire", "#162238", "Midnight Sapphire", "Midnight Sapphire"),
        ColorPresetOption("violet", "#23163D", "Deep Violet", "Deep Violet"),
        ColorPresetOption("emerald", "#112922", "Smoked Emerald", "Smoked Emerald"),
        ColorPresetOption("graphite", "#25201D", "Warm Graphite", "Warm Graphite"),
        ColorPresetOption("crystal", "#2C364A", "Crystal Frost", "Crystal Frost"),
        ColorPresetOption("aero-sky", "#1B334B", "Aero Sapphire", "Aero Sapphire")
    )

    fun resolveDayTimePhase(mode: DayTimeMode, now: Calendar = Calendar.getInstance()): DayTimePhase {
        when (mode) {
            DayTimeMode.MORNING -> return DayTimePhase.MORNING
            DayTimeMode.AFTERNOON -> return DayTimePhase.AFTERNOON
            DayTimeMode.NIGHT -> return DayTimePhase.NIGHT
            DayTimeMode.AUTO -> Unit
        }
        val hour = now.get(Calendar.HOUR_OF_DAY)
        return when {
            hour in 5..10 -> DayTimePhase.MORNING
            hour in 11..17 -> DayTimePhase.AFTERNOON
            else -> DayTimePhase.NIGHT
        }
    }

    fun formatLocalDateKey(date: Date = Date()): String =
        (dateKeySdf.get() ?: SimpleDateFormat("yyyy-MM-dd", Locale.US)).format(date)

    fun formatHHMM(date: Date = Date()): String =
        (hhmmSdf.get() ?: SimpleDateFormat("HH:mm", Locale.US)).format(date)

    fun getTodayDayKey(): DayKey = DayKey.fromCalendar(Calendar.getInstance())

    fun formatAlarmTime(hhmm: String, clockFormat: ClockFormat, lang: AppLanguage): String {
        if (clockFormat == ClockFormat.H24) return hhmm
        val parts = hhmm.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: return hhmm
        val m = parts.getOrNull(1)?.toIntOrNull() ?: return hhmm
        val isPm = h >= 12
        val h12 = when {
            h == 0 -> 12
            h > 12 -> h - 12
            else -> h
        }
        val suffix = if (lang == AppLanguage.ID) {
            when {
                h < 5 -> "Dini hari"
                h < 11 -> "Pagi"
                h < 15 -> "Siang"
                h < 19 -> "Sore"
                else -> "Malam"
            }
        } else {
            if (isPm) "PM" else "AM"
        }
        return String.format(Locale.US, "%d:%02d %s", h12, m, suffix)
    }

    fun formatReadableDate(dateKey: String, lang: AppLanguage): String {
        val parser = dateKeySdf.get() ?: SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val parsed = runCatching { parser.parse(dateKey) }.getOrNull() ?: return dateKey
        val fmt = if (lang == AppLanguage.EN) {
            readableEnSdf.get() ?: SimpleDateFormat("EEE, dd MMM yyyy", Locale.US)
        } else {
            readableIdSdf.get() ?: SimpleDateFormat("EEE, dd MMM yyyy", Locale.forLanguageTag("id-ID"))
        }
        return fmt.format(parsed)
    }

    fun formatLongTodayDate(now: Date, lang: AppLanguage): String {
        val fmt = if (lang == AppLanguage.EN) {
            longTodayEnSdf.get() ?: SimpleDateFormat("EEEE, d MMMM yyyy", Locale.US)
        } else {
            longTodayIdSdf.get() ?: SimpleDateFormat("EEEE, d MMMM yyyy", Locale.forLanguageTag("id-ID"))
        }
        return fmt.format(now)
    }

    fun formatCompactDuration(totalSeconds: Int, lang: AppLanguage): String {
        val safe = totalSeconds.coerceAtLeast(0)
        val mins = safe / 60
        val secs = safe % 60
        return if (mins > 0 && secs > 0) {
            if (lang == AppLanguage.EN) "${mins}m ${secs}s" else "${mins}m ${secs}d"
        } else if (mins > 0) {
            if (lang == AppLanguage.EN) "$mins min" else "$mins menit"
        } else {
            if (lang == AppLanguage.EN) "$secs sec" else "$secs detik"
        }
    }

    fun formatTimerClock(totalSeconds: Int): String = formatRestDuration(totalSeconds)

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

    fun computeNextAlarm(
        schedules: Map<DayKey, DaySchedule>,
        lang: AppLanguage = AppLanguage.ID
    ): NextAlarmSummary? {
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
                dayLabel = dayMeta.label(lang),
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

    fun resolveRingtoneName(
        ringtoneId: String?,
        defaultRingtoneId: String,
        customRingtones: List<CustomRingtone>
    ): Pair<String, String> {
        val targetId = if (ringtoneId.isNullOrBlank() || ringtoneId == "default") {
            defaultRingtoneId.ifBlank { "builtin_athletic_bell" }
        } else {
            ringtoneId
        }
        BUILTIN_RINGTONES.firstOrNull { it.id == targetId }?.let {
            return it.id to it.name
        }
        customRingtones.firstOrNull { it.id == targetId }?.let {
            return it.id to it.name
        }
        return "builtin_athletic_bell" to "Athletic Bell"
    }

    /**
     * Exact port of JS computeWeeklyStreak: counts consecutive Monday-based weeks
     * with at least one completed workout log.
     */
    fun computeWeeklyStreak(logs: List<WorkoutLog>): Int {
        val completedWeeks = mutableSetOf<String>()
        val sdf = dateKeySdf.get() ?: SimpleDateFormat("yyyy-MM-dd", Locale.US)
        for (log in logs) {
            val hasCompleted = log.completed || log.entries.any { e -> e.sets.any { s -> s.completed } }
            if (!hasCompleted) continue
            val d = runCatching { sdf.parse(log.dateKey) }.getOrNull() ?: continue
            completedWeeks += mondayKeyForDate(d)
        }
        if (completedWeeks.isEmpty()) return 0

        val cursor = mondayCalendarForDate(Date())
        var curKey = formatLocalDateKey(cursor.time)
        if (curKey !in completedWeeks) {
            cursor.add(Calendar.DAY_OF_YEAR, -7)
            curKey = formatLocalDateKey(cursor.time)
        }
        var streak = 0
        while (curKey in completedWeeks) {
            streak += 1
            cursor.add(Calendar.DAY_OF_YEAR, -7)
            curKey = formatLocalDateKey(cursor.time)
        }
        return streak
    }

    private fun mondayCalendarForDate(date: Date): Calendar {
        return Calendar.getInstance().apply {
            time = date
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            val dow = get(Calendar.DAY_OF_WEEK)
            val diffFromMonday = if (dow == Calendar.SUNDAY) -6 else Calendar.MONDAY - dow
            add(Calendar.DAY_OF_YEAR, diffFromMonday)
        }
    }

    private fun mondayKeyForDate(date: Date): String = formatLocalDateKey(mondayCalendarForDate(date).time)
}
