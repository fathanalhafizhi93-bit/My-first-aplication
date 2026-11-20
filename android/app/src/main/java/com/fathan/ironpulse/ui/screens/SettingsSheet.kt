package com.fathan.ironpulse.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.fathan.ironpulse.alarm.AlarmScheduler
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(
    state: IronPulseUiState,
    onDismiss: () -> Unit,
    onSaveDisplayName: (String) -> Unit,
    onUpdateVolume: (Double) -> Unit,
    onUpdateSnooze: (Int) -> Unit,
    onUpdateAutoRest: (Boolean) -> Unit,
    onToggleNotifications: (Boolean) -> Unit,
    onOpenExactAlarmSettings: () -> Unit,
    onSignOut: () -> Unit
) {
    val context = LocalContext.current
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val profile = state.profile

    var nameDraft by remember(profile?.displayName) {
        mutableStateOf(profile?.displayName ?: "")
    }
    var volumeSlider by remember(profile?.volume) {
        mutableFloatStateOf((profile?.volume ?: 0.85).toFloat())
    }
    val exactAlarmAllowed = remember { AlarmScheduler.canScheduleExactAlarms(context) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Pengaturan Akun & Alarm",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface
            )

            if (profile != null) {
                Text(
                    text = profile.email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = nameDraft,
                        onValueChange = { nameDraft = it.take(100) },
                        label = { Text("Nama Tampilan") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        enabled = nameDraft.isNotBlank() && nameDraft.trim() != profile.displayName,
                        onClick = { onSaveDisplayName(nameDraft.trim()) },
                        modifier = Modifier.height(52.dp)
                    ) {
                        Text("Simpan")
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Alarm & Notifikasi Sistem", style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "Jadwalkan pengingat waktu latihan native",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = profile.notificationsEnabled,
                        onCheckedChange = onToggleNotifications
                    )
                }

                if (!exactAlarmAllowed) {
                    OutlinedButton(
                        onClick = onOpenExactAlarmSettings,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Izinkan Alarm Presisi di Setelan Android")
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Volume Alarm (${(volumeSlider * 100).roundToInt()}%)",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Slider(
                        value = volumeSlider,
                        onValueChange = { volumeSlider = it },
                        onValueChangeFinished = { onUpdateVolume(volumeSlider.toDouble()) },
                        valueRange = 0.1f..1.0f
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Durasi Tunda (Snooze)", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(3, 5, 10, 15).forEach { mins ->
                            FilterChip(
                                selected = profile.snoozeMinutes == mins,
                                onClick = { onUpdateSnooze(mins) },
                                label = { Text("${mins}m") }
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Auto-Start Rest Timer", style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "Mulai timer istirahat otomatis saat set dicentang",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = profile.autoStartRestTimer,
                        onCheckedChange = onUpdateAutoRest
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = {
                        onDismiss()
                        onSignOut()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer,
                        contentColor = MaterialTheme.colorScheme.onErrorContainer
                    )
                ) {
                    Text("Keluar dari Akun")
                }
            }
        }
    }
}
