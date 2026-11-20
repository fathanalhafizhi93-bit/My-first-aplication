package com.fathan.ironpulse.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.DayTimePhase
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.model.UiTheme
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassBar
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.AppTab
import com.fathan.ironpulse.ui.viewmodel.RestTimerDisplayState
import kotlinx.coroutines.flow.StateFlow
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val clock24Sdf = object : ThreadLocal<SimpleDateFormat>() {
    override fun initialValue(): SimpleDateFormat = SimpleDateFormat("HH:mm", Locale.US)
}
private val clock12Sdf = object : ThreadLocal<SimpleDateFormat>() {
    override fun initialValue(): SimpleDateFormat = SimpleDateFormat("h:mm", Locale.US)
}
private val secSdf = object : ThreadLocal<SimpleDateFormat>() {
    override fun initialValue(): SimpleDateFormat = SimpleDateFormat("ss", Locale.US)
}

@Composable
fun AmbientPhaseBackdrop(modifier: Modifier = Modifier) {
    val tokens = LocalIronPulseTokens.current
    val suppressGlow = tokens.performance.noAmbientGlow ||
        tokens.uiTheme == UiTheme.CARBON_FORGE ||
        tokens.uiTheme == UiTheme.UBUNTU_YARU

    Box(
        modifier = modifier
            .fillMaxSize()
            .drawWithCache {
                val canvasColor = tokens.canvasBg
                val topGlow = when {
                    suppressGlow -> null
                    tokens.uiTheme == UiTheme.MATERIAL_YOU -> Brush.radialGradient(
                        colors = listOf(tokens.accentColor.copy(alpha = 0.08f), Color.Transparent),
                        center = Offset(size.width * 0.5f, 0f),
                        radius = size.width.coerceAtLeast(600f) * 0.95f
                    )
                    tokens.uiTheme == UiTheme.AEROGLASS -> Brush.radialGradient(
                        colors = listOf(Color(0x3638BDF8), Color.Transparent),
                        center = Offset(size.width * 0.85f, size.height * 0.08f),
                        radius = size.width.coerceAtLeast(500f) * 0.95f
                    )
                    else -> Brush.radialGradient(
                        colors = listOf(tokens.phaseTokens.glowPrimary, Color.Transparent),
                        center = Offset(size.width * 0.84f, size.height * 0.08f),
                        radius = size.width.coerceAtLeast(500f) * 0.9f
                    )
                }
                val bottomGlow = when {
                    suppressGlow || tokens.uiTheme == UiTheme.MATERIAL_YOU -> null
                    tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED -> Brush.radialGradient(
                        colors = listOf(tokens.accentColor.copy(alpha = 0.13f), Color.Transparent),
                        center = Offset(size.width * 0.14f, size.height * 0.78f),
                        radius = size.width.coerceAtLeast(450f) * 0.88f
                    )
                    tokens.uiTheme == UiTheme.AEROGLASS -> Brush.radialGradient(
                        colors = listOf(Color(0x220284C7), Color.Transparent),
                        center = Offset(size.width * 0.12f, size.height * 0.82f),
                        radius = size.width.coerceAtLeast(450f) * 0.85f
                    )
                    else -> Brush.radialGradient(
                        colors = listOf(tokens.phaseTokens.glowSecondary, Color.Transparent),
                        center = Offset(size.width * 0.12f, size.height * 0.82f),
                        radius = size.width.coerceAtLeast(450f) * 0.85f
                    )
                }
                onDrawBehind {
                    drawRect(canvasColor)
                    if (topGlow != null) drawRect(topGlow)
                    if (bottomGlow != null) drawRect(bottomGlow)
                }
            }
    )
}

@Composable
fun IronPulseTopBar(
    activeTab: AppTab,
    aboutOpen: Boolean,
    onLogoClick: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenAbout: () -> Unit,
    onTestAlarm: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val isMaterialYou = tokens.uiTheme == UiTheme.MATERIAL_YOU
    val isFrosted = tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED
    val isAero = tokens.uiTheme == UiTheme.AEROGLASS
    val iconShape = RoundedCornerShape(
        when {
            isFrosted || isMaterialYou -> 999.dp
            isAero || tokens.uiTheme == UiTheme.OBSIDIAN || tokens.uiTheme == UiTheme.UBUNTU_YARU -> 10.dp
            else -> 8.dp
        }
    )
    val headerBorder = when (tokens.uiTheme) {
        UiTheme.AEROGLASS -> Color(0x527DD3FC)
        UiTheme.MATERIAL_YOU -> tokens.palette.outlineVariant
        UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.18f)
        UiTheme.CARBON_FORGE, UiTheme.UBUNTU_YARU -> Color.White.copy(alpha = 0.11f)
        UiTheme.OBSIDIAN -> tokens.phaseTokens.headerBorder
    }

    val settingsActive = activeTab == AppTab.SETTINGS && !aboutOpen
    val metallicIronBrush = remember {
        Brush.verticalGradient(
            colors = listOf(Color(0xFFFFFFFF), Color(0xFFB5BDC9))
        )
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .ironGlassBar(tokens = tokens, bottomHairlineColor = headerBorder)
            .statusBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Dual-tone brand wordmark: Metallic gradient "Iron" + glowing accent "Pulse"
            Text(
                text = buildAnnotatedString {
                    withStyle(
                        SpanStyle(
                            brush = metallicIronBrush,
                            fontWeight = FontWeight.ExtraBold
                        )
                    ) {
                        append("Iron")
                    }
                    withStyle(
                        SpanStyle(
                            color = tokens.accentColor,
                            fontWeight = FontWeight.ExtraBold
                        )
                    ) {
                        append("Pulse")
                    }
                },
                fontSize = 23.sp,
                letterSpacing = (-0.6).sp,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .tactilePress(disabledByPerf = tokens.performance.noAnimations)
                    .clickable(onClick = onLogoClick)
                    .padding(vertical = 4.dp, horizontal = 2.dp)
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TopBarIconButton(
                    icon = Icons.Rounded.Settings,
                    contentDescription = lang.t("Buka pengaturan", "Open settings"),
                    active = settingsActive,
                    shape = iconShape,
                    onClick = onOpenSettings
                )
                TopBarIconButton(
                    icon = Icons.Rounded.Info,
                    contentDescription = lang.t("Tentang IronPulse", "About IronPulse"),
                    active = aboutOpen,
                    shape = iconShape,
                    onClick = onOpenAbout
                )

                val ctaShape = RoundedCornerShape(tokens.buttonRadius)
                Box(
                    modifier = Modifier
                        .height(38.dp)
                        .tactilePress(disabledByPerf = tokens.performance.noAnimations)
                        .clip(ctaShape)
                        .background(tokens.accentColor, ctaShape)
                        .then(
                            if (isAero) {
                                Modifier.background(
                                    Brush.verticalGradient(
                                        0.0f to Color.White.copy(alpha = 0.34f),
                                        0.48f to Color.White.copy(alpha = 0.08f),
                                        0.50f to Color.Transparent,
                                        1.0f to Color.Black.copy(alpha = 0.14f)
                                    ),
                                    ctaShape
                                )
                            } else Modifier
                        )
                        .clickable(onClick = onTestAlarm)
                        .padding(horizontal = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = lang.t("Tes Alarm", "Test Alarm"),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.onAccentColor,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

@Composable
private fun TopBarIconButton(
    icon: ImageVector,
    contentDescription: String,
    active: Boolean,
    shape: RoundedCornerShape,
    onClick: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val isMaterialYou = tokens.uiTheme == UiTheme.MATERIAL_YOU
    val isAero = tokens.uiTheme == UiTheme.AEROGLASS
    val isFrosted = tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED
    val containerColor = when {
        active && isMaterialYou -> tokens.palette.secondaryContainer
        active -> tokens.accentColor.copy(alpha = 0.18f)
        isMaterialYou -> tokens.palette.surfaceContainerHigh
        tokens.uiTheme == UiTheme.UBUNTU_YARU -> tokens.controlBg
        isFrosted -> Color.White.copy(alpha = 0.09f)
        isAero -> Color(0x2838BDF8)
        else -> tokens.controlBg
    }
    val borderColor = when {
        active && isMaterialYou -> tokens.palette.secondaryContainer
        active -> tokens.accentColor.copy(alpha = 0.65f)
        isMaterialYou -> tokens.palette.outlineVariant
        isAero -> Color(0x52BAE6FD)
        isFrosted -> Color.White.copy(alpha = 0.18f)
        else -> Color.White.copy(alpha = 0.14f)
    }
    val tint = when {
        active && isMaterialYou -> tokens.palette.onSecondaryContainer
        active -> tokens.accentColor
        else -> tokens.palette.onSurfaceVariant
    }

    Surface(
        onClick = onClick,
        shape = shape,
        color = containerColor,
        border = BorderStroke(1.dp, borderColor),
        modifier = Modifier
            .size(38.dp)
            .tactilePress(disabledByPerf = tokens.performance.noAnimations)
    ) {
        Box(
            modifier = if (isAero) {
                Modifier.background(
                    Brush.verticalGradient(
                        0.0f to Color.White.copy(alpha = 0.22f),
                        0.5f to Color.Transparent
                    )
                )
            } else {
                Modifier
            },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = tint,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
fun IronPulseBottomNav(
    activeTab: AppTab,
    restTimerFlow: StateFlow<RestTimerDisplayState>,
    onSelectTab: (AppTab) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val restTimer by restTimerFlow.collectAsStateWithLifecycle()
    val lang = tokens.lang
    val isFrosted = tokens.uiTheme == UiTheme.MIDNIGHT_FROSTED
    val isMaterialYou = tokens.uiTheme == UiTheme.MATERIAL_YOU
    val isAero = tokens.uiTheme == UiTheme.AEROGLASS
    val isCarbon = tokens.uiTheme == UiTheme.CARBON_FORGE

    val items = remember(lang) {
        listOf(
            Triple(AppTab.TODAY, lang.t("Hari Ini", "Today"), Icons.Rounded.PlayCircle),
            Triple(AppTab.SCHEDULE, lang.t("Jadwal", "Schedule"), Icons.Rounded.CalendarMonth),
            Triple(AppTab.HISTORY, lang.t("Riwayat", "History"), Icons.Rounded.History),
            Triple(AppTab.EXERCISES, lang.t("Gerakan", "Exercises"), Icons.Rounded.FitnessCenter)
        )
    }

    val activeIdx = when (activeTab) {
        AppTab.TODAY, AppTab.WORKOUT -> 0
        AppTab.SCHEDULE -> 1
        AppTab.HISTORY -> 2
        AppTab.EXERCISES -> 3
        AppTab.SETTINGS -> -1
    }

    val outerPadding = if (isFrosted) {
        Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(start = 14.dp, end = 14.dp, bottom = 10.dp)
    } else {
        Modifier.fillMaxWidth()
    }

    val topBorder = when (tokens.uiTheme) {
        UiTheme.AEROGLASS -> Color(0x59BAE6FD)
        UiTheme.MATERIAL_YOU -> tokens.palette.outlineVariant
        UiTheme.CARBON_FORGE, UiTheme.UBUNTU_YARU -> Color.White.copy(alpha = 0.12f)
        UiTheme.OBSIDIAN -> tokens.phaseTokens.headerBorder
        UiTheme.MIDNIGHT_FROSTED -> Color.White.copy(alpha = 0.24f)
    }

    val dockModifier = if (isFrosted) {
        Modifier
            .fillMaxWidth()
            .ironGlassBar(tokens, shapeRadius = 28.dp)
            .border(1.dp, topBorder, RoundedCornerShape(28.dp))
    } else {
        Modifier
            .fillMaxWidth()
            .ironGlassBar(tokens, topHairlineColor = topBorder)
            .navigationBarsPadding()
    }

    Box(modifier = outerPadding) {
        BoxWithConstraints(
            modifier = dockModifier
                .height(if (isFrosted) 62.dp else 64.dp)
                .padding(horizontal = if (isFrosted || isAero) 6.dp else 4.dp)
        ) {
            val slotWidth = maxWidth / items.size

            // Gliding GPU spring indicator behind active tab
            if (activeIdx >= 0) {
                val indicatorOffset by animateDpAsState(
                    targetValue = slotWidth * activeIdx,
                    animationSpec = if (tokens.performance.noAnimations) {
                        tween(0)
                    } else {
                        IronPulseMotion.IndicatorDpSpring
                    },
                    label = "navIndicatorOffset"
                )

                Box(
                    modifier = Modifier
                        .offset(x = indicatorOffset)
                        .width(slotWidth)
                        .fillMaxHeight()
                        .padding(vertical = if (isFrosted || isAero) 5.dp else 0.dp, horizontal = 3.dp),
                    contentAlignment = Alignment.TopCenter
                ) {
                    when {
                        isFrosted -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(22.dp))
                                    .background(Color.White.copy(alpha = 0.14f))
                                    .border(1.dp, Color.White.copy(alpha = 0.24f), RoundedCornerShape(22.dp))
                            )
                        }
                        isAero -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0x2E38BDF8))
                                    .background(
                                        Brush.verticalGradient(
                                            0.0f to Color.White.copy(alpha = 0.24f),
                                            0.48f to Color.White.copy(alpha = 0.05f),
                                            0.5f to Color.Transparent,
                                            1.0f to Color(0xFF0EA5E9).copy(alpha = 0.14f)
                                        )
                                    )
                                    .border(1.dp, Color(0x5EB8E6FE), RoundedCornerShape(12.dp))
                            )
                        }
                        isMaterialYou -> {
                            Box(
                                modifier = Modifier
                                    .padding(top = 7.dp)
                                    .width(58.dp)
                                    .height(30.dp)
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(tokens.palette.secondaryContainer)
                            )
                        }
                        else -> {
                            Box(
                                modifier = Modifier
                                    .width(if (isCarbon) 40.dp else 34.dp)
                                    .height(2.5.dp)
                                    .background(
                                        tokens.accentColor,
                                        if (isCarbon) RoundedCornerShape(0.dp) else RoundedCornerShape(999.dp)
                                    )
                            )
                        }
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEachIndexed { idx, (tab, label, icon) ->
                    val isActive = idx == activeIdx
                    val showCompactRest = tab == AppTab.TODAY && restTimer.isActive && activeTab != AppTab.WORKOUT

                    val itemContentColor = when {
                        isActive && isMaterialYou -> tokens.palette.onSurface
                        isActive -> tokens.accentColor
                        else -> tokens.mutedTextColor
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .tactilePress(pressedScale = 0.94f, disabledByPerf = tokens.performance.noAnimations)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { onSelectTab(tab) },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(58.dp)
                                    .height(30.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = label,
                                    tint = if (isActive && isMaterialYou) {
                                        tokens.palette.onSecondaryContainer
                                    } else {
                                        itemContentColor
                                    },
                                    modifier = Modifier.size(21.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (showCompactRest) {
                                    GymModelHelpers.formatRestDuration(restTimer.remainingSeconds)
                                } else {
                                    label
                                },
                                fontSize = 11.sp,
                                fontFamily = if (showCompactRest) FontFamily.Monospace else FontFamily.SansSerif,
                                fontWeight = if (showCompactRest || isActive) FontWeight.Bold else FontWeight.Medium,
                                color = if (showCompactRest) tokens.accentColor else itemContentColor,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PhaseLogoEmblem(
    timePhase: DayTimePhase,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val accent = tokens.phaseTokens.accentBright
    val cornerRadius = when (tokens.uiTheme) {
        UiTheme.MATERIAL_YOU, UiTheme.MIDNIGHT_FROSTED -> 18.dp
        UiTheme.CARBON_FORGE -> 10.dp
        else -> 14.dp
    }

    Box(
        modifier = modifier
            .size(54.dp)
            .ironGlassSurface(
                tokens = tokens,
                subtle = true,
                borderOverride = accent.copy(alpha = 0.45f),
                radiusOverride = cornerRadius
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(30.dp)) {
            val w = size.width
            val h = size.height
            when (timePhase) {
                DayTimePhase.MORNING -> {
                    val cx = w * 0.5f
                    val cy = h * 0.62f
                    drawCircle(
                        color = accent,
                        radius = w * 0.22f,
                        center = Offset(cx, cy),
                        style = Stroke(width = 2.4.dp.toPx())
                    )
                    drawLine(
                        color = accent,
                        start = Offset(w * 0.14f, cy + h * 0.18f),
                        end = Offset(w * 0.86f, cy + h * 0.18f),
                        strokeWidth = 2.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                    listOf(
                        Offset(cx, h * 0.14f) to Offset(cx, h * 0.28f),
                        Offset(w * 0.22f, h * 0.28f) to Offset(w * 0.31f, h * 0.37f),
                        Offset(w * 0.78f, h * 0.28f) to Offset(w * 0.69f, h * 0.37f)
                    ).forEach { (s, e) ->
                        drawLine(accent, s, e, strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
                    }
                }
                DayTimePhase.AFTERNOON -> {
                    val cx = w * 0.5f
                    val cy = h * 0.5f
                    drawCircle(
                        color = accent,
                        radius = w * 0.21f,
                        center = Offset(cx, cy),
                        style = Stroke(width = 2.4.dp.toPx())
                    )
                    for (i in 0 until 8) {
                        val angle = Math.toRadians((i * 45).toDouble())
                        val r1 = w * 0.31f
                        val r2 = w * 0.43f
                        drawLine(
                            color = accent,
                            start = Offset(
                                (cx + r1 * kotlin.math.cos(angle)).toFloat(),
                                (cy + r1 * kotlin.math.sin(angle)).toFloat()
                            ),
                            end = Offset(
                                (cx + r2 * kotlin.math.cos(angle)).toFloat(),
                                (cy + r2 * kotlin.math.sin(angle)).toFloat()
                            ),
                            strokeWidth = 2.dp.toPx(),
                            cap = StrokeCap.Round
                        )
                    }
                }
                DayTimePhase.NIGHT -> {
                    val p = Path().apply {
                        moveTo(w * 0.62f, h * 0.18f)
                        cubicTo(w * 0.35f, h * 0.20f, w * 0.24f, h * 0.52f, w * 0.40f, h * 0.74f)
                        cubicTo(w * 0.52f, h * 0.88f, w * 0.74f, h * 0.82f, w * 0.82f, h * 0.68f)
                        cubicTo(w * 0.60f, h * 0.74f, w * 0.44f, h * 0.56f, w * 0.48f, h * 0.36f)
                        cubicTo(w * 0.50f, h * 0.27f, w * 0.56f, h * 0.22f, w * 0.62f, h * 0.18f)
                        close()
                    }
                    drawPath(p, color = accent)
                    drawCircle(accent, radius = 2.dp.toPx(), center = Offset(w * 0.74f, h * 0.28f))
                }
            }
        }
    }
}

/**
 * Isolated per-digit fluid clock that collects [clockSecondsFlow] directly so parent screens
 * do NOT recompose every second, matching JS FluidClockDisplay's per-digit vertical pop.
 */
@Composable
fun LiveFluidClockSlot(
    clockSecondsFlow: StateFlow<Long>,
    clockFormat: ClockFormat,
    lang: AppLanguage
) {
    val clockSeconds by clockSecondsFlow.collectAsStateWithLifecycle()
    val tokens = LocalIronPulseTokens.current
    val noAnim = tokens.performance.noAnimations

    val date = remember(clockSeconds) { Date(clockSeconds * 1000L) }
    val hhmm = remember(clockSeconds, clockFormat) {
        val sdf = if (clockFormat == ClockFormat.H12) {
            clock12Sdf.get() ?: SimpleDateFormat("h:mm", Locale.US)
        } else {
            clock24Sdf.get() ?: SimpleDateFormat("HH:mm", Locale.US)
        }
        sdf.format(date)
    }
    val ss = remember(clockSeconds) {
        (secSdf.get() ?: SimpleDateFormat("ss", Locale.US)).format(date)
    }
    val minuteBucket = clockSeconds / 60L
    val periodLabel = remember(minuteBucket, clockFormat, lang) {
        if (clockFormat == ClockFormat.H24) {
            ""
        } else {
            val cal = Calendar.getInstance().apply { timeInMillis = clockSeconds * 1000L }
            val h = cal.get(Calendar.HOUR_OF_DAY)
            if (lang == AppLanguage.ID) {
                when {
                    h < 5 -> "Dini hari"
                    h < 11 -> "Pagi"
                    h < 15 -> "Siang"
                    h < 19 -> "Sore"
                    else -> "Malam"
                }
            } else {
                if (h >= 12) "PM" else "AM"
            }
        }
    }

    Row(verticalAlignment = Alignment.Bottom) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            for (idx in hhmm.indices) {
                val ch = hhmm[idx]
                if (ch == ':') {
                    Text(
                        text = ":",
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 38.sp,
                        lineHeight = 42.sp,
                        color = Color(0xFFF8FAFC).copy(alpha = 0.72f),
                        modifier = Modifier.padding(bottom = 2.dp)
                    )
                } else {
                    ClockDigitCell(
                        digit = ch,
                        noAnimations = noAnim,
                        style = TextStyle(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 40.sp,
                            lineHeight = 42.sp,
                            color = Color(0xFFF8FAFC)
                        )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.width(6.dp))

        Column(modifier = Modifier.padding(bottom = 5.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = ":",
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = tokens.phaseTokens.accentBright
                )
                for (idx in ss.indices) {
                    ClockDigitCell(
                        digit = ss[idx],
                        noAnimations = noAnim,
                        style = TextStyle(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = tokens.phaseTokens.accentBright
                        )
                    )
                }
            }
            if (periodLabel.isNotEmpty()) {
                Text(
                    text = periodLabel,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.mutedTextColor
                )
            }
        }
    }
}

@Composable
private fun ClockDigitCell(
    digit: Char,
    noAnimations: Boolean,
    style: TextStyle
) {
    AnimatedContent(
        targetState = digit,
        transitionSpec = {
            if (noAnimations) {
                EnterTransition.None togetherWith ExitTransition.None
            } else {
                (slideInVertically(tween(170)) { -it / 2 } + fadeIn(tween(150))) togetherWith
                    (slideOutVertically(tween(130)) { it / 2 } + fadeOut(tween(120)))
            }
        },
        label = "clockDigitCell"
    ) { ch ->
        Text(text = ch.toString(), style = style)
    }
}

@Composable
fun TactileStepperControl(
    valueText: String,
    label: String? = null,
    onDecrement: () -> Unit,
    onIncrement: () -> Unit,
    onDirectEdit: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    var editing by remember { mutableStateOf(false) }
    var draft by remember(valueText) { mutableStateOf(valueText) }

    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        if (!label.isNullOrBlank()) {
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = tokens.mutedTextColor,
                modifier = Modifier.padding(bottom = 4.dp)
            )
        }
        Row(
            modifier = Modifier
                .height(44.dp)
                .clip(RoundedCornerShape(tokens.inputRadius))
                .background(tokens.wellBg, RoundedCornerShape(tokens.inputRadius))
                .border(1.dp, tokens.subtleBorderColor, RoundedCornerShape(tokens.inputRadius))
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .tactilePress(pressedScale = 0.88f, disabledByPerf = tokens.performance.noAnimations)
                    .clip(RoundedCornerShape(8.dp))
                    .background(tokens.controlBg)
                    .clickable(onClick = onDecrement),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Rounded.Remove,
                    contentDescription = "-",
                    tint = tokens.palette.onSurface,
                    modifier = Modifier.size(16.dp)
                )
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clickable(enabled = onDirectEdit != null) {
                        draft = valueText
                        editing = true
                    },
                contentAlignment = Alignment.Center
            ) {
                if (editing && onDirectEdit != null) {
                    BasicTextField(
                        value = draft,
                        onValueChange = { next ->
                            draft = next
                            onDirectEdit(next)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        textStyle = TextStyle(
                            color = tokens.accentColor,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center
                        ),
                        cursorBrush = SolidColor(tokens.accentColor),
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Text(
                        text = valueText,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = tokens.palette.onSurface,
                        maxLines = 1
                    )
                }
            }

            Box(
                modifier = Modifier
                    .size(36.dp)
                    .tactilePress(pressedScale = 0.88f, disabledByPerf = tokens.performance.noAnimations)
                    .clip(RoundedCornerShape(8.dp))
                    .background(tokens.controlBg)
                    .clickable(onClick = onIncrement),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Rounded.Add,
                    contentDescription = "+",
                    tint = tokens.accentColor,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun ConfirmDeleteDialog(
    title: String,
    message: String,
    confirmLabel: String,
    cancelLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = tokens.palette.surfaceContainerHigh,
        titleContentColor = tokens.palette.onSurface,
        textContentColor = tokens.palette.onSurfaceVariant,
        icon = {
            Icon(
                imageVector = Icons.Rounded.Warning,
                contentDescription = null,
                tint = Color(0xFFF87171)
            )
        },
        title = {
            Text(text = title, fontWeight = FontWeight.Bold)
        },
        text = {
            Text(text = message, style = MaterialTheme.typography.bodyMedium)
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                shape = RoundedCornerShape(tokens.buttonRadius),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFDC2626),
                    contentColor = Color.White
                ),
                modifier = Modifier.tactilePress(disabledByPerf = tokens.performance.noAnimations)
            ) {
                Text(confirmLabel, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onDismiss,
                shape = RoundedCornerShape(tokens.buttonRadius),
                border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                modifier = Modifier.tactilePress(disabledByPerf = tokens.performance.noAnimations)
            ) {
                Text(cancelLabel, color = tokens.palette.onSurface)
            }
        }
    )
}
