package com.fathan.ironpulse.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fathan.ironpulse.R
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.DaySchedule
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.ui.components.LiveFluidClockSlot
import com.fathan.ironpulse.ui.components.PhaseLogoEmblem
import com.fathan.ironpulse.ui.components.TodayMascot
import com.fathan.ironpulse.ui.components.rememberScaledResourceBitmap
import com.fathan.ironpulse.ui.components.tactilePress
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import com.fathan.ironpulse.ui.viewmodel.MascotEyeState
import com.fathan.ironpulse.ui.viewmodel.RestTimerDisplayState
import kotlinx.coroutines.flow.StateFlow
import java.text.NumberFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TodayScreen(
    state: IronPulseUiState,
    listState: LazyListState,
    contentPadding: PaddingValues,
    clockSecondsFlow: StateFlow<Long>,
    restTimerFlow: StateFlow<RestTimerDisplayState>,
    mascotEyeFlow: StateFlow<MascotEyeState>,
    onTapMascot: () -> Unit,
    onReplayMascotVoice: () -> Unit,
    onStartRestPreset: (Int, String?) -> Unit,
    onToggleRestPauseOrStart: () -> Unit,
    onAdjustRest: (Int) -> Unit,
    onResetRest: () -> Unit,
    onOpenWorkout: (String?) -> Unit,
    onOpenSchedule: () -> Unit,
    onOpenExercisesForDay: (DayKey) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val secUnit = lang.t("d", "s")
    val activeSchedule = state.schedules[state.todayDayKey]
    val dayLabel = state.todayDayKey.label(lang)
    val todayEntries = state.effectiveTodayEntries
    val specById = remember(activeSchedule?.exercises) {
        activeSchedule?.exercises?.associateBy { it.id } ?: emptyMap()
    }
    val heroBitmap = rememberScaledResourceBitmap(R.drawable.gym_arena_backdrop, 1024)

    val summary = remember(todayEntries, specById) {
        var total = 0
        var done = 0
        var volume = 0.0
        var timedSecs = 0
        for (entry in todayEntries) {
            val spec = specById[entry.exerciseId]
            val mode = spec?.trackingMode ?: entry.trackingMode
            val usesWeight = GymModelHelpers.resolveUsesWeight(
                usesWeight = entry.usesWeight,
                trackingMode = mode,
                targetWeightKg = spec?.targetWeightKg ?: entry.sets.firstOrNull()?.weightKg ?: 0.0,
                equipment = spec?.equipment
            )
            for (s in entry.sets) {
                total += 1
                if (s.completed) {
                    done += 1
                    if (mode == ExerciseTrackingMode.TIMER) {
                        timedSecs += s.durationSeconds.coerceAtLeast(0)
                    } else if (usesWeight) {
                        volume += s.weightKg.coerceAtLeast(0.0) * s.reps.coerceAtLeast(0)
                    }
                }
            }
        }
        val pct = if (total > 0) (done * 100) / total else 0
        TodayProgressStats(total, done, volume.toInt(), timedSecs, pct)
    }

    val startBtnLabel = when {
        summary.totalSets > 0 && summary.completedSets == summary.totalSets ->
            lang.t("Lihat / Ubah Set Latihan", "Review Workout Sets")
        summary.completedSets > 0 ->
            lang.t("Lanjutkan Latihan", "Continue Workout")
        else ->
            lang.t("Mulai Latihan", "Start Workout")
    }

    val numberFormat = remember(lang) {
        NumberFormat.getIntegerInstance(if (lang == AppLanguage.EN) Locale.US else Locale.forLanguageTag("id-ID"))
    }

    LazyColumn(
        state = listState,
        contentPadding = PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = contentPadding.calculateTopPadding() + 12.dp,
            bottom = contentPadding.calculateBottomPadding() + 92.dp
        ),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        // 1. HERO BANNER CARD
        item(key = "hero_banner") {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .ironGlassSurface(tokens, borderOverride = tokens.phaseTokens.heroBorder)
            ) {
                if (heroBitmap != null) {
                    Image(
                        bitmap = heroBitmap,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .matchParentSize()
                            .alpha(0.15f)
                    )
                }

                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .drawWithCache {
                            val gradient = Brush.linearGradient(
                                colors = listOf(
                                    tokens.phaseTokens.heroStart,
                                    tokens.phaseTokens.heroMid,
                                    tokens.phaseTokens.heroEnd
                                )
                            )
                            val cx = size.width * 0.84f
                            val cy = size.height * 0.14f
                            val outerStroke = Stroke(
                                width = 1.5.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 12f))
                            )
                            val innerStroke = Stroke(width = 1.dp.toPx())
                            val outerR = 110.dp.toPx()
                            val innerR = 74.dp.toPx()
                            onDrawBehind {
                                drawRect(gradient)
                                drawCircle(
                                    color = tokens.phaseTokens.accent.copy(alpha = 0.22f),
                                    radius = outerR,
                                    center = Offset(cx, cy),
                                    style = outerStroke
                                )
                                drawCircle(
                                    color = tokens.phaseTokens.accentBright.copy(alpha = 0.2f),
                                    radius = innerR,
                                    center = Offset(cx, cy),
                                    style = innerStroke
                                )
                            }
                        }
                )

                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Zone 1: Phase Emblem + Isolated Fluid Clock + Phase / Alarm Status
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        PhaseLogoEmblem(timePhase = state.timePhase)
                        Column(modifier = Modifier.weight(1f)) {
                            LiveFluidClockSlot(
                                clockSecondsFlow = clockSecondsFlow,
                                clockFormat = tokens.clockFormat,
                                lang = lang
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            val alarmText = if (activeSchedule?.isGymDay == true) {
                                val fmt = GymModelHelpers.formatAlarmTime(activeSchedule.alarmTime, tokens.clockFormat, lang)
                                if (activeSchedule.alarmEnabled) {
                                    "${lang.t("Alarm Hari Ini", "Today Alarm")} $fmt"
                                } else {
                                    "$fmt (${lang.t("Alarm Mati", "Alarm Off")})"
                                }
                            } else {
                                lang.t("Hari Istirahat", "Rest Day")
                            }
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                Text(
                                    text = state.timePhase.label(lang),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = tokens.phaseTokens.accentBright
                                )
                                Text(text = "·", fontSize = 13.sp, color = tokens.mutedTextColor)
                                Text(
                                    text = alarmText,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFFCBD5E1)
                                )
                            }
                        }
                    }

                    HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

                    // Zone 2: Isolated Date Lead-In + Dominant Focus Title + Next Alarm Bar
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        TodayLongDateLabel(
                            clockSecondsFlow = clockSecondsFlow,
                            lang = lang,
                            accentColor = tokens.accentColor
                        )
                        Text(
                            text = if (activeSchedule?.isGymDay == true) {
                                activeSchedule.focusTitle
                            } else {
                                "$dayLabel — ${lang.t("Hari Istirahat", "Rest Day")}"
                            },
                            fontSize = 31.sp,
                            lineHeight = 35.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.6).sp,
                            color = Color(0xFFF8FAFC)
                        )
                    }

                    NextAlarmStatusBar(
                        schedules = state.schedules,
                        clockSecondsFlow = clockSecondsFlow,
                        clockFormat = tokens.clockFormat,
                        lang = lang
                    )

                    // Interactive Companion Mascot
                    TodayMascot(
                        mascot = state.mascot,
                        eyeStateFlow = mascotEyeFlow,
                        voiceEnabled = state.appPrefs.mascotVoiceEnabled,
                        onTapMascot = onTapMascot,
                        onReplayVoice = onReplayMascotVoice
                    )

                    // Daily Progress Metrics + Animated Bar
                    if (activeSchedule?.isGymDay == true && activeSchedule.exercises.isNotEmpty()) {
                        val animatedBarFraction by animateFloatAsState(
                            targetValue = (summary.progressPct / 100f).coerceIn(0f, 1f),
                            animationSpec = if (noAnim) tween(0) else tween(320),
                            label = "todayProgressBar"
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(2.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(
                                        text = "${summary.completedSets}/${summary.totalSets} ${lang.t("Set Selesai", "Sets Done")}",
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 12.sp,
                                        color = Color(0xFFD1D5DB)
                                    )
                                    Text("·", fontSize = 12.sp, color = tokens.mutedTextColor)
                                    Text(
                                        text = "${lang.t("Volume", "Volume")}: ${numberFormat.format(summary.totalVolumeKg)} kg",
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 12.sp,
                                        color = Color(0xFFD1D5DB)
                                    )
                                    if (summary.totalTimedSeconds > 0) {
                                        Text("·", fontSize = 12.sp, color = tokens.mutedTextColor)
                                        Text(
                                            text = "${lang.t("Durasi", "Duration")}: ${GymModelHelpers.formatCompactDuration(summary.totalTimedSeconds, lang)}",
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = 12.sp,
                                            color = Color(0xFF38BDF8)
                                        )
                                    }
                                }
                                Text(
                                    text = "${summary.progressPct}%",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = tokens.accentColor
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(Color.White.copy(alpha = 0.1f))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(animatedBarFraction)
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(999.dp))
                                        .background(tokens.accentColor)
                                )
                            }
                        }
                    }
                }
            }
        }

        // 2. ISOLATED STANDALONE REST TIMER CARD
        item(key = "rest_timer_card") {
            RestTimerHeroCard(
                restTimerFlow = restTimerFlow,
                secUnit = secUnit,
                onStartRestPreset = onStartRestPreset,
                onToggleRestPauseOrStart = onToggleRestPauseOrStart,
                onAdjustRest = onAdjustRest,
                onResetRest = onResetRest
            )
        }

        // 3. PRIMARY START WORKOUT CTA
        if (activeSchedule?.isGymDay == true && todayEntries.isNotEmpty()) {
            item(key = "start_workout_cta") {
                Surface(
                    onClick = { onOpenWorkout(null) },
                    shape = RoundedCornerShape(18.dp),
                    color = tokens.accentColor,
                    contentColor = tokens.onAccentColor,
                    modifier = Modifier
                        .fillMaxWidth()
                        .tactilePress(disabledByPerf = noAnim)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black.copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.FitnessCenter,
                                contentDescription = null,
                                tint = tokens.onAccentColor,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = startBtnLabel,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = tokens.onAccentColor
                            )
                            Text(
                                text = lang.t("Buka fokus set, beban & repetisi", "Open focused sets & reps view"),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = tokens.onAccentColor.copy(alpha = 0.8f)
                            )
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "${summary.completedSets}/${summary.totalSets}",
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 13.sp,
                                color = tokens.onAccentColor
                            )
                            Icon(
                                imageVector = Icons.Rounded.ArrowForward,
                                contentDescription = null,
                                tint = tokens.onAccentColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }

        // 4. REST DAY / EMPTY / FLATTENED RECYCLABLE EXERCISE OVERVIEW
        if (activeSchedule != null && !activeSchedule.isGymDay) {
            item(key = "rest_day_card") {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .ironGlassSurface(tokens)
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Schedule,
                        contentDescription = null,
                        tint = tokens.mutedTextColor,
                        modifier = Modifier.size(36.dp)
                    )
                    Text(
                        text = lang.t(
                            "$dayLabel Dijadwalkan Sebagai Hari Istirahat",
                            "$dayLabel is Scheduled as a Rest Day"
                        ),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFF4F5F7),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = lang.t(
                            "Pemulihan otot sama pentingnya dengan latihan beban. Jika ingin berlatih hari ini, aktifkan hari $dayLabel di tab Jadwal.",
                            "Muscle recovery matters just as much as lifting. If you want to train today, enable $dayLabel in the Schedule tab."
                        ),
                        fontSize = 13.sp,
                        lineHeight = 19.sp,
                        color = tokens.mutedTextColor,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Button(
                        onClick = onOpenSchedule,
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = tokens.accentColor,
                            contentColor = tokens.onAccentColor
                        ),
                        modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                    ) {
                        Text(lang.t("Buka Tab Jadwal", "Open Schedule Tab"), fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else if (activeSchedule != null && activeSchedule.exercises.isEmpty()) {
            item(key = "empty_exercises_card") {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .ironGlassSurface(tokens)
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.FitnessCenter,
                        contentDescription = null,
                        tint = tokens.mutedTextColor,
                        modifier = Modifier.size(36.dp)
                    )
                    Text(
                        text = lang.t("Belum Ada Gerakan untuk $dayLabel", "No Exercises Yet for $dayLabel"),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFF4F5F7),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = lang.t(
                            "Tambahkan gerakan untuk hari ini dari tab Gerakan.",
                            "Add movements for today from the Exercises tab."
                        ),
                        fontSize = 13.sp,
                        color = tokens.mutedTextColor,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Button(
                        onClick = { onOpenExercisesForDay(state.todayDayKey) },
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = tokens.accentColor,
                            contentColor = tokens.onAccentColor
                        ),
                        modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                    ) {
                        Text(lang.t("+ Tambah Gerakan Sekarang", "+ Add Exercise Now"), fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else if (todayEntries.isNotEmpty()) {
            item(key = "overview_header") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp, vertical = 2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = lang.t("Ringkasan Gerakan Hari Ini", "Today's Exercise Overview"),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFF4F5F7)
                        )
                        Text(
                            text = "${todayEntries.size} ${lang.t("gerakan terjadwal", "scheduled exercises")} · ${lang.t("Ketuk untuk catat set", "Tap to log sets")}",
                            fontSize = 12.sp,
                            color = tokens.mutedTextColor
                        )
                    }
                }
            }

            itemsIndexed(todayEntries, key = { _, e -> e.exerciseId }) { idx, entry ->
                val spec = specById[entry.exerciseId]
                val mode = spec?.trackingMode ?: entry.trackingMode
                val targetDur = GymModelHelpers.resolveTargetDurationSeconds(
                    spec?.targetDurationSeconds ?: entry.targetDurationSeconds,
                    spec?.targetReps
                )
                val doneCount = entry.sets.count { it.completed }
                val allDone = entry.sets.isNotEmpty() && doneCount == entry.sets.size
                val targetBadge = if (spec != null) {
                    if (mode == ExerciseTrackingMode.TIMER) {
                        "${spec.targetSets}×${GymModelHelpers.formatCompactDuration(targetDur, lang)}"
                    } else {
                        "${spec.targetSets}×${spec.targetReps}"
                    }
                } else {
                    "${entry.sets.size} set"
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .animateItem()
                        .tactilePress(pressedScale = 0.98f, disabledByPerf = noAnim)
                        .ironGlassSurface(
                            tokens = tokens,
                            subtle = !allDone,
                            borderOverride = if (allDone) Color(0x6616A34A) else null,
                            radiusOverride = 16.dp
                        )
                        .clickable { onOpenWorkout(entry.exerciseId) }
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "${(idx + 1).toString().padStart(2, '0')}.",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = tokens.accentColor
                            )
                            Text(
                                text = entry.name,
                                fontSize = 14.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFF4F5F7),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = listOfNotNull(
                                entry.muscleGroup.label(lang),
                                spec?.equipment?.takeIf { it.isNotBlank() },
                                targetBadge
                            ).joinToString(" · "),
                            fontSize = 12.sp,
                            color = tokens.mutedTextColor,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "$doneCount/${entry.sets.size}",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (allDone) Color(0xFF4ADE80) else Color(0xFFD1D5DB)
                        )
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(if (allDone) Color(0x3316A34A) else tokens.subtleChipBg),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (allDone) Icons.Rounded.Check else Icons.Rounded.ArrowForward,
                                contentDescription = null,
                                tint = if (allDone) Color(0xFF4ADE80) else tokens.mutedTextColor,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TodayLongDateLabel(
    clockSecondsFlow: StateFlow<Long>,
    lang: AppLanguage,
    accentColor: Color
) {
    val clockSeconds by clockSecondsFlow.collectAsStateWithLifecycle()
    val minuteBucket = clockSeconds / 60L
    val formatted = remember(minuteBucket, lang) {
        GymModelHelpers.formatLongTodayDate(Date(minuteBucket * 60_000L), lang)
    }
    Text(
        text = formatted,
        fontSize = 13.sp,
        fontWeight = FontWeight.Bold,
        color = accentColor
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun NextAlarmStatusBar(
    schedules: Map<DayKey, DaySchedule>,
    clockSecondsFlow: StateFlow<Long>,
    clockFormat: ClockFormat,
    lang: AppLanguage
) {
    val tokens = LocalIronPulseTokens.current
    val clockSeconds by clockSecondsFlow.collectAsStateWithLifecycle()
    val halfMinuteBucket = clockSeconds / 30L
    val nextAlarm = remember(schedules, halfMinuteBucket, lang) {
        GymModelHelpers.computeNextAlarm(schedules, lang)
    }
    val nextCountdown = remember(nextAlarm, halfMinuteBucket, lang) {
        nextAlarm?.let { formatNextCountdown(it.triggerAtMillis, clockSeconds * 1000L, lang) } ?: ""
    }

    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = Icons.Rounded.Notifications,
            contentDescription = null,
            tint = tokens.accentColor,
            modifier = Modifier
                .padding(top = 2.dp)
                .size(15.dp)
        )
        if (nextAlarm != null) {
            val alarmFmt = GymModelHelpers.formatAlarmTime(nextAlarm.alarmTime, clockFormat, lang)
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = lang.t("Alarm Berikutnya:", "Next Alarm:"),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = tokens.mutedTextColor
                )
                Text(
                    text = nextAlarm.dayLabel,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFFF4F5F7)
                )
                Text("·", fontSize = 12.sp, color = tokens.mutedTextColor)
                Text(
                    text = alarmFmt,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.accentColor
                )
                Text("·", fontSize = 12.sp, color = tokens.mutedTextColor)
                Text(
                    text = nextCountdown,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFFE2E8F0)
                )
            }
        } else {
            Text(
                text = lang.t(
                    "Belum ada alarm aktif. Aktifkan di tab Jadwal.",
                    "No active alarms yet. Enable one in the Schedule tab."
                ),
                fontSize = 12.sp,
                color = tokens.mutedTextColor
            )
        }
    }
}

@Composable
private fun RestTimerHeroCard(
    restTimerFlow: StateFlow<RestTimerDisplayState>,
    secUnit: String,
    onStartRestPreset: (Int, String?) -> Unit,
    onToggleRestPauseOrStart: () -> Unit,
    onAdjustRest: (Int) -> Unit,
    onResetRest: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val rest by restTimerFlow.collectAsStateWithLifecycle()

    val restRunning = rest.isActive
    val restRemaining = rest.remainingSeconds
    val restTotal = rest.totalSeconds.coerceAtLeast(1)
    val restLabel = rest.exerciseName
    val targetProgress = (restRemaining.toFloat() / restTotal.toFloat()).coerceIn(0f, 1f)
    val animatedProgress by animateFloatAsState(
        targetValue = targetProgress,
        animationSpec = if (noAnim) tween(0) else tween(260),
        label = "restArc"
    )

    val restBorder = when {
        restRunning -> tokens.accentColor.copy(alpha = 0.52f)
        restRemaining == 0 -> Color(0x8016A34A)
        else -> null
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .ironGlassSurface(tokens, borderOverride = restBorder)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Box(modifier = Modifier.size(90.dp), contentAlignment = Alignment.Center) {
                val ringColor = if (restRemaining == 0) Color(0xFF16A34A) else tokens.accentColor
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val stroke = 6.dp.toPx()
                    drawArc(
                        color = Color.White.copy(alpha = 0.08f),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(stroke)
                    )
                    drawArc(
                        color = ringColor,
                        startAngle = -90f,
                        sweepAngle = 360f * animatedProgress,
                        useCenter = false,
                        style = Stroke(stroke, cap = StrokeCap.Round)
                    )
                }
                Text(
                    text = GymModelHelpers.formatRestDuration(restRemaining),
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = Color(0xFFF4F5F7)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = lang.t("Timer Istirahat", "Rest Timer"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFF4F5F7)
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = restLabel.ifBlank {
                        lang.t("Waktu pemulihan antar set", "Between-set recovery")
                    },
                    fontSize = 12.sp,
                    color = tokens.mutedTextColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = when {
                        restRemaining == 0 -> lang.t(
                            "Istirahat selesai — lanjutkan set berikutnya",
                            "Rest complete — start next set"
                        )
                        restRunning -> lang.t("Sedang berjalan", "Running")
                        else -> lang.t("Siap dimulai", "Ready to start")
                    },
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = when {
                        restRemaining == 0 -> Color(0xFF4ADE80)
                        restRunning -> tokens.accentColor
                        else -> Color(0xFFD1D5DB)
                    }
                )
            }
        }

        // 4 Preset Chips (45s / 60s / 90s / 120s)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(45, 60, 90, 120).forEach { sec ->
                val activePreset = restTotal == sec && restRunning
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(38.dp)
                        .tactilePress(pressedScale = 0.94f, disabledByPerf = noAnim)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            if (activePreset) tokens.accentColor.copy(alpha = 0.16f)
                            else tokens.wellBg
                        )
                        .border(
                            1.dp,
                            if (activePreset) tokens.accentColor else tokens.subtleBorderColor,
                            RoundedCornerShape(10.dp)
                        )
                        .clickable { onStartRestPreset(sec, restLabel.ifBlank { null }) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$sec$secUnit",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (activePreset) tokens.accentColor else Color(0xFFD1D5DB)
                    )
                }
            }
        }

        // Controls Row: -15s | Start/Pause | +15s | Reset
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedButton(
                onClick = { onAdjustRest(-15) },
                shape = RoundedCornerShape(tokens.buttonRadius),
                border = BorderStroke(1.dp, tokens.subtleBorderColor),
                contentPadding = PaddingValues(horizontal = 10.dp),
                modifier = Modifier
                    .height(44.dp)
                    .tactilePress(disabledByPerf = noAnim)
            ) {
                Text("-15$secUnit", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFFD1D5DB))
            }

            Button(
                onClick = onToggleRestPauseOrStart,
                shape = RoundedCornerShape(tokens.buttonRadius),
                colors = ButtonDefaults.buttonColors(
                    containerColor = tokens.accentColor,
                    contentColor = tokens.onAccentColor
                ),
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp)
                    .tactilePress(disabledByPerf = noAnim)
            ) {
                Icon(
                    imageVector = if (restRunning) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = when {
                        restRunning -> lang.t("Jeda", "Pause")
                        restRemaining > 0 -> lang.t("Mulai", "Start")
                        else -> lang.t("Ulangi", "Restart")
                    },
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }

            OutlinedButton(
                onClick = { onAdjustRest(15) },
                shape = RoundedCornerShape(tokens.buttonRadius),
                border = BorderStroke(1.dp, tokens.subtleBorderColor),
                contentPadding = PaddingValues(horizontal = 10.dp),
                modifier = Modifier
                    .height(44.dp)
                    .tactilePress(disabledByPerf = noAnim)
            ) {
                Text("+15$secUnit", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFFD1D5DB))
            }

            Surface(
                onClick = onResetRest,
                shape = RoundedCornerShape(tokens.buttonRadius),
                color = tokens.controlBg,
                border = BorderStroke(1.dp, tokens.subtleBorderColor),
                modifier = Modifier
                    .size(44.dp)
                    .tactilePress(disabledByPerf = noAnim)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Rounded.Refresh,
                        contentDescription = lang.t("Reset timer", "Reset timer"),
                        tint = tokens.mutedTextColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

private data class TodayProgressStats(
    val totalSets: Int,
    val completedSets: Int,
    val totalVolumeKg: Int,
    val totalTimedSeconds: Int,
    val progressPct: Int
)

private fun formatNextCountdown(targetMillis: Long, nowMillis: Long, lang: AppLanguage): String {
    val diffMins = ((targetMillis - nowMillis).coerceAtLeast(0L) / 60_000L).toInt()
    val days = diffMins / (60 * 24)
    val hours = (diffMins % (60 * 24)) / 60
    val mins = diffMins % 60
    return if (lang == AppLanguage.EN) {
        when {
            days > 0 -> "in ${days}d ${hours}h"
            hours > 0 -> "in ${hours}h ${mins}m"
            else -> "in ${mins}m"
        }
    } else {
        when {
            days > 0 -> "dalam ${days}h ${hours}j"
            hours > 0 -> "dalam ${hours}j ${mins}m"
            else -> "dalam ${mins}m"
        }
    }
}
