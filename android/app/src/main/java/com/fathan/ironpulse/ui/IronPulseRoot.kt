package com.fathan.ironpulse.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fathan.ironpulse.ui.components.AboutDialog
import com.fathan.ironpulse.ui.components.ActiveAlarmOverlay
import com.fathan.ironpulse.ui.components.AmbientPhaseBackdrop
import com.fathan.ironpulse.ui.components.CooldownAlertModal
import com.fathan.ironpulse.ui.components.FeatureTutorialModal
import com.fathan.ironpulse.ui.components.FloatingMascotDock
import com.fathan.ironpulse.ui.components.IronPulseBottomNav
import com.fathan.ironpulse.ui.components.IronPulseTopBar
import com.fathan.ironpulse.ui.components.LaunchIntroOverlay
import com.fathan.ironpulse.ui.components.NamePromptModal
import com.fathan.ironpulse.ui.screens.AuthScreen
import com.fathan.ironpulse.ui.screens.ExercisesScreen
import com.fathan.ironpulse.ui.screens.HistoryScreen
import com.fathan.ironpulse.ui.screens.ScheduleScreen
import com.fathan.ironpulse.ui.screens.SettingsScreen
import com.fathan.ironpulse.ui.screens.TodayScreen
import com.fathan.ironpulse.ui.screens.WorkoutScreen
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.viewmodel.AppTab
import com.fathan.ironpulse.ui.viewmodel.GymViewModel
import com.fathan.ironpulse.ui.viewmodel.IronPulseUiState

@Composable
fun IronPulseRoot(
    state: IronPulseUiState,
    viewModel: GymViewModel,
    onRequestGoogleSignIn: () -> Unit,
    onRequestNotificationPermission: () -> Unit,
    onOpenExactAlarmSettings: () -> Unit,
    onPickCustomRingtone: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val snackbarHostState = remember { SnackbarHostState() }
    val todayListState = rememberLazyListState()
    val saveableStateHolder = rememberSaveableStateHolder()
    var tabBeforeSettings by remember { mutableStateOf(AppTab.TODAY) }

    LaunchedEffect(viewModel) {
        viewModel.snackbarEvents.collect { msg ->
            snackbarHostState.showSnackbar(msg)
        }
    }

    val navigateToTab: (AppTab) -> Unit = { target ->
        if (target == AppTab.SETTINGS) {
            if (state.activeTab != AppTab.SETTINGS) {
                tabBeforeSettings = state.activeTab
            }
            viewModel.selectTab(AppTab.SETTINGS)
        } else {
            viewModel.selectTab(target)
        }
    }

    BackHandler(enabled = state.isSignedIn && (state.activeTab == AppTab.SETTINGS || state.activeTab == AppTab.WORKOUT)) {
        if (state.activeTab == AppTab.SETTINGS) {
            val fallback = if (tabBeforeSettings == AppTab.SETTINGS) AppTab.TODAY else tabBeforeSettings
            viewModel.selectTab(fallback)
        } else if (state.activeTab == AppTab.WORKOUT) {
            viewModel.selectTab(AppTab.TODAY)
        }
    }

    if (!state.authReady) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(tokens.canvasBg),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                CircularProgressIndicator(color = tokens.accentColor)
                Text(
                    text = lang.t("Menyiapkan IronPulse...", "Preparing IronPulse..."),
                    fontSize = 13.sp,
                    color = tokens.mutedTextColor
                )
            }
        }
        return
    }

    if (!state.isSignedIn) {
        AuthScreen(
            authLoading = state.authLoading,
            authError = state.authError,
            onSelectLang = { viewModel.setLang(it) },
            onSignInClick = onRequestGoogleSignIn
        )
        return
    }

    val showFloatingMascot by remember(
        state.activeTab,
        state.showLaunchIntro,
        state.showNamePrompt,
        state.tutorialOpen,
        state.activeTestAlarm,
        todayListState
    ) {
        derivedStateOf {
            val modalBlocking = state.showLaunchIntro ||
                state.showNamePrompt ||
                state.tutorialOpen ||
                state.activeTestAlarm != null
            if (modalBlocking) {
                false
            } else if (state.activeTab != AppTab.TODAY) {
                true
            } else {
                todayListState.firstVisibleItemIndex > 0 || todayListState.firstVisibleItemScrollOffset > 460
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AmbientPhaseBackdrop()

        Scaffold(
            containerColor = Color.Transparent,
            snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
            topBar = {
                IronPulseTopBar(
                    activeTab = state.activeTab,
                    aboutOpen = state.showAboutDialog,
                    onLogoClick = { navigateToTab(AppTab.TODAY) },
                    onOpenSettings = {
                        if (state.activeTab == AppTab.SETTINGS) {
                            val fallback = if (tabBeforeSettings == AppTab.SETTINGS) AppTab.TODAY else tabBeforeSettings
                            viewModel.selectTab(fallback)
                        } else {
                            navigateToTab(AppTab.SETTINGS)
                        }
                    },
                    onOpenAbout = { viewModel.openAboutDialog() },
                    onTestAlarm = { viewModel.triggerInAppTestAlarm() }
                )
            },
            bottomBar = {
                if (state.activeTab != AppTab.SETTINGS) {
                    IronPulseBottomNav(
                        activeTab = state.activeTab,
                        restTimerFlow = viewModel.restTimerDisplayFlow,
                        onSelectTab = { navigateToTab(it) }
                    )
                }
            }
        ) { innerPadding ->
            // True edge-to-edge scrolling: lists receive innerPadding so cards slide seamlessly under translucent bars
            Box(modifier = Modifier.fillMaxSize()) {
                val noAnim = tokens.performance.noAnimations
                AnimatedContent(
                    targetState = state.activeTab,
                    transitionSpec = {
                        if (noAnim) {
                            EnterTransition.None togetherWith ExitTransition.None
                        } else {
                            val dir = if (targetState.ordinal >= initialState.ordinal) 1 else -1
                            (fadeIn(tween(180)) + slideInHorizontally(tween(210)) { fullW -> dir * (fullW / 14) })
                                .togetherWith(
                                    fadeOut(tween(140)) + slideOutHorizontally(tween(180)) { fullW -> -dir * (fullW / 16) }
                                )
                        }
                    },
                    label = "tabTransition",
                    modifier = Modifier.fillMaxSize()
                ) { tab ->
                    saveableStateHolder.SaveableStateProvider(key = tab) {
                        when (tab) {
                            AppTab.TODAY -> TodayScreen(
                                state = state,
                                listState = todayListState,
                                contentPadding = innerPadding,
                                clockSecondsFlow = viewModel.clockSecondsFlow,
                                restTimerFlow = viewModel.restTimerDisplayFlow,
                                mascotEyeFlow = viewModel.mascotEyeFlow,
                                onTapMascot = { viewModel.tapMascot() },
                                onReplayMascotVoice = { viewModel.replayMascotVoice() },
                                onStartRestPreset = { secs, exName ->
                                    viewModel.startManualRestTimer(secs, exName ?: "")
                                },
                                onToggleRestPauseOrStart = { viewModel.toggleRestPauseOrStart() },
                                onAdjustRest = { delta -> viewModel.adjustRestTimer(delta) },
                                onResetRest = { viewModel.resetRestTimer() },
                                onOpenWorkout = { exId -> viewModel.openWorkout(exId) },
                                onOpenSchedule = { navigateToTab(AppTab.SCHEDULE) },
                                onOpenExercisesForDay = { day -> viewModel.openExercisesForDay(day) }
                            )

                            AppTab.WORKOUT -> WorkoutScreen(
                                state = state,
                                viewModel = viewModel,
                                contentPadding = innerPadding,
                                onBackToToday = { viewModel.selectTab(AppTab.TODAY) },
                                onOpenSchedule = { navigateToTab(AppTab.SCHEDULE) },
                                onOpenExercisesForDay = { day -> viewModel.openExercisesForDay(day) }
                            )

                            AppTab.SCHEDULE -> ScheduleScreen(
                                state = state,
                                viewModel = viewModel,
                                contentPadding = innerPadding,
                                onOpenExercisesForDay = { day -> viewModel.openExercisesForDay(day) }
                            )

                            AppTab.HISTORY -> HistoryScreen(
                                state = state,
                                contentPadding = innerPadding,
                                onStartTodayWorkout = { viewModel.openWorkout(null) }
                            )

                            AppTab.EXERCISES -> ExercisesScreen(
                                state = state,
                                viewModel = viewModel,
                                contentPadding = innerPadding
                            )

                            AppTab.SETTINGS -> SettingsScreen(
                                state = state,
                                viewModel = viewModel,
                                contentPadding = innerPadding,
                                onBack = {
                                    val fallback = if (tabBeforeSettings == AppTab.SETTINGS) AppTab.TODAY else tabBeforeSettings
                                    viewModel.selectTab(fallback)
                                },
                                onRequestNotificationPermission = onRequestNotificationPermission,
                                onOpenExactAlarmSettings = onOpenExactAlarmSettings,
                                onPickCustomRingtone = onPickCustomRingtone
                            )
                        }
                    }
                }

                // Floating Offline & Sync Error Banners anchored cleanly below translucent TopBar
                if (state.isOffline || !state.syncError.isNullOrBlank()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.TopCenter)
                            .padding(top = innerPadding.calculateTopPadding() + 6.dp, start = 16.dp, end = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (state.isOffline) {
                            Surface(
                                color = Color(0xE61F180A),
                                border = BorderStroke(1.dp, Color(0x88F59E0B)),
                                shape = RoundedCornerShape(12.dp),
                                shadowElevation = 8.dp,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.CloudOff,
                                        contentDescription = null,
                                        tint = Color(0xFFFBBF24),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = lang.t(
                                            "Mode Offline — catatan disimpan lokal & akan tersinkronisasi saat online.",
                                            "Offline mode — logs save locally and sync once connected."
                                        ),
                                        fontSize = 11.5.sp,
                                        color = Color(0xFFFDE68A),
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }

                        val syncErr = state.syncError
                        if (!syncErr.isNullOrBlank()) {
                            Surface(
                                color = Color(0xE6220D0E),
                                border = BorderStroke(1.dp, Color(0x88EF4444)),
                                shape = RoundedCornerShape(12.dp),
                                shadowElevation = 8.dp,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(start = 12.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.Warning,
                                        contentDescription = null,
                                        tint = Color(0xFFFCA5A5),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = syncErr,
                                        fontSize = 11.5.sp,
                                        color = Color(0xFFFECACA),
                                        modifier = Modifier.weight(1f)
                                    )
                                    TextButton(
                                        onClick = { viewModel.retrySync() },
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Icon(Icons.Rounded.Refresh, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(lang.t("Coba Lagi", "Retry"), fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Draggable Floating Mascot Companion Orb
        FloatingMascotDock(
            mascot = state.mascot,
            eyeStateFlow = viewModel.mascotEyeFlow,
            anchorSideRight = state.appPrefs.floatingOrbSideRight,
            anchorYRatio = state.appPrefs.floatingOrbYRatio,
            visible = showFloatingMascot,
            onTapOrb = { viewModel.tapMascot() },
            onSaveAnchor = { sideRight, yRatio -> viewModel.setFloatingOrbAnchor(sideRight, yRatio) }
        )

        // Launch Intro Overlay (Swiss Poster Curtain)
        if (state.showLaunchIntro) {
            LaunchIntroOverlay(
                onDismiss = { viewModel.dismissLaunchIntro() }
            )
        }

        // Onboarding Name Prompt Modal
        if (!state.showLaunchIntro && state.showNamePrompt) {
            NamePromptModal(
                initialName = state.profile?.displayName ?: state.userDisplayName ?: "",
                mascot = state.mascot,
                onSaveName = { viewModel.confirmDisplayNameOnboarding(it) }
            )
        }

        // Interactive 5-Step Feature Tutorial Modal
        if (!state.showLaunchIntro && !state.showNamePrompt && state.tutorialOpen) {
            FeatureTutorialModal(
                startAtLanguageStep = state.tutorialStartWithLang,
                onSelectLanguage = { viewModel.setLang(it) },
                onComplete = { viewModel.closeTutorial() },
                onJumpToTab = { navigateToTab(it) }
            )
        }

        // 30-Second Anti-Misclick Cooldown Guard Modal
        val cooldownTarget = state.cooldownAlertTarget
        if (cooldownTarget != null) {
            CooldownAlertModal(
                cooldownSecondsFlow = viewModel.cooldownSecondsFlow,
                exerciseName = cooldownTarget.exerciseName,
                setNumber = cooldownTarget.setNumber,
                onBypass = { viewModel.bypassCooldownAndComplete() },
                onDismiss = { viewModel.dismissCooldownAlert() }
            )
        }

        // About IronPulse Modal
        if (state.showAboutDialog) {
            AboutDialog(onDismiss = { viewModel.closeAboutDialog() })
        }

        // Full-Screen In-App Test Alarm Overlay
        val testAlarm = state.activeTestAlarm
        if (testAlarm != null) {
            ActiveAlarmOverlay(
                alarm = testAlarm,
                snoozeMinutes = state.profile?.snoozeMinutes ?: 5,
                onStartWorkout = { viewModel.dismissInAppTestAlarm(openWorkoutAfter = true) },
                onSnooze = { viewModel.snoozeInAppTestAlarm() },
                onDismiss = { viewModel.dismissInAppTestAlarm(openWorkoutAfter = false) }
            )
        }
    }
}
