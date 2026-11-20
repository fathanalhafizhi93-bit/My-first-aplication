package com.fathan.ironpulse.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fathan.ironpulse.model.DayKey
import com.fathan.ironpulse.model.ExerciseItem
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.TimerDirection
import com.fathan.ironpulse.model.WorkoutLogEntry
import com.fathan.ironpulse.ui.components.TactileStepperControl
import com.fathan.ironpulse.ui.components.tactilePress
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.ExerciseTimerUiState
import com.fathan.ironpulse.ui.viewmodel.GymViewModel
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import com.fathan.ironpulse.ui.viewmodel.RestTimerDisplayState
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.roundToInt

@Composable
fun WorkoutScreen(
    state: IronPulseUiState,
    viewModel: GymViewModel,
    contentPadding: PaddingValues,
    onBackToToday: () -> Unit,
    onOpenSchedule: () -> Unit,
    onOpenExercisesForDay: (DayKey) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val secUnit = lang.t("d", "s")
    val activeSchedule = state.schedules[state.todayDayKey]
    val todayEntries = state.effectiveTodayEntries
    val specById = remember(activeSchedule?.exercises) {
        activeSchedule?.exercises?.associateBy { it.id } ?: emptyMap()
    }

    var viewModeFocus by remember { mutableStateOf(true) }
    var selectedExerciseId by remember { mutableStateOf("") }
    var restBarDismissed by remember { mutableStateOf(false) }
    val expandedNotes = remember { mutableStateMapOf<String, Boolean>() }

    LaunchedEffect(state.focusedWorkoutExerciseId, todayEntries) {
        val target = state.focusedWorkoutExerciseId
        if (!target.isNullOrBlank() && todayEntries.any { it.exerciseId == target }) {
            selectedExerciseId = target
            viewModeFocus = true
        } else if (todayEntries.isNotEmpty() && todayEntries.none { it.exerciseId == selectedExerciseId }) {
            val firstIncomplete = todayEntries.firstOrNull { e -> e.sets.any { !it.completed } }
            selectedExerciseId = (firstIncomplete ?: todayEntries.first()).exerciseId
        }
    }

    val totalSets = remember(todayEntries) { todayEntries.sumOf { it.sets.size } }
    val completedSets = remember(todayEntries) { todayEntries.sumOf { e -> e.sets.count { it.completed } } }
    val progressPct = if (totalSets > 0) (completedSets * 100) / totalSets else 0
    val hasExercises = activeSchedule?.isGymDay == true && todayEntries.isNotEmpty()

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            contentPadding = PaddingValues(
                start = 16.dp,
                end = 16.dp,
                top = contentPadding.calculateTopPadding() + 12.dp,
                bottom = contentPadding.calculateBottomPadding() + if (hasExercises) 148.dp else 92.dp
            ),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            // 1. TOP WORKOUT COCKPIT BAR
            item(key = "workout_header") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        onClick = onBackToToday,
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        color = tokens.controlBg,
                        border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                        modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ArrowBack,
                                contentDescription = null,
                                tint = tokens.palette.onSurface,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = lang.t("Hari Ini", "Today"),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = tokens.palette.onSurface
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Focus / All Mode Segmented Toggle
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(tokens.wellBg)
                                .border(1.dp, tokens.surfaceBorderColor, RoundedCornerShape(999.dp))
                                .padding(3.dp),
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            listOf(
                                true to lang.t("Fokus", "Focus"),
                                false to lang.t("Semua", "All")
                            ).forEach { (isFocus, label) ->
                                val selected = viewModeFocus == isFocus
                                Box(
                                    modifier = Modifier
                                        .tactilePress(pressedScale = 0.94f, disabledByPerf = noAnim)
                                        .clip(RoundedCornerShape(999.dp))
                                        .background(if (selected) tokens.accentColor else Color.Transparent)
                                        .clickable { viewModeFocus = isFocus }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (selected) tokens.onAccentColor else tokens.mutedTextColor
                                    )
                                }
                            }
                        }

                        // Mini Progress Ring
                        val animProgress by animateFloatAsState(
                            targetValue = progressPct / 100f,
                            animationSpec = if (noAnim) tween(0) else tween(260),
                            label = "workoutRing"
                        )
                        Box(modifier = Modifier.size(44.dp), contentAlignment = Alignment.Center) {
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val stroke = 3.5.dp.toPx()
                                drawArc(
                                    color = Color.White.copy(alpha = 0.1f),
                                    startAngle = 0f,
                                    sweepAngle = 360f,
                                    useCenter = false,
                                    style = Stroke(stroke)
                                )
                                drawArc(
                                    color = if (progressPct == 100) Color(0xFF16A34A) else tokens.accentColor,
                                    startAngle = -90f,
                                    sweepAngle = 360f * animProgress,
                                    useCenter = false,
                                    style = Stroke(stroke, cap = StrokeCap.Round)
                                )
                            }
                            Text(
                                text = "$completedSets/$totalSets",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFF4F5F7)
                            )
                        }
                    }
                }
            }

            if (activeSchedule == null || !activeSchedule.isGymDay || todayEntries.isEmpty()) {
                item(key = "workout_empty") {
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
                            text = if (activeSchedule?.isGymDay == false) {
                                lang.t("Hari Ini Dijadwalkan Rest Day", "Today is a Rest Day")
                            } else {
                                lang.t("Belum Ada Gerakan Hari Ini", "No Exercises Scheduled Today")
                            },
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFF4F5F7)
                        )
                        Button(
                            onClick = {
                                if (activeSchedule?.isGymDay == false) onOpenSchedule()
                                else onOpenExercisesForDay(state.todayDayKey)
                            },
                            shape = RoundedCornerShape(tokens.buttonRadius),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = tokens.accentColor,
                                contentColor = tokens.onAccentColor
                            ),
                            modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                        ) {
                            Text(
                                text = if (activeSchedule?.isGymDay == false) {
                                    lang.t("Buka Tab Jadwal", "Open Schedule Tab")
                                } else {
                                    lang.t("Tambah Gerakan", "Add Exercises")
                                },
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            } else {
                // 2. EXERCISE SWITCHER RAIL (isolated timer collection inside rail)
                if (viewModeFocus && todayEntries.size > 1) {
                    item(key = "exercise_switcher") {
                        ExerciseSwitcherRail(
                            entries = todayEntries,
                            selectedExerciseId = selectedExerciseId,
                            exerciseTimersFlow = viewModel.exerciseTimersFlow,
                            onSelectExercise = { selectedExerciseId = it }
                        )
                    }
                }

                val entriesToRender = if (viewModeFocus) {
                    val idx = todayEntries.indexOfFirst { it.exerciseId == selectedExerciseId }.coerceAtLeast(0)
                    listOf(idx to todayEntries[idx])
                } else {
                    todayEntries.mapIndexed { i, e -> i to e }
                }

                itemsIndexed(entriesToRender, key = { _, pair -> pair.second.exerciseId }) { _, (index, entry) ->
                    val spec = specById[entry.exerciseId]
                    ExerciseCockpitCard(
                        index = index,
                        totalExercises = todayEntries.size,
                        entry = entry,
                        spec = spec,
                        notesExpanded = expandedNotes[entry.exerciseId] == true,
                        onToggleNotes = {
                            expandedNotes[entry.exerciseId] = !(expandedNotes[entry.exerciseId] ?: false)
                        },
                        exerciseTimersFlow = viewModel.exerciseTimersFlow,
                        cooldownSecondsFlow = viewModel.cooldownSecondsFlow,
                        onStartRest = { secs ->
                            restBarDismissed = false
                            viewModel.startManualRestTimer(secs, entry.name)
                        },
                        onToggleSetComplete = { setNumber ->
                            viewModel.requestToggleSetComplete(entry.exerciseId, setNumber)
                        },
                        onUpdateSetMetrics = { setNumber, w, r ->
                            viewModel.updateSetMetrics(entry.exerciseId, setNumber, w, r)
                        },
                        onUpdateSetDuration = { setNumber, dur ->
                            viewModel.updateSetDuration(entry.exerciseId, setNumber, dur)
                        },
                        onToggleExerciseTimer = { setNumber ->
                            viewModel.toggleExerciseTimer(entry, setNumber)
                        },
                        onResetExerciseTimer = {
                            viewModel.resetExerciseTimer(entry)
                        },
                        onSelectExerciseTimerSet = { setNumber ->
                            viewModel.selectExerciseTimerSet(entry, setNumber)
                        },
                        onChangeTimerDirection = { dir ->
                            viewModel.changeExerciseTimerDirection(entry, dir)
                        },
                        onSaveExerciseTimer = {
                            viewModel.finishAndSaveExerciseTimer(entry)
                        },
                        onAddSet = { viewModel.addSetToExercise(entry.exerciseId) },
                        onRemoveSet = { viewModel.removeSetFromExercise(entry.exerciseId) },
                        secUnit = secUnit,
                        modifier = Modifier.animateItem()
                    )
                }
            }
        }

        // STICKY FLOATING REST BAR (isolated flow collection so WorkoutScreen doesn't recompose 1Hz)
        if (hasExercises) {
            WorkoutFloatingRestBar(
                restTimerFlow = viewModel.restTimerDisplayFlow,
                restBarDismissed = restBarDismissed,
                bottomInset = contentPadding.calculateBottomPadding(),
                secUnit = secUnit,
                onUndismiss = { restBarDismissed = false },
                onAdjust = { viewModel.adjustRestTimer(it) },
                onTogglePause = { viewModel.toggleRestPauseOrStart() },
                onDismissAndStop = {
                    restBarDismissed = true
                    viewModel.stopRestTimer()
                },
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
    }
}

@Composable
private fun ExerciseSwitcherRail(
    entries: List<WorkoutLogEntry>,
    selectedExerciseId: String,
    exerciseTimersFlow: StateFlow<Map<String, ExerciseTimerUiState>>,
    onSelectExercise: (String) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val noAnim = tokens.performance.noAnimations
    val exerciseTimers by exerciseTimersFlow.collectAsStateWithLifecycle()

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        itemsIndexed(entries, key = { _, e -> e.exerciseId }) { idx, entry ->
            val isSelected = entry.exerciseId == selectedExerciseId
            val allDone = entry.sets.isNotEmpty() && entry.sets.all { it.completed }
            val timerRunning = exerciseTimers[entry.exerciseId]?.running == true
            Surface(
                onClick = { onSelectExercise(entry.exerciseId) },
                shape = RoundedCornerShape(999.dp),
                color = when {
                    isSelected -> tokens.accentColor
                    allDone -> Color(0x2616A34A)
                    else -> tokens.controlBg
                },
                border = BorderStroke(
                    1.dp,
                    when {
                        isSelected -> tokens.accentColor
                        timerRunning -> Color(0x9938BDF8)
                        allDone -> Color(0x6616A34A)
                        else -> tokens.surfaceBorderColor
                    }
                ),
                modifier = Modifier.tactilePress(pressedScale = 0.95f, disabledByPerf = noAnim)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "${idx + 1}.",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) tokens.onAccentColor else tokens.accentColor
                    )
                    Text(
                        text = entry.name,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) tokens.onAccentColor else Color(0xFFF4F5F7),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (allDone) {
                        Icon(
                            imageVector = Icons.Rounded.CheckCircle,
                            contentDescription = null,
                            tint = if (isSelected) tokens.onAccentColor else Color(0xFF4ADE80),
                            modifier = Modifier.size(14.dp)
                        )
                    } else if (timerRunning) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF38BDF8))
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun WorkoutFloatingRestBar(
    restTimerFlow: StateFlow<RestTimerDisplayState>,
    restBarDismissed: Boolean,
    bottomInset: androidx.compose.ui.unit.Dp,
    secUnit: String,
    onUndismiss: () -> Unit,
    onAdjust: (Int) -> Unit,
    onTogglePause: () -> Unit,
    onDismissAndStop: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val rest by restTimerFlow.collectAsStateWithLifecycle()

    LaunchedEffect(rest.isActive) {
        if (rest.isActive) onUndismiss()
    }

    val restRunning = rest.isActive
    val restRemaining = rest.remainingSeconds
    val restTotal = rest.totalSeconds.coerceAtLeast(1)
    val restLabel = rest.exerciseName
    val visible = !restBarDismissed && (restRunning || (restRemaining in 1 until restTotal))
    if (!visible) return

    Surface(
        shape = RoundedCornerShape(20.dp),
        color = tokens.palette.surfaceContainerHigh.copy(alpha = 0.96f),
        border = BorderStroke(
            1.dp,
            if (restRemaining == 0) Color(0x8016A34A) else tokens.accentColor.copy(alpha = 0.55f)
        ),
        shadowElevation = 14.dp,
        modifier = modifier
            .padding(start = 16.dp, end = 16.dp, bottom = bottomInset + 14.dp)
            .fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(modifier = Modifier.size(38.dp), contentAlignment = Alignment.Center) {
                val ringColor = if (restRemaining == 0) Color(0xFF4ADE80) else tokens.accentColor
                val frac by animateFloatAsState(
                    targetValue = (restRemaining.toFloat() / restTotal.toFloat()).coerceIn(0f, 1f),
                    animationSpec = if (noAnim) tween(0) else tween(220),
                    label = "floatingRestArc"
                )
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val stroke = 3.dp.toPx()
                    drawArc(Color.White.copy(alpha = 0.1f), 0f, 360f, false, style = Stroke(stroke))
                    drawArc(
                        ringColor,
                        -90f,
                        360f * frac,
                        false,
                        style = Stroke(stroke, cap = StrokeCap.Round)
                    )
                }
                Icon(
                    imageVector = Icons.Rounded.Timer,
                    contentDescription = null,
                    tint = ringColor,
                    modifier = Modifier.size(16.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = GymModelHelpers.formatRestDuration(restRemaining),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (restRemaining == 0) Color(0xFF4ADE80) else Color(0xFFF4F5F7)
                )
                Text(
                    text = restLabel.ifBlank { lang.t("Istirahat antar set", "Between-set rest") },
                    fontSize = 11.5.sp,
                    color = tokens.mutedTextColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Surface(
                onClick = { onAdjust(15) },
                shape = RoundedCornerShape(10.dp),
                color = tokens.controlBg,
                border = BorderStroke(1.dp, tokens.subtleBorderColor),
                modifier = Modifier.tactilePress(disabledByPerf = noAnim)
            ) {
                Text(
                    text = "+15$secUnit",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFF4F5F7),
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
                )
            }

            Surface(
                onClick = onTogglePause,
                shape = RoundedCornerShape(10.dp),
                color = tokens.accentColor,
                modifier = Modifier.tactilePress(disabledByPerf = noAnim)
            ) {
                Box(modifier = Modifier.padding(8.dp)) {
                    Icon(
                        imageVector = if (restRunning) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                        contentDescription = null,
                        tint = tokens.onAccentColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Surface(
                onClick = onDismissAndStop,
                shape = RoundedCornerShape(10.dp),
                color = Color.Transparent,
                modifier = Modifier.tactilePress(disabledByPerf = noAnim)
            ) {
                Box(modifier = Modifier.padding(6.dp)) {
                    Icon(
                        imageVector = Icons.Rounded.Close,
                        contentDescription = lang.t("Lewati", "Skip"),
                        tint = tokens.mutedTextColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ExerciseCockpitCard(
    index: Int,
    totalExercises: Int,
    entry: WorkoutLogEntry,
    spec: ExerciseItem?,
    notesExpanded: Boolean,
    onToggleNotes: () -> Unit,
    exerciseTimersFlow: StateFlow<Map<String, ExerciseTimerUiState>>,
    cooldownSecondsFlow: StateFlow<Int>,
    onStartRest: (Int) -> Unit,
    onToggleSetComplete: (Int) -> Unit,
    onUpdateSetMetrics: (Int, Double, Int) -> Unit,
    onUpdateSetDuration: (Int, Int) -> Unit,
    onToggleExerciseTimer: (Int) -> Unit,
    onResetExerciseTimer: () -> Unit,
    onSelectExerciseTimerSet: (Int) -> Unit,
    onChangeTimerDirection: (TimerDirection) -> Unit,
    onSaveExerciseTimer: () -> Unit,
    onAddSet: () -> Unit,
    onRemoveSet: () -> Unit,
    secUnit: String,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val mode = spec?.trackingMode ?: entry.trackingMode
    val usesWeight = GymModelHelpers.resolveUsesWeight(
        usesWeight = entry.usesWeight,
        trackingMode = mode,
        targetWeightKg = spec?.targetWeightKg ?: entry.sets.firstOrNull()?.weightKg ?: 0.0,
        equipment = spec?.equipment
    )
    val defaultTargetDur = GymModelHelpers.resolveTargetDurationSeconds(
        spec?.targetDurationSeconds ?: entry.targetDurationSeconds,
        spec?.targetReps
    )
    val doneCount = entry.sets.count { it.completed }
    val allDone = entry.sets.isNotEmpty() && doneCount == entry.sets.size
    val firstIncompleteSet = entry.sets.firstOrNull { !it.completed }?.setNumber
        ?: entry.sets.firstOrNull()?.setNumber ?: 1

    val timerMap = if (mode == ExerciseTrackingMode.TIMER) {
        exerciseTimersFlow.collectAsStateWithLifecycle().value
    } else {
        emptyMap()
    }
    val timerState = timerMap[entry.exerciseId]
    val timerRunning = timerState?.running == true
    val activeSetNumber = timerState?.activeSetNumber?.takeIf { n -> entry.sets.any { it.setNumber == n } }
        ?: firstIncompleteSet

    val cardBorder = when {
        allDone -> Color(0x8016A34A)
        timerRunning -> Color(0x9938BDF8)
        else -> null
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .ironGlassSurface(tokens, borderOverride = cardBorder)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Spotlight Header
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "${(index + 1).toString().padStart(2, '0')} / ${totalExercises.toString().padStart(2, '0')}",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.accentColor
                )
                Text("·", fontSize = 12.sp, color = tokens.mutedTextColor)
                Text(
                    text = entry.muscleGroup.label(lang),
                    fontSize = 12.sp,
                    color = tokens.mutedTextColor
                )
                if (!spec?.equipment.isNullOrBlank()) {
                    Text("·", fontSize = 12.sp, color = tokens.mutedTextColor)
                    Text(
                        text = spec?.equipment ?: "",
                        fontSize = 12.sp,
                        color = tokens.mutedTextColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Text(
                text = entry.name,
                fontSize = 24.sp,
                lineHeight = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFFF4F5F7)
            )

            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                if (spec != null) {
                    Text(
                        text = if (mode == ExerciseTrackingMode.TIMER) {
                            "${lang.t("Timer", "Timer")} ${spec.targetSets}×${GymModelHelpers.formatCompactDuration(defaultTargetDur, lang)}"
                        } else {
                            "${lang.t("Target", "Target")} ${spec.targetSets}×${spec.targetReps}"
                        },
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        color = Color(0xFFD1D5DB)
                    )
                }
                if (!usesWeight) {
                    Text("· ${lang.t("Tanpa Beban", "Bodyweight")}", fontSize = 12.sp, color = tokens.mutedTextColor)
                }
                if (spec != null) {
                    Text(
                        text = "· ${lang.t("Istirahat", "Rest")} ${spec.restSeconds}$secUnit",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        color = tokens.mutedTextColor
                    )
                }
                Text(
                    text = "· $doneCount/${entry.sets.size} ${lang.t("Set", "Sets")}",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (allDone) Color(0xFF4ADE80) else tokens.accentColor
                )
            }
        }

        // Quick Rest Trigger & Notes Toggle
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                onClick = { onStartRest(spec?.restSeconds ?: 60) },
                shape = RoundedCornerShape(999.dp),
                color = tokens.accentColor.copy(alpha = 0.14f),
                border = BorderStroke(1.dp, tokens.accentColor.copy(alpha = 0.38f)),
                modifier = Modifier.tactilePress(disabledByPerf = noAnim)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Timer,
                        contentDescription = null,
                        tint = tokens.accentColor,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "${lang.t("Istirahat", "Rest")} ${spec?.restSeconds ?: 60}$secUnit",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.accentColor
                    )
                }
            }

            if (!spec?.notes.isNullOrBlank()) {
                Surface(
                    onClick = onToggleNotes,
                    shape = RoundedCornerShape(999.dp),
                    color = tokens.controlBg,
                    border = BorderStroke(1.dp, tokens.subtleBorderColor),
                    modifier = Modifier.tactilePress(disabledByPerf = noAnim)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = lang.t("Teknik", "Form"),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFFD1D5DB)
                        )
                        Icon(
                            imageVector = if (notesExpanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
                            contentDescription = null,
                            tint = tokens.mutedTextColor,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        AnimatedVisibility(visible = notesExpanded && !spec?.notes.isNullOrBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(tokens.wellBg)
                    .border(1.dp, tokens.subtleBorderColor, RoundedCornerShape(14.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = spec?.notes ?: "",
                    fontSize = 12.5.sp,
                    lineHeight = 18.sp,
                    color = Color(0xFFD1D5DB)
                )
            }
        }

        // DEDICATED EXERCISE TIMER STAGE (Timer Mode Movements)
        if (mode == ExerciseTrackingMode.TIMER) {
            val timerDirection = timerState?.direction ?: spec?.timerDirection ?: entry.timerDirection
            val activeSetObj = entry.sets.firstOrNull { it.setNumber == activeSetNumber }
            val activeTargetSeconds = (activeSetObj?.durationSeconds?.takeIf { it > 0 } ?: defaultTargetDur).coerceAtLeast(5)
            val elapsedSeconds = timerState?.elapsedSeconds ?: 0
            val displayClockSeconds = if (timerDirection == TimerDirection.COUNTDOWN) {
                (activeTargetSeconds - elapsedSeconds).coerceAtLeast(0)
            } else {
                elapsedSeconds
            }
            val timerProgress = if (activeTargetSeconds > 0) {
                (elapsedSeconds.toFloat() / activeTargetSeconds.toFloat()).coerceIn(0f, 1f)
            } else 0f

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (timerRunning) Color(0xB30C1924) else tokens.wellBg)
                    .border(
                        1.dp,
                        if (timerRunning) Color(0x8C38BDF8) else tokens.subtleBorderColor,
                        RoundedCornerShape(16.dp)
                    )
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "${lang.t("Timer Gerakan", "Exercise Timer")} · #$activeSetNumber",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF38BDF8)
                )

                if (entry.sets.size > 1) {
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        entry.sets.forEach { s ->
                            val isActiveSet = s.setNumber == activeSetNumber
                            Box(
                                modifier = Modifier
                                    .tactilePress(pressedScale = 0.92f, disabledByPerf = noAnim)
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(
                                        when {
                                            isActiveSet -> Color(0xFF38BDF8)
                                            s.completed -> Color(0x3316A34A)
                                            else -> tokens.subtleChipBg
                                        }
                                    )
                                    .clickable { onSelectExerciseTimerSet(s.setNumber) }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "S${s.setNumber}",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = when {
                                        isActiveSet -> Color(0xFF0A0B0E)
                                        s.completed -> Color(0xFF86EFAC)
                                        else -> tokens.mutedTextColor
                                    }
                                )
                            }
                        }
                    }
                }

                // Countdown / Countup Mode Switch
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(999.dp))
                        .background(tokens.controlBg)
                        .border(1.dp, tokens.subtleBorderColor, RoundedCornerShape(999.dp))
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf(
                        TimerDirection.COUNTDOWN to lang.t("Hitung Mundur", "Countdown"),
                        TimerDirection.COUNTUP to lang.t("Hitung Maju", "Count-Up")
                    ).forEach { (dir, label) ->
                        val active = timerDirection == dir
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .tactilePress(pressedScale = 0.96f, disabledByPerf = noAnim)
                                .clip(RoundedCornerShape(999.dp))
                                .background(
                                    when {
                                        active && dir == TimerDirection.COUNTDOWN -> Color(0xFF38BDF8)
                                        active -> tokens.accentColor
                                        else -> Color.Transparent
                                    }
                                )
                                .clickable { onChangeTimerDirection(dir) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = when {
                                    active && dir == TimerDirection.COUNTDOWN -> Color(0xFF0A0B0E)
                                    active -> tokens.onAccentColor
                                    else -> tokens.mutedTextColor
                                }
                            )
                        }
                    }
                }

                Text(
                    text = GymModelHelpers.formatTimerClock(displayClockSeconds),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 42.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFF4F5F7)
                )
                Text(
                    text = if (timerDirection == TimerDirection.COUNTDOWN) {
                        "${lang.t("Target durasi", "Target duration")}: ${GymModelHelpers.formatCompactDuration(activeTargetSeconds, lang)}"
                    } else {
                        "${lang.t("Stopwatch dari 00:00 · Target", "Stopwatch from 00:00 · Target")} ${GymModelHelpers.formatCompactDuration(activeTargetSeconds, lang)}"
                    },
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    color = tokens.mutedTextColor
                )

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { onToggleExerciseTimer(activeSetNumber) },
                        shape = RoundedCornerShape(999.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = when {
                                timerRunning -> Color(0xFFF59E0B)
                                timerDirection == TimerDirection.COUNTDOWN -> Color(0xFF38BDF8)
                                else -> tokens.accentColor
                            },
                            contentColor = if (timerRunning || timerDirection == TimerDirection.COUNTDOWN) {
                                Color(0xFF0A0B0E)
                            } else {
                                tokens.onAccentColor
                            }
                        ),
                        modifier = Modifier
                            .height(46.dp)
                            .tactilePress(disabledByPerf = noAnim)
                    ) {
                        Icon(
                            imageVector = if (timerRunning) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = when {
                                timerRunning -> lang.t("Jeda", "Pause")
                                elapsedSeconds > 0 -> lang.t("Lanjut", "Resume")
                                else -> lang.t("Mulai Timer", "Start Timer")
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    OutlinedButton(
                        onClick = onResetExerciseTimer,
                        shape = RoundedCornerShape(999.dp),
                        border = BorderStroke(1.dp, tokens.subtleBorderColor),
                        modifier = Modifier
                            .height(46.dp)
                            .tactilePress(disabledByPerf = noAnim)
                    ) {
                        Icon(Icons.Rounded.Refresh, contentDescription = null, tint = Color(0xFFD1D5DB), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(lang.t("Reset", "Reset"), fontSize = 12.5.sp, color = Color(0xFFD1D5DB))
                    }

                    if (elapsedSeconds > 0 || timerRunning) {
                        Button(
                            onClick = onSaveExerciseTimer,
                            shape = RoundedCornerShape(999.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF16A34A),
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .height(46.dp)
                                .tactilePress(disabledByPerf = noAnim)
                        ) {
                            Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(lang.t("Simpan Set #$activeSetNumber", "Save Set #$activeSetNumber"), fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
                        }
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color.White.copy(alpha = 0.1f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(timerProgress)
                            .height(6.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(if (timerDirection == TimerDirection.COUNTDOWN) Color(0xFF38BDF8) else tokens.accentColor)
                    )
                }
            }
        }

        // SET ROWS
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            entry.sets.forEach { setRow ->
                val isNextActiveSet = !allDone && setRow.setNumber == firstIncompleteSet
                val rowDur = if (setRow.durationSeconds > 0) setRow.durationSeconds else defaultTargetDur

                val rowBg = when {
                    setRow.completed -> Color(0x1A16A34A)
                    mode == ExerciseTrackingMode.TIMER && setRow.setNumber == activeSetNumber -> Color(0x1238BDF8)
                    isNextActiveSet -> tokens.subtleChipBg
                    else -> tokens.wellBg
                }
                val rowBorder = when {
                    setRow.completed -> Color(0x7316A34A)
                    mode == ExerciseTrackingMode.TIMER && setRow.setNumber == activeSetNumber -> Color(0x7338BDF8)
                    isNextActiveSet -> tokens.accentColor.copy(alpha = 0.48f)
                    else -> tokens.subtleBorderColor
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(rowBg)
                        .border(1.dp, rowBorder, RoundedCornerShape(16.dp))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Top Line: SET N + Isolated Cooldown/Done Button
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "SET ${setRow.setNumber}",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = when {
                                    setRow.completed -> Color(0xFF4ADE80)
                                    isNextActiveSet -> tokens.accentColor
                                    else -> Color(0xFFD1D5DB)
                                }
                            )
                            if (isNextActiveSet && !setRow.completed) {
                                Text(
                                    text = lang.t("Berikutnya", "Up next"),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = tokens.accentColor
                                )
                            }
                            if (setRow.completed) {
                                Text(
                                    text = lang.t("Selesai", "Done"),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF86EFAC)
                                )
                            }
                        }

                        SetCompletePillButton(
                            completed = setRow.completed,
                            isNextActiveSet = isNextActiveSet,
                            cooldownSecondsFlow = cooldownSecondsFlow,
                            secUnit = secUnit,
                            onClick = { onToggleSetComplete(setRow.setNumber) }
                        )
                    }

                    // Bottom Line: Weight + Reps/Duration Steppers
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (usesWeight) {
                            TactileStepperControl(
                                label = "${lang.t("Beban", "Weight")} (kg)",
                                valueText = GymModelHelpers.formatWeight(setRow.weightKg),
                                onDecrement = {
                                    val next = ((setRow.weightKg - 2.5) * 10.0).roundToInt() / 10.0
                                    onUpdateSetMetrics(setRow.setNumber, next.coerceAtLeast(0.0), setRow.reps)
                                },
                                onIncrement = {
                                    val next = ((setRow.weightKg + 2.5) * 10.0).roundToInt() / 10.0
                                    onUpdateSetMetrics(setRow.setNumber, next.coerceAtMost(999.0), setRow.reps)
                                },
                                onDirectEdit = { raw ->
                                    val parsed = raw.replace(',', '.').toDoubleOrNull()
                                    if (parsed != null) {
                                        onUpdateSetMetrics(setRow.setNumber, parsed.coerceIn(0.0, 999.0), setRow.reps)
                                    }
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        if (mode == ExerciseTrackingMode.TIMER) {
                            TactileStepperControl(
                                label = lang.t("Durasi", "Duration"),
                                valueText = GymModelHelpers.formatTimerClock(rowDur),
                                onDecrement = {
                                    onUpdateSetDuration(setRow.setNumber, (rowDur - 10).coerceAtLeast(5))
                                },
                                onIncrement = {
                                    onUpdateSetDuration(setRow.setNumber, (rowDur + 10).coerceAtMost(10800))
                                },
                                modifier = Modifier.weight(1f)
                            )
                        } else {
                            TactileStepperControl(
                                label = "${lang.t("Repetisi", "Reps")} (reps)",
                                valueText = setRow.reps.toString(),
                                onDecrement = {
                                    onUpdateSetMetrics(setRow.setNumber, setRow.weightKg, (setRow.reps - 1).coerceAtLeast(0))
                                },
                                onIncrement = {
                                    onUpdateSetMetrics(setRow.setNumber, setRow.weightKg, (setRow.reps + 1).coerceAtMost(999))
                                },
                                onDirectEdit = { raw ->
                                    val parsed = raw.toIntOrNull()
                                    if (parsed != null) {
                                        onUpdateSetMetrics(setRow.setNumber, setRow.weightKg, parsed.coerceIn(0, 999))
                                    }
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }

        // + Set / - Set Footer Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedButton(
                onClick = onAddSet,
                enabled = entry.sets.size < 12,
                shape = RoundedCornerShape(tokens.buttonRadius),
                border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                modifier = Modifier
                    .weight(1f)
                    .height(42.dp)
                    .tactilePress(enabled = entry.sets.size < 12, disabledByPerf = noAnim)
            ) {
                Icon(Icons.Rounded.Add, contentDescription = null, tint = tokens.accentColor, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(lang.t("Tambah Set", "Add Set"), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF4F5F7))
            }

            OutlinedButton(
                onClick = onRemoveSet,
                enabled = entry.sets.size > 1,
                shape = RoundedCornerShape(tokens.buttonRadius),
                border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                modifier = Modifier
                    .weight(1f)
                    .height(42.dp)
                    .tactilePress(enabled = entry.sets.size > 1, disabledByPerf = noAnim)
            ) {
                Icon(Icons.Rounded.Remove, contentDescription = null, tint = tokens.mutedTextColor, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(lang.t("Kurangi Set", "Remove Set"), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFD1D5DB))
            }
        }
    }
}

@Composable
private fun SetCompletePillButton(
    completed: Boolean,
    isNextActiveSet: Boolean,
    cooldownSecondsFlow: StateFlow<Int>,
    secUnit: String,
    onClick: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val noAnim = tokens.performance.noAnimations
    val cooldownRemaining = if (!completed) {
        cooldownSecondsFlow.collectAsStateWithLifecycle().value
    } else {
        0
    }
    val isBlockedByCooldown = !completed && cooldownRemaining > 0

    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(999.dp),
        color = when {
            completed -> Color(0xFF16A34A)
            isBlockedByCooldown -> tokens.wellBg
            isNextActiveSet -> tokens.accentColor
            else -> tokens.controlBg
        },
        border = BorderStroke(
            1.dp,
            when {
                completed -> Color(0xFF16A34A)
                isBlockedByCooldown -> Color(0x7338BDF8)
                isNextActiveSet -> tokens.accentColor
                else -> tokens.subtleBorderColor
            }
        ),
        modifier = Modifier.tactilePress(pressedScale = 0.94f, disabledByPerf = noAnim)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            if (isBlockedByCooldown) {
                Text(
                    text = "$cooldownRemaining$secUnit",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF38BDF8)
                )
            } else {
                Icon(
                    imageVector = Icons.Rounded.Check,
                    contentDescription = null,
                    tint = when {
                        completed -> Color.White
                        isNextActiveSet -> tokens.onAccentColor
                        else -> Color(0xFFE5E7EB)
                    },
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = lang.t("Selesai", "Done"),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        completed -> Color.White
                        isNextActiveSet -> tokens.onAccentColor
                        else -> Color(0xFFE5E7EB)
                    }
                )
            }
        }
    }
}
