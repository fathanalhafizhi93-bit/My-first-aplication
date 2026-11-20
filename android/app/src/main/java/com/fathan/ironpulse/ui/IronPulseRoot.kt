package com.fathan.ironpulse.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fathan.ironpulse.ui.screens.AuthScreen
import com.fathan.ironpulse.ui.screens.HistoryScreen
import com.fathan.ironpulse.ui.screens.ScheduleScreen
import com.fathan.ironpulse.ui.screens.SettingsSheet
import com.fathan.ironpulse.ui.screens.TodayScreen
import com.fathan.ironpulse.ui.screens.WorkoutScreen
import com.fathan.ironpulse.ui.viewmodel.GymViewModel
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState

enum class MainNavTab(val label: String) {
    TODAY("Hari Ini"),
    WORKOUT("Latihan"),
    SCHEDULE("Jadwal"),
    HISTORY("Riwayat")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IronPulseRoot(
    state: IronPulseUiState,
    viewModel: GymViewModel,
    onRequestGoogleSignIn: () -> Unit,
    onRequestNotificationPermission: () -> Unit,
    onOpenExactAlarmSettings: () -> Unit
) {
    val snackbarHostState = remember { SnackbarHostState() }
    var currentTab by remember { mutableStateOf(MainNavTab.TODAY) }
    var showSettings by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.snackbarEvents.collect { msg ->
            snackbarHostState.showSnackbar(msg)
        }
    }

    if (!state.authReady) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    if (state.user == null) {
        AuthScreen(
            isLoading = state.authLoading,
            errorMessage = state.authError,
            onGoogleSignInClick = onRequestGoogleSignIn
        )
        return
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "IronPulse",
                        fontWeight = FontWeight.Bold
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                ),
                actions = {
                    IconButton(onClick = { showSettings = true }) {
                        Icon(
                            imageVector = Icons.Rounded.Settings,
                            contentDescription = "Pengaturan"
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surfaceContainerLow
            ) {
                MainNavTab.entries.forEach { tab ->
                    val icon = when (tab) {
                        MainNavTab.TODAY -> Icons.Rounded.Home
                        MainNavTab.WORKOUT -> Icons.Rounded.FitnessCenter
                        MainNavTab.SCHEDULE -> Icons.Rounded.CalendarMonth
                        MainNavTab.HISTORY -> Icons.Rounded.History
                    }
                    NavigationBarItem(
                        selected = currentTab == tab,
                        onClick = { currentTab = tab },
                        icon = { Icon(icon, contentDescription = tab.label) },
                        label = { Text(tab.label, maxLines = 1) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (!state.syncError.isNullOrBlank()) {
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    androidx.compose.foundation.layout.Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = state.syncError,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.weight(1f)
                        )
                        androidx.compose.material3.TextButton(onClick = viewModel::retrySync) {
                            Text("Coba Lagi")
                        }
                    }
                }
            } else if (state.isOffline) {
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Mode offline — perubahan akan disinkronkan saat koneksi kembali.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }

            if (state.dataLoading && state.schedules.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                when (currentTab) {
                    MainNavTab.TODAY -> TodayScreen(
                        state = state,
                        onStartWorkoutClick = { currentTab = MainNavTab.WORKOUT },
                        onOpenScheduleClick = { currentTab = MainNavTab.SCHEDULE }
                    )
                    MainNavTab.WORKOUT -> WorkoutScreen(
                        state = state,
                        onToggleSet = viewModel::toggleSetComplete,
                        onUpdateSetMetrics = viewModel::updateSetMetrics,
                        onAddSet = viewModel::addSetToExercise,
                        onRemoveSet = viewModel::removeSetFromExercise,
                        onToggleExerciseTimer = viewModel::toggleExerciseTimer,
                        onResetExerciseTimer = viewModel::resetExerciseTimer,
                        onSelectTimerSet = viewModel::selectExerciseTimerSet,
                        onCompleteTimerSet = viewModel::completeTimerSet,
                        onStartRestTimer = viewModel::startManualRestTimer,
                        onAdd15sRest = viewModel::add15SecondsRest,
                        onStopRestTimer = viewModel::stopRestTimer,
                        onOpenSchedule = { currentTab = MainNavTab.SCHEDULE }
                    )
                    MainNavTab.SCHEDULE -> ScheduleScreen(
                        state = state,
                        onUpdateScheduleFields = viewModel::updateScheduleFields,
                        onAddTemplatesToDay = viewModel::addTemplatesToDay,
                        onAddCustomExercise = viewModel::addCustomExerciseToDay,
                        onRemoveExercise = viewModel::removeExerciseFromDay,
                        onMoveExercise = viewModel::moveExerciseInDay
                    )
                    MainNavTab.HISTORY -> HistoryScreen(state = state)
                }
            }
        }
    }

    if (showSettings) {
        SettingsSheet(
            state = state,
            onDismiss = { showSettings = false },
            onSaveDisplayName = { newName -> viewModel.updateProfileSettings(displayName = newName) },
            onUpdateVolume = { vol -> viewModel.updateProfileSettings(volume = vol) },
            onUpdateSnooze = { mins -> viewModel.updateProfileSettings(snoozeMinutes = mins) },
            onUpdateAutoRest = { auto -> viewModel.updateProfileSettings(autoStartRestTimer = auto) },
            onToggleNotifications = { enabled ->
                if (enabled) onRequestNotificationPermission()
                viewModel.updateProfileSettings(notificationsEnabled = enabled)
            },
            onOpenExactAlarmSettings = onOpenExactAlarmSettings,
            onSignOut = viewModel::signOut
        )
    }
}
