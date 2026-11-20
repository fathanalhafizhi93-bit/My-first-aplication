package com.fathan.ironpulse.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fathan.ironpulse.model.DayTimePhase
import com.fathan.ironpulse.model.MascotMood
import com.fathan.ironpulse.model.TimePhasePose
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.MaterialYouColorEngine
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.MascotEyeState
import com.fathan.ironpulse.ui.viewmodel.MascotUiState
import kotlinx.coroutines.flow.StateFlow

@Composable
fun MascotOrbFace(
    mascot: MascotUiState,
    eyeStateFlow: StateFlow<MascotEyeState>? = null,
    size: Dp = 64.dp,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val staticMode = tokens.performance.staticMascot || tokens.performance.noAnimations
    val eyeState = if (eyeStateFlow != null) {
        eyeStateFlow.collectAsStateWithLifecycle().value
    } else {
        MascotEyeState()
    }
    val phaseColor = remember(mascot.phaseColorHex) {
        MaterialYouColorEngine.parseColor(mascot.phaseColorHex, Color(0xFFFBBF24))
    }

    val urgent = mascot.urgentMood
    val pose = mascot.activeTimePose
    val isCelebration = urgent == MascotMood.CLAP || urgent == MascotMood.CELEBRATE || urgent == MascotMood.MILESTONE
    val isCalmEyes = urgent == MascotMood.REST
    val isFocusedEyes = urgent == MascotMood.TIMER_ACTIVE

    val isSleepPose = urgent == null && pose == TimePhasePose.SLEEP
    val isYawnPose = urgent == null && pose == TimePhasePose.YAWN
    val isTeaPose = urgent == null && pose == TimePhasePose.TEA
    val isCoffeePose = urgent == null && pose == TimePhasePose.COFFEE
    val isStretchPose = urgent == null && pose == TimePhasePose.STRETCH
    val isPerkPose = urgent == null && pose == TimePhasePose.PERK
    val isWinkPose = urgent == null && pose == TimePhasePose.WINK
    val isSunrisePose = urgent == null && pose == TimePhasePose.SUNRISE
    val isProteinPose = urgent == null && pose == TimePhasePose.PROTEIN
    val isSalutePose = urgent == null && pose == TimePhasePose.SALUTE
    val isSparklePose = urgent == null && pose == TimePhasePose.SPARKLE

    val isHydratePose = urgent == null && pose == TimePhasePose.HYDRATE
    val isShadesPose = urgent == null && pose == TimePhasePose.SHADES
    val isFlexPose = urgent == null && pose == TimePhasePose.FLEX
    val isMusicPose = urgent == null && pose == TimePhasePose.MUSIC
    val isCuriousPose = urgent == null && pose == TimePhasePose.CURIOUS
    val isBeastPose = urgent == null && pose == TimePhasePose.BEAST
    val isSweatPose = urgent == null && pose == TimePhasePose.SWEAT
    val isSmirkPose = urgent == null && pose == TimePhasePose.SMIRK
    val isWhistlePose = urgent == null && pose == TimePhasePose.WHISTLE

    val isNightChillPose = urgent == null && pose == TimePhasePose.NIGHT_CHILL
    val isStargazePose = urgent == null && pose == TimePhasePose.STARGAZE
    val isZenPose = urgent == null && pose == TimePhasePose.ZEN
    val isCozyPose = urgent == null && pose == TimePhasePose.COZY
    val isDreamPose = urgent == null && pose == TimePhasePose.DREAM
    val isMoonlitPose = urgent == null && pose == TimePhasePose.MOONLIT
    val isRechargePose = urgent == null && pose == TimePhasePose.RECHARGE

    val isClosedCalmPose = isSleepPose || isZenPose || isCozyPose || isDreamPose
    val density = LocalDensity.current

    val ringScale = if (staticMode) {
        1f
    } else {
        val infinite = rememberInfiniteTransition(label = "orbAnim")
        val animRing by infinite.animateFloat(
            initialValue = 0.96f,
            targetValue = if (isCelebration || eyeState.tapBounce) 1.24f else 1.14f,
            animationSpec = infiniteRepeatable(
                animation = tween(if (isCelebration) 1100 else 2200, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "ringScale"
        )
        animRing
    }
    val bobOffsetDp = if (staticMode) {
        0f
    } else {
        val infinite = rememberInfiniteTransition(label = "orbBob")
        val animBob by infinite.animateFloat(
            initialValue = -2f,
            targetValue = 2f,
            animationSpec = infiniteRepeatable(
                animation = tween(if (isMusicPose || isWhistlePose || isProteinPose) 1400 else 2300, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "bobOffset"
        )
        animBob
    }
    val bobOffsetPx = with(density) { bobOffsetDp.dp.toPx() }
    val tapScale by animateFloatAsState(
        targetValue = if (!staticMode && eyeState.tapBounce) 1.14f else 1f,
        animationSpec = IronPulseMotion.OrbSnapSpring,
        label = "tapScale"
    )

    val glanceX by animateFloatAsState(
        targetValue = if (staticMode || isClosedCalmPose || isMusicPose || isSparklePose) 0f else eyeState.glanceX,
        animationSpec = tween(260),
        label = "glanceX"
    )
    val glanceY by animateFloatAsState(
        targetValue = if (staticMode || isClosedCalmPose || isMusicPose || isSparklePose) 0f else eyeState.glanceY,
        animationSpec = tween(260),
        label = "glanceY"
    )

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        // Outer breathing pulse ring (GPU graphicsLayer)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    scaleX = ringScale
                    scaleY = ringScale
                }
                .border(2.dp, phaseColor.copy(alpha = if (staticMode) 0.45f else 0.55f), CircleShape)
        )

        // Core dark circular orb (GPU graphicsLayer)
        Box(
            modifier = Modifier
                .size(size * 0.875f)
                .graphicsLayer {
                    translationY = bobOffsetPx
                    scaleX = tapScale
                    scaleY = tapScale
                }
                .clip(CircleShape)
                .background(Color(0xF2121620))
                .border(2.dp, phaseColor, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.size(size * 0.72f)) {
                val u = this.size.width / 64f
                fun px(v: Float) = v * u
                fun pt(x: Float, y: Float) = Offset(px(x), px(y))

                // Headphones for Music pose
                if (isMusicPose) {
                    val arcPath = Path().apply {
                        moveTo(px(11f), px(31f))
                        cubicTo(px(11f), px(18.5f), px(20.5f), px(10.5f), px(32f), px(10.5f))
                        cubicTo(px(43.5f), px(10.5f), px(53f), px(18.5f), px(53f), px(31f))
                    }
                    drawPath(arcPath, phaseColor, style = Stroke(px(2.6f), cap = StrokeCap.Round))
                    drawRoundRect(phaseColor, pt(7.5f, 26.5f), Size(px(5.5f), px(11f)), CornerRadius(px(2.7f)))
                    drawRoundRect(phaseColor, pt(51f, 26.5f), Size(px(5.5f), px(11f)), CornerRadius(px(2.7f)))
                }

                // Cozy Blanket
                if (isCozyPose) {
                    val blanket = Path().apply {
                        moveTo(px(13f), px(47.5f))
                        cubicTo(px(20f), px(53f), px(44f), px(53f), px(51f), px(47.5f))
                    }
                    drawPath(blanket, phaseColor.copy(alpha = 0.85f), style = Stroke(px(4.5f), cap = StrokeCap.Round))
                }

                // Eyebrows
                when {
                    isBeastPose -> {
                        drawLine(phaseColor, pt(16.5f, 20f), pt(26.2f, 24.4f), px(2.7f), cap = StrokeCap.Round)
                        drawLine(phaseColor, pt(47.5f, 20f), pt(37.8f, 24.4f), px(2.7f), cap = StrokeCap.Round)
                    }
                    isFocusedEyes || isFlexPose || isSalutePose -> {
                        drawLine(Color(0xFFD1D5DB), pt(17.5f, 21.5f), pt(25.5f, 23.8f), px(2.3f), cap = StrokeCap.Round)
                        drawLine(Color(0xFFD1D5DB), pt(46.5f, 21.5f), pt(38.5f, 23.8f), px(2.3f), cap = StrokeCap.Round)
                    }
                    isSmirkPose -> {
                        drawLine(Color(0xFFD1D5DB), pt(17.5f, 22.8f), pt(25.5f, 22.8f), px(2.1f), cap = StrokeCap.Round)
                        val brow = Path().apply {
                            moveTo(px(38.5f), px(20.6f))
                            cubicTo(px(41f), px(18.2f), px(44.5f), px(18.4f), px(46.8f), px(20.8f))
                        }
                        drawPath(brow, Color(0xFFD1D5DB), style = Stroke(px(2.2f), cap = StrokeCap.Round))
                    }
                    isCuriousPose -> {
                        val b1 = Path().apply {
                            moveTo(px(18f), px(22.5f))
                            cubicTo(px(20f), px(20.5f), px(23f), px(20.5f), px(25f), px(22.5f))
                        }
                        val b2 = Path().apply {
                            moveTo(px(39f), px(20f))
                            cubicTo(px(41f), px(17.8f), px(44f), px(17.8f), px(46f), px(20f))
                        }
                        drawPath(b1, Color(0xFFD1D5DB), style = Stroke(px(2f), cap = StrokeCap.Round))
                        drawPath(b2, Color(0xFFD1D5DB), style = Stroke(px(2.1f), cap = StrokeCap.Round))
                    }
                    isWinkPose || isWhistlePose -> {
                        val b1 = Path().apply {
                            moveTo(px(18f), px(21.5f))
                            cubicTo(px(20f), px(19.6f), px(23.5f), px(19.6f), px(25.5f), px(21.5f))
                        }
                        val b2 = Path().apply {
                            moveTo(px(39f), px(22.8f))
                            cubicTo(px(41f), px(21.5f), px(44f), px(21.5f), px(46f), px(22.8f))
                        }
                        drawPath(b1, Color(0xFFD1D5DB), style = Stroke(px(2f), cap = StrokeCap.Round))
                        drawPath(b2, Color(0xFFD1D5DB), style = Stroke(px(2f), cap = StrokeCap.Round))
                    }
                    isYawnPose || isSweatPose -> {
                        val b1 = Path().apply {
                            moveTo(px(18f), px(22f))
                            cubicTo(px(20f), px(20.5f), px(23.5f), px(21f), px(25f), px(22.5f))
                        }
                        val b2 = Path().apply {
                            moveTo(px(39f), px(22.5f))
                            cubicTo(px(40.5f), px(21f), px(44f), px(20.5f), px(46f), px(22f))
                        }
                        drawPath(b1, Color(0xFF9CA3AF), style = Stroke(px(1.9f), cap = StrokeCap.Round))
                        drawPath(b2, Color(0xFF9CA3AF), style = Stroke(px(1.9f), cap = StrokeCap.Round))
                    }
                }

                // Eyes (with glance offset)
                val gx = px(glanceX)
                val gy = px(glanceY)
                fun gpt(x: Float, y: Float) = Offset(px(x) + gx, px(y) + gy)

                when {
                    isCelebration || isMusicPose || isSunrisePose || isSweatPose -> {
                        val lEye = Path().apply {
                            moveTo(px(18f) + gx, px(28f) + gy)
                            cubicTo(px(19.8f) + gx, px(24.4f) + gy, px(24.2f) + gx, px(24.4f) + gy, px(26f) + gx, px(28f) + gy)
                        }
                        val rEye = Path().apply {
                            moveTo(px(38f) + gx, px(28f) + gy)
                            cubicTo(px(39.8f) + gx, px(24.4f) + gy, px(44.2f) + gx, px(24.4f) + gy, px(46f) + gx, px(28f) + gy)
                        }
                        drawPath(lEye, Color(0xFFF4F5F7), style = Stroke(px(2.8f), cap = StrokeCap.Round))
                        drawPath(rEye, Color(0xFFF4F5F7), style = Stroke(px(2.8f), cap = StrokeCap.Round))
                    }
                    isSparklePose -> {
                        listOf(22f, 42f).forEach { cx ->
                            val star = Path().apply {
                                moveTo(px(cx), px(23.2f))
                                lineTo(px(cx + 1.3f), px(26.2f))
                                lineTo(px(cx + 4.3f), px(27.5f))
                                lineTo(px(cx + 1.3f), px(28.8f))
                                lineTo(px(cx), px(31.8f))
                                lineTo(px(cx - 1.3f), px(28.8f))
                                lineTo(px(cx - 4.3f), px(27.5f))
                                lineTo(px(cx - 1.3f), px(26.2f))
                                close()
                            }
                            drawPath(star, Color(0xFFF4F5F7))
                            drawCircle(phaseColor, px(1.1f), pt(cx, 27.5f))
                        }
                    }
                    isBeastPose -> {
                        drawLine(Color(0xFFF4F5F7), gpt(18f, 26.5f), gpt(25.5f, 29f), px(2.4f), cap = StrokeCap.Round)
                        drawCircle(phaseColor, px(2.5f), gpt(22.5f, 28.2f))
                        drawLine(Color(0xFFF4F5F7), gpt(46f, 26.5f), gpt(38.5f, 29f), px(2.4f), cap = StrokeCap.Round)
                        drawCircle(phaseColor, px(2.5f), gpt(41.5f, 28.2f))
                    }
                    isSmirkPose -> {
                        drawLine(Color(0xFFF4F5F7), gpt(17.5f, 27.5f), gpt(26f, 27.5f), px(2.5f), cap = StrokeCap.Round)
                        drawCircle(Color(0xFFF4F5F7), px(1.9f), gpt(22f, 28.6f))
                        drawCircle(Color(0xFFF4F5F7), px(3.1f), gpt(42f, 27.2f))
                        drawCircle(phaseColor, px(1.0f), gpt(41f, 26.2f))
                    }
                    isWinkPose || isWhistlePose -> {
                        drawCircle(Color(0xFFF4F5F7), px(3.2f), gpt(22f, 27.5f))
                        drawCircle(phaseColor, px(1.05f), gpt(21f, 26.3f))
                        val winkEye = Path().apply {
                            moveTo(px(38f) + gx, px(27.6f) + gy)
                            cubicTo(px(40f) + gx, px(24.8f) + gy, px(44f) + gx, px(24.8f) + gy, px(46f) + gx, px(27.6f) + gy)
                        }
                        drawPath(winkEye, Color(0xFFF4F5F7), style = Stroke(px(2.7f), cap = StrokeCap.Round))
                    }
                    isShadesPose -> {
                        drawRoundRect(Color(0xFF0B0E14), gpt(14.5f, 23f), Size(px(14.5f), px(9.2f)), CornerRadius(px(3f)))
                        drawRoundRect(phaseColor, gpt(14.5f, 23f), Size(px(14.5f), px(9.2f)), CornerRadius(px(3f)), style = Stroke(px(2f)))
                        drawRoundRect(Color(0xFF0B0E14), gpt(35f, 23f), Size(px(14.5f), px(9.2f)), CornerRadius(px(3f)))
                        drawRoundRect(phaseColor, gpt(35f, 23f), Size(px(14.5f), px(9.2f)), CornerRadius(px(3f)), style = Stroke(px(2f)))
                        drawLine(phaseColor, gpt(29f, 26.5f), gpt(35f, 26.5f), px(2f), cap = StrokeCap.Round)
                        drawLine(Color.White.copy(alpha = 0.45f), gpt(17.5f, 25.5f), gpt(21f, 29.2f), px(1.5f), cap = StrokeCap.Round)
                        drawLine(Color.White.copy(alpha = 0.45f), gpt(38f, 25.5f), gpt(41.5f, 29.2f), px(1.5f), cap = StrokeCap.Round)
                    }
                    isSleepPose || isZenPose || isCozyPose || isDreamPose -> {
                        val lClosed = Path().apply {
                            moveTo(px(17.5f) + gx, px(28.2f) + gy)
                            cubicTo(px(19.8f) + gx, px(31.2f) + gy, px(24.2f) + gx, px(31.2f) + gy, px(26.5f) + gx, px(28.2f) + gy)
                        }
                        val rClosed = Path().apply {
                            moveTo(px(37.5f) + gx, px(28.2f) + gy)
                            cubicTo(px(39.8f) + gx, px(31.2f) + gy, px(44.2f) + gx, px(31.2f) + gy, px(46.5f) + gx, px(28.2f) + gy)
                        }
                        drawPath(lClosed, Color(0xFFD1D5DB), style = Stroke(px(2.6f), cap = StrokeCap.Round))
                        drawPath(rClosed, Color(0xFFD1D5DB), style = Stroke(px(2.6f), cap = StrokeCap.Round))
                    }
                    isYawnPose -> {
                        drawLine(Color(0xFFD1D5DB), gpt(17.5f, 27.8f), gpt(26.5f, 27.8f), px(2.5f), cap = StrokeCap.Round)
                        drawCircle(Color(0xFFF4F5F7), px(1.8f), gpt(22f, 29.4f))
                        val rYawn = Path().apply {
                            moveTo(px(38f) + gx, px(28.4f) + gy)
                            cubicTo(px(40f) + gx, px(30.8f) + gy, px(44f) + gx, px(30.8f) + gy, px(46f) + gx, px(28.4f) + gy)
                        }
                        drawPath(rYawn, Color(0xFFD1D5DB), style = Stroke(px(2.5f), cap = StrokeCap.Round))
                    }
                    isTeaPose -> {
                        val lTea = Path().apply {
                            moveTo(px(18f) + gx, px(28.2f) + gy)
                            cubicTo(px(19.8f) + gx, px(25.2f) + gy, px(24.2f) + gx, px(25.2f) + gy, px(26f) + gx, px(28.2f) + gy)
                        }
                        val rTea = Path().apply {
                            moveTo(px(38f) + gx, px(28.2f) + gy)
                            cubicTo(px(39.8f) + gx, px(25.2f) + gy, px(44.2f) + gx, px(25.2f) + gy, px(46f) + gx, px(28.2f) + gy)
                        }
                        drawPath(lTea, Color(0xFFF4F5F7), style = Stroke(px(2.6f), cap = StrokeCap.Round))
                        drawPath(rTea, Color(0xFFF4F5F7), style = Stroke(px(2.6f), cap = StrokeCap.Round))
                    }
                    isStargazePose || isMoonlitPose -> {
                        drawCircle(Color(0xFFF4F5F7), px(3.4f), gpt(22f, 27.2f))
                        drawCircle(Color(0xFFF4F5F7), px(3.4f), gpt(42f, 27.2f))
                        drawLine(phaseColor, gpt(22f, 25f), gpt(22f, 27.6f), px(1.25f), cap = StrokeCap.Round)
                        drawLine(phaseColor, gpt(20.7f, 26.3f), gpt(23.3f, 26.3f), px(1.25f), cap = StrokeCap.Round)
                        drawLine(phaseColor, gpt(42f, 25f), gpt(42f, 27.6f), px(1.25f), cap = StrokeCap.Round)
                        drawLine(phaseColor, gpt(40.7f, 26.3f), gpt(43.3f, 26.3f), px(1.25f), cap = StrokeCap.Round)
                    }
                    isCoffeePose || isProteinPose -> {
                        drawCircle(Color(0xFFF4F5F7), px(3.5f), gpt(22f, 27.2f))
                        drawCircle(Color(0xFFF4F5F7), px(3.5f), gpt(42f, 27.2f))
                        drawCircle(phaseColor, px(1.15f), gpt(21f, 25.9f))
                        drawCircle(phaseColor, px(1.15f), gpt(41f, 25.9f))
                    }
                    isCalmEyes || isRechargePose || eyeState.isBlinking -> {
                        val lCalm = Path().apply {
                            moveTo(px(18f) + gx, px(28.2f) + gy)
                            cubicTo(px(20f) + gx, px(30.8f) + gy, px(24f) + gx, px(30.8f) + gy, px(26f) + gx, px(28.2f) + gy)
                        }
                        val rCalm = Path().apply {
                            moveTo(px(38f) + gx, px(28.2f) + gy)
                            cubicTo(px(40f) + gx, px(30.8f) + gy, px(44f) + gx, px(30.8f) + gy, px(46f) + gx, px(28.2f) + gy)
                        }
                        drawPath(lCalm, Color(0xFFD1D5DB), style = Stroke(px(2.6f), cap = StrokeCap.Round))
                        drawPath(rCalm, Color(0xFFD1D5DB), style = Stroke(px(2.6f), cap = StrokeCap.Round))
                    }
                    else -> {
                        val rEye = if (isPerkPose || isStretchPose || isFlexPose || isSalutePose) px(3.2f) else px(2.9f)
                        drawCircle(Color(0xFFF4F5F7), rEye, gpt(22f, 27.5f))
                        drawCircle(Color(0xFFF4F5F7), rEye, gpt(42f, 27.5f))
                        drawCircle(phaseColor, px(0.95f), gpt(21f, 26.3f))
                        drawCircle(phaseColor, px(0.95f), gpt(41f, 26.3f))
                    }
                }

                // Cheek warmth
                if (isCelebration || isTeaPose || isCoffeePose || isWinkPose || isStretchPose ||
                    isZenPose || isMusicPose || isSunrisePose || isSparklePose || isCozyPose ||
                    isDreamPose || isSweatPose || isPerkPose
                ) {
                    val blushR = if (isCozyPose || isSparklePose) px(2.9f) else px(2.5f)
                    val blushAlpha = if (isCozyPose) 0.34f else 0.22f
                    drawCircle(phaseColor.copy(alpha = blushAlpha), blushR, pt(16.2f, 34f))
                    drawCircle(phaseColor.copy(alpha = blushAlpha), blushR, pt(47.8f, 34f))
                }

                // Dynamic Mouth
                when {
                    isCelebration || isFlexPose || isBeastPose || isSparklePose -> {
                        val mouth = Path().apply {
                            moveTo(px(22.5f), px(36.5f))
                            cubicTo(px(25.5f), px(42.5f), px(38.5f), px(42.5f), px(41.5f), px(36.5f))
                            close()
                        }
                        drawPath(mouth, phaseColor.copy(alpha = 0.22f))
                        drawPath(mouth, phaseColor, style = Stroke(px(2.6f), cap = StrokeCap.Round, join = StrokeJoin.Round))
                    }
                    isWhistlePose -> {
                        drawCircle(phaseColor.copy(alpha = 0.2f), px(2.4f), pt(34f, 38.2f))
                        drawCircle(phaseColor, px(2.4f), pt(34f, 38.2f), style = Stroke(px(2.3f)))
                    }
                    isSmirkPose -> {
                        val mouth = Path().apply {
                            moveTo(px(25f), px(38.6f))
                            cubicTo(px(29.5f), px(40f), px(35.8f), px(39f), px(40.5f), px(35.4f))
                        }
                        drawPath(mouth, phaseColor, style = Stroke(px(2.6f), cap = StrokeCap.Round))
                    }
                    isYawnPose -> {
                        drawOval(phaseColor.copy(alpha = 0.18f), pt(28.9f, 35.2f), Size(px(6.2f), px(8f)))
                        drawOval(phaseColor, pt(28.9f, 35.2f), Size(px(6.2f), px(8f)), style = Stroke(px(2.3f)))
                    }
                    isSleepPose -> {
                        drawCircle(phaseColor.copy(alpha = 0.2f), px(2.1f), pt(32f, 38.5f))
                        drawCircle(phaseColor, px(2.1f), pt(32f, 38.5f), style = Stroke(px(2.1f)))
                    }
                    isCuriousPose || isStargazePose -> {
                        drawCircle(phaseColor, px(2.4f), pt(32f, 38.5f), style = Stroke(px(2.4f)))
                    }
                    isFocusedEyes -> {
                        drawLine(phaseColor, pt(25.5f, 38.5f), pt(38.5f, 38.5f), px(2.6f), cap = StrokeCap.Round)
                    }
                    isTeaPose || isCoffeePose || isProteinPose -> {
                        val m = Path().apply {
                            moveTo(px(24.5f), px(36.5f))
                            cubicTo(px(27.2f), px(39.5f), px(33.2f), px(39.5f), px(36f), px(36.5f))
                        }
                        drawPath(m, phaseColor, style = Stroke(px(2.5f), cap = StrokeCap.Round))
                    }
                    isShadesPose || isWinkPose || isSalutePose -> {
                        val m = Path().apply {
                            moveTo(px(24.5f), px(37.5f))
                            cubicTo(px(28.5f), px(40.8f), px(36f), px(40.2f), px(40f), px(36f))
                        }
                        drawPath(m, phaseColor, style = Stroke(px(2.7f), cap = StrokeCap.Round))
                    }
                    isNightChillPose || isZenPose || isCalmEyes || isCozyPose || isDreamPose || isMoonlitPose || isRechargePose -> {
                        val m = Path().apply {
                            moveTo(px(26.5f), px(37.5f))
                            cubicTo(px(29f), px(39.8f), px(35f), px(39.8f), px(37.5f), px(37.5f))
                        }
                        drawPath(m, phaseColor, style = Stroke(px(2.5f), cap = StrokeCap.Round))
                    }
                    else -> {
                        val m = Path().apply {
                            moveTo(px(23.5f), px(36.5f))
                            cubicTo(px(27f), px(40.8f), px(37f), px(40.8f), px(40.5f), px(36.5f))
                        }
                        drawPath(m, phaseColor, style = Stroke(px(2.8f), cap = StrokeCap.Round))
                    }
                }

                // Contextual Props
                if (isCelebration) {
                    drawLine(phaseColor, pt(11f, 18f), pt(15.5f, 20.5f), px(2.4f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(53f, 18f), pt(48.5f, 20.5f), px(2.4f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(32f, 9f), pt(32f, 14f), px(2.4f), cap = StrokeCap.Round)
                }
                if (isTeaPose) {
                    drawRoundRect(Color(0xFF1F2937), pt(41f, 38.5f), Size(px(11f), px(9f)), CornerRadius(px(2.5f)))
                    drawRoundRect(phaseColor, pt(41f, 38.5f), Size(px(11f), px(9f)), CornerRadius(px(2.5f)), style = Stroke(px(2f)))
                    drawLine(phaseColor, pt(44.8f, 35.5f), pt(44.8f, 31f), px(1.5f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(49.2f, 35.5f), pt(49.2f, 31f), px(1.5f), cap = StrokeCap.Round)
                }
                if (isCoffeePose) {
                    val amber = Color(0xFFFBBF24)
                    drawRoundRect(Color(0xFF291B12), pt(40.5f, 38f), Size(px(11.5f), px(9.5f)), CornerRadius(px(2.2f)))
                    drawRoundRect(amber, pt(40.5f, 38f), Size(px(11.5f), px(9.5f)), CornerRadius(px(2.2f)), style = Stroke(px(2f)))
                    drawLine(amber, pt(45.5f, 35f), pt(45.5f, 30f), px(1.7f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(14f, 14f), pt(14f, 18f), px(1.8f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(12f, 16f), pt(16f, 16f), px(1.8f), cap = StrokeCap.Round)
                }
                if (isSunrisePose) {
                    val sun = Path().apply {
                        moveTo(px(24f), px(16.5f))
                        cubicTo(px(25.5f), px(12.2f), px(38.5f), px(12.2f), px(40f), px(16.5f))
                    }
                    drawPath(sun, Color(0x59FBBF24))
                    drawPath(sun, Color(0xFFFBBF24), style = Stroke(px(1.8f), cap = StrokeCap.Round))
                    drawLine(Color(0xFFFBBF24), pt(32f, 8f), pt(32f, 10.8f), px(1.8f), cap = StrokeCap.Round)
                }
                if (isProteinPose) {
                    drawRoundRect(Color(0xFF18202C), pt(42.5f, 36.5f), Size(px(9f), px(12f)), CornerRadius(px(2.2f)))
                    drawRoundRect(phaseColor, pt(42.5f, 36.5f), Size(px(9f), px(12f)), CornerRadius(px(2.2f)), style = Stroke(px(1.9f)))
                    drawLine(Color(0xFFF4F5F7), pt(41.5f, 36.5f), pt(52.5f, 36.5f), px(2.2f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(45f, 34f), pt(49f, 34f), px(2f), cap = StrokeCap.Round)
                }
                if (isSalutePose) {
                    drawLine(phaseColor, pt(44f, 15.5f), pt(48.5f, 11.5f), px(2.2f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(48.5f, 11.5f), pt(53f, 15.5f), px(2.2f), cap = StrokeCap.Round)
                }
                if (isSparklePose) {
                    drawLine(phaseColor, pt(14f, 13f), pt(14f, 18f), px(1.9f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(11.5f, 15.5f), pt(16.5f, 15.5f), px(1.9f), cap = StrokeCap.Round)
                    drawLine(Color(0xFFFDE68A), pt(50f, 13.5f), pt(50f, 18.5f), px(1.9f), cap = StrokeCap.Round)
                    drawLine(Color(0xFFFDE68A), pt(47.5f, 16f), pt(52.5f, 16f), px(1.9f), cap = StrokeCap.Round)
                }
                if (isBeastPose) {
                    val flame = Path().apply {
                        moveTo(px(32f), px(7.5f))
                        cubicTo(px(34.8f), px(11f), px(36.2f), px(13.2f), px(35.4f), px(15.8f))
                        cubicTo(px(34.8f), px(17.5f), px(33.4f), px(18.4f), px(32f), px(18.4f))
                        cubicTo(px(30.6f), px(18.4f), px(29.2f), px(17.5f), px(28.6f), px(15.8f))
                        cubicTo(px(27.8f), px(13.2f), px(29.2f), px(11f), px(32f), px(7.5f))
                        close()
                    }
                    drawPath(flame, phaseColor.copy(alpha = 0.9f))
                    drawPath(flame, Color(0xFFFDE68A), style = Stroke(px(1.2f)))
                }
                if (isSweatPose || isHydratePose || isFocusedEyes) {
                    drawCircle(Color(0xFF38BDF8), px(3.2f), pt(50f, 20f))
                    drawCircle(Color(0xFFE0F2FE), px(1f), pt(49f, 18.8f))
                }
                if (isSmirkPose) {
                    drawLine(phaseColor, pt(48f, 13f), pt(48f, 23f), px(1.8f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(43f, 18f), pt(53f, 18f), px(1.8f), cap = StrokeCap.Round)
                }
                if (isWhistlePose || isMusicPose) {
                    drawLine(phaseColor, pt(48f, 18f), pt(48f, 11.5f), px(1.9f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(48f, 11.5f), pt(53.5f, 10.2f), px(1.9f), cap = StrokeCap.Round)
                    drawCircle(phaseColor, px(1.7f), pt(46.5f, 18.2f))
                }
                if (isDreamPose) {
                    drawCircle(phaseColor.copy(alpha = 0.7f), px(1.3f), pt(43.5f, 21f))
                    drawRoundRect(Color(0xFF1E293B), pt(43f, 10f), Size(px(11f), px(7f)), CornerRadius(px(3.5f)))
                    drawRoundRect(phaseColor, pt(43f, 10f), Size(px(11f), px(7f)), CornerRadius(px(3.5f)), style = Stroke(px(1.5f)))
                }
                if (isMoonlitPose || isYawnPose || isNightChillPose || isStargazePose) {
                    drawCircle(phaseColor, px(3.5f), pt(48f, 15.5f))
                    drawCircle(Color(0xFF121620), px(2.8f), pt(50f, 14f))
                    drawCircle(Color(0xFFE0E7FF), px(1.2f), pt(20f, 14f))
                }
                if (isRechargePose) {
                    drawRoundRect(phaseColor, pt(25f, 10f), Size(px(13f), px(6.8f)), CornerRadius(px(1.8f)), style = Stroke(px(1.6f)))
                    drawRect(phaseColor, pt(27f, 11.8f), Size(px(9f), px(3.2f)))
                }
                if (isWinkPose) {
                    drawLine(phaseColor, pt(49f, 14f), pt(49f, 19f), px(2f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(46.5f, 16.5f), pt(51.5f, 16.5f), px(2f), cap = StrokeCap.Round)
                }
                if (isFlexPose) {
                    drawLine(phaseColor, pt(48f, 11f), pt(44.5f, 17.5f), px(2.1f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(44.5f, 17.5f), pt(48.5f, 17.5f), px(2.1f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(48.5f, 17.5f), pt(45.5f, 23.5f), px(2.1f), cap = StrokeCap.Round)
                }
                if (isStretchPose) {
                    drawLine(phaseColor, pt(32f, 7.5f), pt(32f, 12.5f), px(2.3f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(21f, 10.5f), pt(24f, 14.5f), px(2.1f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(43f, 10.5f), pt(40f, 14.5f), px(2.1f), cap = StrokeCap.Round)
                }
                if (isSleepPose) {
                    drawLine(phaseColor, pt(44f, 17f), pt(50f, 17f), px(1.9f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(50f, 17f), pt(44f, 23f), px(1.9f), cap = StrokeCap.Round)
                    drawLine(phaseColor, pt(44f, 23f), pt(50f, 23f), px(1.9f), cap = StrokeCap.Round)
                }
                if (isZenPose) {
                    drawCircle(phaseColor, px(3.2f), pt(32f, 14f), style = Stroke(px(1.7f)))
                }
            }
        }
    }
}

@Composable
fun TodayMascot(
    mascot: MascotUiState,
    eyeStateFlow: StateFlow<MascotEyeState>,
    voiceEnabled: Boolean,
    onTapMascot: () -> Unit,
    onReplayVoice: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tokens = LocalIronPulseTokens.current
    val phaseColor = remember(mascot.phaseColorHex) {
        MaterialYouColorEngine.parseColor(mascot.phaseColorHex, tokens.phaseTokens.accentBright)
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .tactilePress(pressedScale = 0.98f, disabledByPerf = tokens.performance.noAnimations)
            .ironGlassSurface(
                tokens = tokens,
                subtle = true,
                borderOverride = phaseColor.copy(alpha = 0.28f),
                radiusOverride = 18.dp
            )
            .clickable(onClick = onTapMascot)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        MascotOrbFace(mascot = mascot, eyeStateFlow = eyeStateFlow, size = 62.dp)

        Column(modifier = Modifier.weight(1f)) {
            AnimatedContent(
                targetState = mascot.activeLine,
                transitionSpec = {
                    fadeIn(tween(180)) togetherWith fadeOut(tween(140))
                },
                label = "mascotLine"
            ) { line ->
                Column {
                    Text(
                        text = line.headline,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFF4F5F7),
                        lineHeight = 18.sp
                    )
                    if (line.subline.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = line.subline,
                            fontSize = 12.sp,
                            color = tokens.mutedTextColor,
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        }

        if (voiceEnabled) {
            IconButton(
                onClick = onReplayVoice,
                modifier = Modifier
                    .size(36.dp)
                    .tactilePress(disabledByPerf = tokens.performance.noAnimations)
            ) {
                Icon(
                    imageVector = Icons.Rounded.VolumeUp,
                    contentDescription = "Speak mascot line",
                    tint = phaseColor,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun FloatingMascotDock(
    mascot: MascotUiState,
    eyeStateFlow: StateFlow<MascotEyeState>,
    anchorSideRight: Boolean,
    anchorYRatio: Float,
    visible: Boolean,
    onTapOrb: () -> Unit,
    onSaveAnchor: (sideRight: Boolean, yRatio: Float) -> Unit
) {
    if (!visible) return
    val tokens = LocalIronPulseTokens.current
    val density = LocalDensity.current
    val phaseColor = remember(mascot.phaseColorHex) {
        MaterialYouColorEngine.parseColor(mascot.phaseColorHex, tokens.phaseTokens.accentBright)
    }

    var bubbleOpen by remember { mutableStateOf(false) }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val widthPx = with(density) { maxWidth.toPx() }
        val heightPx = with(density) { maxHeight.toPx() }
        val orbSizePx = with(density) { 56.dp.toPx() }
        val marginPx = with(density) { 14.dp.toPx() }

        val targetX = if (anchorSideRight) (widthPx - orbSizePx - marginPx) else marginPx
        val targetY = (heightPx * anchorYRatio).coerceIn(marginPx + 80f, heightPx - orbSizePx - 140f)

        var dragging by remember { mutableStateOf(false) }
        var dragX by remember(targetX, dragging) { mutableFloatStateOf(targetX) }
        var dragY by remember(targetY, dragging) { mutableFloatStateOf(targetY) }

        val displayX by animateFloatAsState(
            targetValue = if (dragging) dragX else targetX,
            animationSpec = if (dragging || tokens.performance.noAnimations) tween(0) else IronPulseMotion.OrbSnapSpring,
            label = "orbX"
        )
        val displayY by animateFloatAsState(
            targetValue = if (dragging) dragY else targetY,
            animationSpec = if (dragging || tokens.performance.noAnimations) tween(0) else IronPulseMotion.OrbSnapSpring,
            label = "orbY"
        )

        // Expanded speech bubble next to orb (GPU translationX/Y — zero layout relayout)
        val bubbleW = with(density) { 248.dp.toPx() }
        AnimatedVisibility(
            visible = bubbleOpen,
            enter = fadeIn(tween(160)) + scaleIn(initialScale = 0.92f),
            exit = fadeOut(tween(120)) + scaleOut(targetScale = 0.92f),
            modifier = Modifier.graphicsLayer {
                val bx = if (anchorSideRight) {
                    (displayX - bubbleW - 10f).coerceAtLeast(marginPx)
                } else {
                    (displayX + orbSizePx + 10f).coerceAtMost(widthPx - bubbleW - marginPx)
                }
                val by = (displayY - 24f).coerceIn(marginPx + 70f, heightPx - 190f)
                translationX = bx
                translationY = by
            }
        ) {
            Column(
                modifier = Modifier
                    .widthIn(min = 200.dp, max = 248.dp)
                    .ironGlassSurface(
                        tokens = tokens,
                        borderOverride = phaseColor.copy(alpha = 0.45f),
                        radiusOverride = 18.dp
                    )
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        text = mascot.activeLine.headline,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFF4F5F7),
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        imageVector = Icons.Rounded.Close,
                        contentDescription = "Tutup",
                        tint = tokens.mutedTextColor,
                        modifier = Modifier
                            .size(18.dp)
                            .clickable { bubbleOpen = false }
                    )
                }
                if (mascot.activeLine.subline.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = mascot.activeLine.subline,
                        fontSize = 11.5.sp,
                        lineHeight = 15.sp,
                        color = tokens.mutedTextColor
                    )
                }
            }
        }

        // Draggable Floating Orb (GPU translationX/Y — 120 FPS drag & snap)
        Box(
            modifier = Modifier
                .graphicsLayer {
                    translationX = displayX
                    translationY = displayY
                }
                .size(56.dp)
                .tactilePress(pressedScale = 0.92f, disabledByPerf = tokens.performance.noAnimations)
                .pointerInput(widthPx, heightPx) {
                    detectDragGestures(
                        onDragStart = { dragging = true },
                        onDragEnd = {
                            dragging = false
                            val center = dragX + orbSizePx / 2f
                            val snapRight = center >= widthPx / 2f
                            val yRatio = (dragY / heightPx).coerceIn(0.16f, 0.82f)
                            onSaveAnchor(snapRight, yRatio)
                        },
                        onDragCancel = { dragging = false },
                        onDrag = { change, dragAmount ->
                            change.consume()
                            dragX = (dragX + dragAmount.x).coerceIn(marginPx, widthPx - orbSizePx - marginPx)
                            dragY = (dragY + dragAmount.y).coerceIn(marginPx + 64f, heightPx - orbSizePx - 96f)
                        }
                    )
                }
                .clickable {
                    onTapOrb()
                    bubbleOpen = true
                },
            contentAlignment = Alignment.Center
        ) {
            MascotOrbFace(mascot = mascot, eyeStateFlow = eyeStateFlow, size = 54.dp)
        }
    }
}
