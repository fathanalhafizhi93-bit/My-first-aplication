package com.fathan.ironpulse.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val IronPulseDarkColors = darkColorScheme(
    primary = Color(0xFFC8FF2E),
    onPrimary = Color(0xFF101802),
    primaryContainer = Color(0xFF283509),
    onPrimaryContainer = Color(0xFFE0FF8C),
    secondary = Color(0xFF7DD3FC),
    onSecondary = Color(0xFF04202C),
    secondaryContainer = Color(0xFF1A2B36),
    onSecondaryContainer = Color(0xFFCDEEFF),
    tertiary = Color(0xFF34D399),
    onTertiary = Color(0xFF042117),
    background = Color(0xFF111318),
    onBackground = Color(0xFFF3F4F6),
    surface = Color(0xFF111318),
    onSurface = Color(0xFFF3F4F6),
    surfaceVariant = Color(0xFF1E222B),
    onSurfaceVariant = Color(0xFFA7B0BE),
    surfaceContainerLowest = Color(0xFF0B0D11),
    surfaceContainerLow = Color(0xFF161920),
    surfaceContainer = Color(0xFF1B1F27),
    surfaceContainerHigh = Color(0xFF232833),
    surfaceContainerHighest = Color(0xFF2C323F),
    outline = Color(0xFF373E4E),
    outlineVariant = Color(0xFF282D39),
    error = Color(0xFFF87171),
    onError = Color(0xFF2F0808)
)

private val IronPulseLightColors = lightColorScheme(
    primary = Color(0xFF3E6B00),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFD6F987),
    onPrimaryContainer = Color(0xFF112200),
    secondary = Color(0xFF0369A1),
    onSecondary = Color(0xFFFFFFFF),
    background = Color(0xFFF6F7FA),
    onBackground = Color(0xFF12151C),
    surface = Color(0xFFF6F7FA),
    onSurface = Color(0xFF12151C),
    surfaceVariant = Color(0xFFE8ECF4),
    onSurfaceVariant = Color(0xFF4B5563),
    surfaceContainer = Color(0xFFFFFFFF),
    surfaceContainerHigh = Color(0xFFF0F3F9),
    outline = Color(0xFFD1D8E4),
    outlineVariant = Color(0xFFE3E8F0)
)

private val IronPulseTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 38.sp,
        fontFeatureSettings = "tnum"
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 19.sp,
        lineHeight = 26.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 19.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        fontFeatureSettings = "tnum"
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        fontFeatureSettings = "tnum"
    )
)

@Composable
fun IronPulseTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> IronPulseDarkColors
        else -> IronPulseLightColors
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = IronPulseTypography,
        content = content
    )
}
