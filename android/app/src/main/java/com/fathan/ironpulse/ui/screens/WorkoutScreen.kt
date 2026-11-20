package com.fathan.ironpulse.ui.screens

import android.view.HapticFeedbackConstants
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.TimerDirection
import com.fathan.ironpulse.model.WorkoutLogEntry
import com.fathan.ironpulse.model.WorkoutSetLog
import com.fathan.ironpulse.ui.viewmodel.ExerciseTimerUiState
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState

@Composable
fun WorkoutScreen(
    state: IronPulseUiState,
    onToggleSet: (String, Int) -> Unit,
    onUpdateSetMetrics: (String, Int, Double, Int) -> Unit,
    onAddSet: (String) -> Unit,
    onRemoveSet: (String) -> Unit,
    onToggleExerciseTimer: (WorkoutLogEntry, Int) -> Unit,
    onResetExerciseTimer: (WorkoutLogEntry) -> Unit,
    onSelectTimerSet: (WorkoutLogEntry, Int) -> Unit,
    onCompleteTimerSet: (String, Int, Int) -> Unit,
    onStartRestTimer: (Int, String) -> Unit,
    onAdd15sRest: () -> Unit,
    onStopRestTimer: () -> Unit,
    onOpenSchedule: () -> Unit
) {
    val view = LocalView.current
    val entries = state.effectiveTodayEntries
    val schedule = state.schedules[state.todayDayKey]
    val restMap = remember(schedule) {
        schedule?.exercises?.associate { it.id to it.restSeconds } ?: emptyMap()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Active Rest Timer Sticky Banner
        if (state.restTimer.isActive) {
            val total = state.restTimer.totalSeconds.coerceAtLeast(1)
            val progress = state.restTimer.remainingSeconds.toFloat() / total.toFloat()
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                tonalElevation = 4.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "ISTIRAHAT ANTAR SET",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Text(
                                text = state.restTimer.exerciseName.ifBlank { "Persiapan Set Berikutnya" },
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Text(
                            text = GymModelHelpers.formatRestDuration(state.restTimer.remainingSeconds),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    LinearProgressIndicator(
                        progress = { progress.coerceIn(0f, 1f) },
                        modifier = Modifier.fillMaxWidth().height(6.dp),
                        color = MaterialTheme.colorScheme.primary,
                        trackColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.3f)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = onAdd15sRest) {
                            Text("+15 Detik")
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = onStopRestTimer,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = MaterialTheme.colorScheme.onPrimary
                            )
                        ) {
                            Text("Lewati")
                        }
                    }
                }
            }
        }

        if (entries.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Tidak ada gerakan latihan hari ini",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Tambahkan gerakan ke jadwal ${state.todayDayKey.label} untuk memulai sesi latihan.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onOpenSchedule) {
                    Text("Buka Jadwal")
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(entries, key = { it.exerciseId }) { entry ->
                    val restSeconds = restMap[entry.exerciseId] ?: 60
                    val timerUi = state.exerciseTimers[entry.exerciseId] ?: ExerciseTimerUiState(
                        activeSetNumber = entry.sets.firstOrNull { !it.completed }?.setNumber ?: 1,
                        running = false,
                        elapsedSeconds = 0,
                        targetSeconds = entry.targetDurationSeconds,
                        direction = entry.timerDirection
                    )

                    WorkoutExerciseCard(
                        entry = entry,
                        restSeconds = restSeconds,
                        timerState = timerUi,
                        onToggleSet = { setNum ->
                            view.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK)
                            onToggleSet(entry.exerciseId, setNum)
                        },
                        onUpdateMetrics = { setNum, kg, reps ->
                            onUpdateSetMetrics(entry.exerciseId, setNum, kg, reps)
                        },
                        onAddSet = { onAddSet(entry.exerciseId) },
                        onRemoveSet = { onRemoveSet(entry.exerciseId) },
                        onToggleTimer = { setNum -> onToggleExerciseTimer(entry, setNum) },
                        onResetTimer = { onResetExerciseTimer(entry) },
                        onSelectTimerSet = { setNum -> onSelectTimerSet(entry, setNum) },
                        onCompleteTimerSet = { setNum, secs ->
                            view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                            onCompleteTimerSet(entry.exerciseId, setNum, secs)
                        },
                        onStartRest = { onStartRestTimer(restSeconds, entry.name) }
                    )
                }
                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }
}

@Composable
private fun WorkoutExerciseCard(
    entry: WorkoutLogEntry,
    restSeconds: Int,
    timerState: ExerciseTimerUiState,
    onToggleSet: (Int) -> Unit,
    onUpdateMetrics: (Int, Double, Int) -> Unit,
    onAddSet: () -> Unit,
    onRemoveSet: () -> Unit,
    onToggleTimer: (Int) -> Unit,
    onResetTimer: () -> Unit,
    onSelectTimerSet: (Int) -> Unit,
    onCompleteTimerSet: (Int, Int) -> Unit,
    onStartRest: () -> Unit
) {
    val doneCount = entry.sets.count { it.completed }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = entry.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${entry.muscleGroup.label} · Istirahat ${restSeconds}d · $doneCount/${entry.sets.size} set",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = onStartRest) {
                    Icon(
                        imageVector = Icons.Rounded.Timer,
                        contentDescription = "Mulai Rest Timer",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Timer Controller for duration-based exercises
            if (entry.trackingMode == ExerciseTrackingMode.TIMER) {
                val shownSeconds = if (timerState.direction == TimerDirection.COUNTDOWN) {
                    (timerState.targetSeconds - timerState.elapsedSeconds).coerceAtLeast(0)
                } else {
                    timerState.elapsedSeconds
                }

                Surface(
                    color = MaterialTheme.colorScheme.surfaceContainerHigh,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Set ${timerState.activeSetNumber} (${if (timerState.direction == TimerDirection.COUNTDOWN) "Countdown" else "Stopwatch"})",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = GymModelHelpers.formatRestDuration(shownSeconds),
                                    style = MaterialTheme.typography.displaySmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                FilledIconButton(
                                    onClick = { onToggleTimer(timerState.activeSetNumber) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = if (timerState.running) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                                        contentDescription = "Mulai atau Jeda Timer"
                                    )
                                }
                                IconButton(
                                    onClick = onResetTimer,
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.Refresh,
                                        contentDescription = "Reset Timer"
                                    )
                                }
                            }
                        }

                        if (timerState.elapsedSeconds > 0) {
                            OutlinedButton(
                                onClick = {
                                    onCompleteTimerSet(
                                        timerState.activeSetNumber,
                                        timerState.elapsedSeconds.coerceAtLeast(1)
                                    )
                                    onResetTimer()
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Catat & Selesaikan Set ${timerState.activeSetNumber}")
                            }
                        }
                    }
                }
            }

            // Set rows
            entry.sets.forEach { setLog ->
                SetRowItem(
                    setLog = setLog,
                    trackingMode = entry.trackingMode,
                    usesWeight = entry.usesWeight,
                    isSelectedTimerSet = entry.trackingMode == ExerciseTrackingMode.TIMER &&
                        timerState.activeSetNumber == setLog.setNumber,
                    onToggleComplete = { onToggleSet(setLog.setNumber) },
                    onUpdateMetrics = { kg, reps -> onUpdateMetrics(setLog.setNumber, kg, reps) },
                    onSelectTimerSet = { onSelectTimerSet(setLog.setNumber) }
                )
            }

            // Add / Remove set buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onRemoveSet,
                    enabled = entry.sets.size > 1,
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Rounded.Remove, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Kurangi Set")
                }
                OutlinedButton(
                    onClick = onAddSet,
                    enabled = entry.sets.size < 12,
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Tambah Set")
                }
            }
        }
    }
}

@Composable
private fun SetRowItem(
    setLog: WorkoutSetLog,
    trackingMode: ExerciseTrackingMode,
    usesWeight: Boolean,
    isSelectedTimerSet: Boolean,
    onToggleComplete: () -> Unit,
    onUpdateMetrics: (Double, Int) -> Unit,
    onSelectTimerSet: () -> Unit
) {
    var weightInput by remember(setLog.setNumber, setLog.weightKg) {
        mutableStateOf(GymModelHelpers.formatWeight(setLog.weightKg))
    }
    var repsInput by remember(setLog.setNumber, setLog.reps) {
        mutableStateOf(setLog.reps.toString())
    }

    Surface(
        color = when {
            setLog.completed -> MaterialTheme.colorScheme.tertiary.copy(alpha = 0.14f)
            isSelectedTimerSet -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
            else -> MaterialTheme.colorScheme.surfaceContainerLow
        },
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            TextButton(
                onClick = { if (trackingMode == ExerciseTrackingMode.TIMER) onSelectTimerSet() },
                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "#${setLog.setNumber}",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            if (trackingMode == ExerciseTrackingMode.TIMER) {
                Text(
                    text = if (setLog.completed) {
                        "Selesai · ${GymModelHelpers.formatRestDuration(setLog.durationSeconds)}"
                    } else {
                        "Target · ${GymModelHelpers.formatRestDuration(setLog.durationSeconds)}"
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f)
                )
            } else {
                if (usesWeight) {
                    OutlinedTextField(
                        value = weightInput,
                        onValueChange = { raw ->
                            weightInput = raw
                            val parsed = raw.replace(',', '.').toDoubleOrNull()
                            if (parsed != null) {
                                onUpdateMetrics(parsed, setLog.reps)
                            }
                        },
                        label = { Text("kg") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = repsInput,
                    onValueChange = { raw ->
                        repsInput = raw
                        val parsed = raw.toIntOrNull()
                        if (parsed != null) {
                            onUpdateMetrics(setLog.weightKg, parsed)
                        }
                    },
                    label = { Text("Reps") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
            }

            FilledIconButton(
                onClick = onToggleComplete,
                modifier = Modifier.size(46.dp),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = if (setLog.completed) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = if (setLog.completed) MaterialTheme.colorScheme.onTertiary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            ) {
                Icon(
                    imageVector = Icons.Rounded.Check,
                    contentDescription = "Tandai Set Selesai"
                )
            }
        }
    }
}
