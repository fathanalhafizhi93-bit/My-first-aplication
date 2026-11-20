package com.fathan.ironpulse.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fathan.ironpulse.model.ExerciseTrackingMode
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.WorkoutLog
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import kotlin.math.roundToInt

@Composable
fun HistoryScreen(state: IronPulseUiState) {
    val history = state.workoutHistory
    val completedSessions = history.count { it.completed }
    val totalVolumeKg = remember(history) {
        history.sumOf { log ->
            log.entries.sumOf { entry ->
                entry.sets.filter { it.completed }.sumOf { s ->
                    if (entry.usesWeight) s.weightKg * s.reps else 0.0
                }
            }
        }.roundToInt()
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "Riwayat & Progres",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // KPI Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricSummaryCard(
                    label = "Total Catatan",
                    value = "${history.size} hari",
                    modifier = Modifier.weight(1f)
                )
                MetricSummaryCard(
                    label = "Tuntas Penuh",
                    value = "$completedSessions sesi",
                    modifier = Modifier.weight(1f)
                )
                MetricSummaryCard(
                    label = "Volume Beban",
                    value = "$totalVolumeKg kg",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        if (history.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
                ) {
                    Text(
                        text = "Belum ada riwayat latihan tersimpan. Selesaikan set pertama Anda di tab Latihan!",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(20.dp)
                    )
                }
            }
        } else {
            items(history, key = { it.dateKey }) { log ->
                HistoryLogCard(log = log)
            }
        }

        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
private fun MetricSummaryCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun HistoryLogCard(log: WorkoutLog) {
    var expanded by remember { mutableStateOf(false) }
    val totalSets = log.entries.sumOf { it.sets.size }
    val doneSets = log.entries.sumOf { e -> e.sets.count { it.completed } }

    Card(
        onClick = { expanded = !expanded },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${log.dateKey} · ${log.dayKey.label}",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = log.focusTitle,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "$doneSets/$totalSets set selesai · ${log.entries.size} gerakan",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (log.completed) {
                        Icon(
                            imageVector = Icons.Rounded.CheckCircle,
                            contentDescription = "Tuntas",
                            tint = MaterialTheme.colorScheme.tertiary
                        )
                    }
                    Icon(
                        imageVector = if (expanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
                        contentDescription = "Detail"
                    )
                }
            }

            AnimatedVisibility(visible = expanded) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    log.entries.forEach { entry ->
                        val completedSets = entry.sets.filter { it.completed }
                        val detail = if (entry.trackingMode == ExerciseTrackingMode.TIMER) {
                            "${completedSets.size}/${entry.sets.size} set · " +
                                completedSets.joinToString(", ") { GymModelHelpers.formatRestDuration(it.durationSeconds) }
                        } else {
                            "${completedSets.size}/${entry.sets.size} set · " +
                                completedSets.joinToString(", ") { s ->
                                    if (entry.usesWeight && s.weightKg > 0.0) {
                                        "${GymModelHelpers.formatWeight(s.weightKg)}kg×${s.reps}"
                                    } else {
                                        "${s.reps} reps"
                                    }
                                }
                        }
                        Column {
                            Text(
                                text = entry.name,
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (completedSets.isEmpty()) "Belum ada set selesai" else detail,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}
