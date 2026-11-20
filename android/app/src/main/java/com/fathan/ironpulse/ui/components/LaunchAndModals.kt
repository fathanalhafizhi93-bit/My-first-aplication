package com.fathan.ironpulse.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Alarm
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.ArrowForward
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Snooze
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fathan.ironpulse.model.AppLanguage
import com.fathan.ironpulse.model.ClockFormat
import com.fathan.ironpulse.model.GymModelHelpers
import com.fathan.ironpulse.ui.theme.LocalIronPulseTokens
import com.fathan.ironpulse.ui.theme.ironGlassSurface
import com.fathan.ironpulse.ui.viewmodel.ActiveTestAlarmState
import com.fathan.ironpulse.ui.viewmodel.AppTab
import com.fathan.ironpulse.ui.viewmodel.MascotUiState
import kotlinx.coroutines.flow.StateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun LaunchIntroOverlay(
    onDismiss: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val launchMillis = remember { System.currentTimeMillis() }
    val date = remember(launchMillis) { Date(launchMillis) }
    val loc = if (lang == AppLanguage.EN) Locale.US else Locale.forLanguageTag("id-ID")
    val dayDate = remember(launchMillis, lang) { SimpleDateFormat("EEE, dd MMM", loc).format(date) }
    val timeLabel = remember(launchMillis, tokens.clockFormat, lang) {
        GymModelHelpers.formatAlarmTime(
            SimpleDateFormat("HH:mm", Locale.US).format(date),
            tokens.clockFormat,
            lang
        )
    }

    var started by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { started = true }
    val lineScale by animateFloatAsState(
        targetValue = if (started) 1f else 0.05f,
        animationSpec = tween(420),
        label = "launchRule"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(tokens.canvasBg)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onDismiss
            )
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp, vertical = 28.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Hairline Orientation Strip
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "$dayDate · $timeLabel",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = tokens.palette.onSurfaceVariant
                    )
                    Text(
                        text = tokens.timePhase.label(lang),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = tokens.phaseTokens.accentBright
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
            }

            // Swiss Poster Athletic Lockup
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Geometric "F" Mark
                    Canvas(modifier = Modifier.size(54.dp, 60.dp)) {
                        val sx = size.width / 88f
                        val sy = size.height / 96f
                        val body = Path().apply {
                            moveTo(8f * sx, 10f * sy)
                            cubicTo(8f * sx, 6.68f * sy, 10.68f * sx, 4f * sy, 14f * sx, 4f * sy)
                            lineTo(80f * sx, 4f * sy)
                            lineTo(70f * sx, 22f * sy)
                            lineTo(28f * sx, 22f * sy)
                            lineTo(28f * sx, 92f * sy)
                            lineTo(8f * sx, 92f * sy)
                            close()
                        }
                        val bar = Path().apply {
                            moveTo(28f * sx, 42f * sy)
                            lineTo(68f * sx, 42f * sy)
                            lineTo(59f * sx, 58f * sy)
                            lineTo(28f * sx, 58f * sy)
                            close()
                        }
                        drawPath(body, tokens.palette.onSurface)
                        drawPath(bar, tokens.accentColor)
                    }

                    Column {
                        Row {
                            Text(
                                text = "Iron",
                                fontSize = 46.sp,
                                lineHeight = 46.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = (-1.5).sp,
                                color = tokens.palette.onSurface
                            )
                            Text(
                                text = "Pulse",
                                fontSize = 46.sp,
                                lineHeight = 46.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = (-1.5).sp,
                                color = tokens.accentColor
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = lang.t(
                                "Jadwal latihan, alarm harian, dan pelacak set.",
                                "Training schedule, daily alarm, and set tracker."
                            ),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = tokens.palette.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .graphicsLayer {
                            scaleX = lineScale
                            transformOrigin = TransformOrigin(0f, 0.5f)
                        }
                        .background(
                            Brush.horizontalGradient(
                                listOf(tokens.accentColor, tokens.accentColor.copy(alpha = 0.45f), Color.Transparent)
                            )
                        )
                )
            }

            // Quiet Footer Affordance
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = lang.t("Ketuk di mana saja untuk masuk", "Tap anywhere to continue"),
                    fontSize = 12.sp,
                    color = tokens.palette.onSurfaceVariant.copy(alpha = 0.8f)
                )
                Text(
                    text = "1.4s",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    color = tokens.palette.onSurfaceVariant.copy(alpha = 0.8f)
                )
            }
        }
    }
}

@Composable
fun NamePromptModal(
    initialName: String,
    mascot: MascotUiState,
    onSaveName: (String) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    var nameInput by remember(initialName) { mutableStateOf(initialName) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    Dialog(
        onDismissRequest = {},
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .ironGlassSurface(tokens, borderOverride = tokens.accentColor.copy(alpha = 0.35f))
                .padding(22.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                MascotOrbFace(mascot = mascot, size = 60.dp)
                Column {
                    Text(
                        text = lang.t("KENALAN DENGAN MASKOT", "MEET YOUR COMPANION"),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = tokens.accentColor
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = lang.t("Siapa nama panggilanmu?", "What should I call you?"),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = tokens.palette.onSurface
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = lang.t(
                    "Karakter penyemangat akan menyapamu dengan nama ini setiap kali kamu membuka IronPulse. Kamu bisa menggantinya kapan saja di Pengaturan.",
                    "Your workout companion will greet you by this name every time you open IronPulse. You can change it anytime in Settings."
                ),
                fontSize = 13.sp,
                lineHeight = 19.sp,
                color = tokens.palette.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = nameInput,
                onValueChange = {
                    nameInput = it.take(100)
                    errorMsg = null
                },
                label = { Text(lang.t("Nama Panggilan", "Nickname / Display Name")) },
                placeholder = { Text(lang.t("Contoh: Fathan", "e.g. Alex")) },
                singleLine = true,
                shape = RoundedCornerShape(tokens.inputRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = tokens.accentColor,
                    unfocusedBorderColor = tokens.surfaceBorderColor,
                    focusedTextColor = tokens.palette.onSurface,
                    unfocusedTextColor = tokens.palette.onSurface
                ),
                modifier = Modifier.fillMaxWidth()
            )
            if (errorMsg != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = errorMsg ?: "", fontSize = 12.sp, color = Color(0xFFFCA5A5))
            }

            Spacer(modifier = Modifier.height(18.dp))
            Button(
                onClick = {
                    val cleaned = nameInput.trim()
                    if (cleaned.isEmpty()) {
                        errorMsg = lang.t("Masukkan nama panggilanmu terlebih dahulu.", "Please enter your name first.")
                    } else {
                        onSaveName(cleaned)
                    }
                },
                shape = RoundedCornerShape(tokens.buttonRadius),
                colors = ButtonDefaults.buttonColors(
                    containerColor = tokens.accentColor,
                    contentColor = tokens.onAccentColor
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(lang.t("Simpan & Lanjutkan", "Save & Continue"), fontWeight = FontWeight.Bold)
            }
        }
    }
}

private data class TutorialStepSpec(
    val tab: AppTab,
    val titleId: String,
    val titleEn: String,
    val tabLabelId: String,
    val tabLabelEn: String,
    val summaryId: String,
    val summaryEn: String,
    val tipsId: List<String>,
    val tipsEn: List<String>,
    val icon: ImageVector
)

private val TUTORIAL_STEPS = listOf(
    TutorialStepSpec(
        tab = AppTab.TODAY,
        titleId = "Catat Latihan Hari Ini",
        titleEn = "Log Today's Workout",
        tabLabelId = "Tab Hari Ini",
        tabLabelEn = "Today Tab",
        summaryId = "Ruang utama saat di gym dengan Timer Istirahat di bawah hero, suasana Pagi/Siang/Malam, maskot penyemangat, serta pengaman salah klik 30 detik.",
        summaryEn = "Your gym-floor screen with the Rest Timer right below the hero, Morning/Day/Night themes, companion orb, and a 30s anti-misclick guard.",
        tipsId = listOf(
            "Gunakan Timer Istirahat di bawah hero untuk menghitung waktu pemulihan antar set secara akurat.",
            "Pengaman 30 detik mencegah salah klik atau ketukan beruntun; pakai Tetap Centang jika memang butuh cepat.",
            "Maskot bulat menyapamu dengan namamu saat aplikasi dibuka dan bertepuk tangan setiap set selesai."
        ),
        tipsEn = listOf(
            "Use the Rest Timer right below the hero to track your between-set recovery accurately.",
            "The 30s tap guard prevents accidental double-clicks; use Confirm Anyway whenever needed.",
            "The circular companion greets you by name when opening the app and claps on every completed set."
        ),
        icon = Icons.Rounded.PlayCircle
    ),
    TutorialStepSpec(
        tab = AppTab.SCHEDULE,
        titleId = "Atur Hari Gym & Jam Alarm",
        titleEn = "Weekly Days & Alarm Times",
        tabLabelId = "Tab Jadwal",
        tabLabelEn = "Schedule Tab",
        summaryId = "Pilih hari latihan dari Senin sampai Minggu, atur jam pengingat harian, fokus otot, dan nada alarm khusus per hari.",
        summaryEn = "Pick your active gym days Monday through Sunday, set alarm times, muscle focus, and custom ringtones per day.",
        tipsId = listOf(
            "Ubah status tiap hari menjadi Hari Gym atau Rest Day dengan satu ketukan.",
            "Setel jam pengingat dan aktifkan ikon lonceng untuk hari yang dipilih.",
            "Alarm mingguan otomatis tersinkron ke AlarmManager Android native."
        ),
        tipsEn = listOf(
            "Toggle any day between Gym Day and Rest Day in one tap.",
            "Set the reminder time and toggle the bell icon for active days.",
            "Weekly alarms automatically sync to native Android AlarmManager."
        ),
        icon = Icons.Rounded.CalendarMonth
    ),
    TutorialStepSpec(
        tab = AppTab.EXERCISES,
        titleId = "Kelola Daftar & Pustaka Gerakan",
        titleEn = "Manage Exercises & Library",
        tabLabelId = "Tab Gerakan",
        tabLabelEn = "Exercises Tab",
        summaryId = "Susun daftar gerakan tiap hari dari pustaka siap pakai (80+ gerakan) atau buat gerakan kustom beserta target set dan istirahat.",
        summaryEn = "Build each day's exercise list from the built-in 80+ movement library or add custom movements with set & rest targets.",
        tipsId = listOf(
            "Pilih hari di bagian atas untuk mengatur daftar gerakan hari tersebut.",
            "Cari gerakan di Pustaka lalu centang beberapa gerakan sekaligus.",
            "Atur target set, repetisi/timer, beban awal, serta catatan teknik gerakan."
        ),
        tipsEn = listOf(
            "Select a day at the top to edit its planned exercises.",
            "Search the Exercise Library and batch-add multiple movements at once.",
            "Customize target sets, reps/timer, starting weight, and form notes."
        ),
        icon = Icons.Rounded.FitnessCenter
    ),
    TutorialStepSpec(
        tab = AppTab.HISTORY,
        titleId = "Pantau Kalender & Detail Sesi",
        titleEn = "Consistency Calendar & Logs",
        tabLabelId = "Tab Riwayat",
        tabLabelEn = "History Tab",
        summaryId = "Lihat streak mingguan, total volume bulanan, dan buka kembali catatan beban serta set dari tanggal-tanggal sebelumnya.",
        summaryEn = "Track your weekly streak, total volume, and review logged weights and sets from past training dates.",
        tipsId = listOf(
            "Tanggal aksen menandakan sesi selesai penuh, biru menandakan sebagian set selesai.",
            "Ketuk tanggal mana pun di kalender untuk membuka Detail Sesi di bawahnya.",
            "Semua riwayat tersimpan otomatis ke akun Cloud Anda."
        ),
        tipsEn = listOf(
            "Accent dates mark fully completed sessions; blue dates mark partial sessions.",
            "Tap any date on the calendar to inspect its full Session Detail below.",
            "Every logged session stays safely synced to your Cloud account."
        ),
        icon = Icons.Rounded.History
    ),
    TutorialStepSpec(
        tab = AppTab.SETTINGS,
        titleId = "Pengaturan Alarm, Ringtone & Tema",
        titleEn = "Alarms, Ringtones & Theme Settings",
        tabLabelId = "Halaman Pengaturan",
        tabLabelEn = "Settings Page",
        summaryId = "Atur 6 tema antarmuka, nada dering alarm gym, suara selesai istirahat, unggah audio sendiri dari HP, serta cek izin Exact Alarm.",
        summaryEn = "Customize 6 UI themes, alarm and rest tones, upload custom audio from your phone, and verify Android Exact Alarm settings.",
        tipsId = listOf(
            "Buka ikon Pengaturan di pojok kanan atas lalu pilih sub-tab Alarm untuk memilih atau mengunggah MP3/WAV/OGG.",
            "Gunakan tombol Tes Alarm di pojok kanan atas untuk mencoba layar alarm penuh.",
            "Cek status Exact Alarm dan jalankan Uji Alarm 5 Detik di sub-tab Alarm."
        ),
        tipsEn = listOf(
            "Open Settings at top right and go to Alarm to pick or upload MP3/WAV/OGG ringtones.",
            "Tap Test Alarm in the top right to preview the full-screen gym alert.",
            "Check Exact Alarm permission and run the 5s Background Alarm Test inside the Alarm tab."
        ),
        icon = Icons.Rounded.MusicNote
    )
)

@Composable
fun FeatureTutorialModal(
    startAtLanguageStep: Boolean,
    onSelectLanguage: (AppLanguage) -> Unit,
    onComplete: () -> Unit,
    onJumpToTab: (AppTab) -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    var stepIndex by remember(startAtLanguageStep) {
        mutableIntStateOf(if (startAtLanguageStep) -1 else 0)
    }
    var confirmSkip by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = { confirmSkip = true },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 18.dp, vertical = 24.dp)
                .fillMaxWidth()
                .ironGlassSurface(tokens)
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            if (confirmSkip) {
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0x1AFBBF24))
                            .border(1.dp, Color(0x4DFBBF24), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Rounded.Warning, contentDescription = null, tint = Color(0xFFFBBF24))
                    }
                    Column {
                        Text(
                            text = lang.t("Lewati Panduan Fitur?", "Skip Feature Guide?"),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = tokens.palette.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = lang.t(
                                "Anda selalu bisa membuka ulang panduan ini lewat menu Pengaturan -> Sistem.",
                                "You can always reopen this guide anytime from Settings -> System."
                            ),
                            fontSize = 13.sp,
                            lineHeight = 19.sp,
                            color = tokens.palette.onSurfaceVariant
                        )
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onComplete,
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                        modifier = Modifier.weight(1f).height(44.dp)
                    ) {
                        Text(lang.t("Ya, Lewati", "Skip"), color = tokens.palette.onSurface)
                    }
                    Button(
                        onClick = { confirmSkip = false },
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = tokens.accentColor,
                            contentColor = tokens.onAccentColor
                        ),
                        modifier = Modifier.weight(1f).height(44.dp)
                    ) {
                        Text(lang.t("Lanjut Panduan", "Resume"), fontWeight = FontWeight.Bold)
                    }
                }
            } else if (stepIndex == -1) {
                // Step -1: Language Picker
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = lang.t("SELAMAT DATANG DI IRONPULSE", "WELCOME TO IRONPULSE"),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.accentColor
                    )
                    TextButton(onClick = { confirmSkip = true }) {
                        Text(lang.t("Lewati", "Skip"), color = tokens.palette.onSurfaceVariant, fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(tokens.accentColor.copy(alpha = 0.12f))
                            .border(1.dp, tokens.accentColor.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Rounded.Public, contentDescription = null, tint = tokens.accentColor)
                    }
                    Column {
                        Text(
                            text = "Pilih Bahasa · Choose Language",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = tokens.palette.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = lang.t(
                                "Pilih bahasa utama Anda. Bisa diganti kapan saja di Pengaturan.",
                                "Select your preferred language. Switch anytime in Settings."
                            ),
                            fontSize = 13.sp,
                            color = tokens.palette.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf(
                        Triple(AppLanguage.ID, "Bahasa Indonesia", "Antarmuka bahasa Indonesia"),
                        Triple(AppLanguage.EN, "English", "English user interface")
                    ).forEach { (option, title, desc) ->
                        val selected = lang == option
                        Surface(
                            onClick = { onSelectLanguage(option) },
                            shape = RoundedCornerShape(14.dp),
                            color = if (selected) tokens.accentColor.copy(alpha = 0.14f) else tokens.palette.surfaceContainerLow,
                            border = BorderStroke(
                                1.dp,
                                if (selected) tokens.accentColor else tokens.surfaceBorderColor
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(title, fontWeight = FontWeight.Bold, color = tokens.palette.onSurface)
                                    Text(desc, fontSize = 12.sp, color = tokens.palette.onSurfaceVariant)
                                }
                                if (selected) {
                                    Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = tokens.accentColor)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))
                Button(
                    onClick = { stepIndex = 0 },
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = tokens.accentColor,
                        contentColor = tokens.onAccentColor
                    ),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Text(lang.t("Mulai Panduan (5 Langkah)", "Start Guide (5 Steps)"), fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.width(6.dp))
                    Icon(Icons.Rounded.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                }
            } else {
                val step = TUTORIAL_STEPS[stepIndex]
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${lang.t("Langkah", "Step")} ${stepIndex + 1}/5 · ${lang.t(step.tabLabelId, step.tabLabelEn)}",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.accentColor
                    )
                    TextButton(onClick = { confirmSkip = true }) {
                        Text(lang.t("Lewati", "Skip"), color = tokens.palette.onSurfaceVariant, fontSize = 12.sp)
                    }
                }

                // 5-segment progress strip
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    TUTORIAL_STEPS.forEachIndexed { idx, _ ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(5.dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(
                                    if (idx <= stepIndex) tokens.accentColor else Color.White.copy(alpha = 0.14f)
                                )
                                .clickable { stepIndex = idx }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(tokens.accentColor.copy(alpha = 0.12f))
                            .border(1.dp, tokens.accentColor.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(step.icon, contentDescription = null, tint = tokens.accentColor)
                    }
                    Column {
                        Text(
                            text = lang.t(step.titleId, step.titleEn),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = tokens.palette.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = lang.t(step.summaryId, step.summaryEn),
                            fontSize = 13.sp,
                            lineHeight = 19.sp,
                            color = tokens.palette.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Spacer(modifier = Modifier.height(12.dp))

                val tips = if (lang == AppLanguage.EN) step.tipsEn else step.tipsId
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    tips.forEach { tip ->
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CheckCircle,
                                contentDescription = null,
                                tint = tokens.accentColor,
                                modifier = Modifier.padding(top = 2.dp).size(15.dp)
                            )
                            Text(
                                text = tip,
                                fontSize = 12.5.sp,
                                lineHeight = 18.sp,
                                color = tokens.palette.onSurface
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))
                OutlinedButton(
                    onClick = {
                        onJumpToTab(step.tab)
                        onComplete()
                    },
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                    modifier = Modifier.fillMaxWidth().height(42.dp)
                ) {
                    Text(
                        text = lang.t("Buka ${step.tabLabelId}", "Open ${step.tabLabelEn}"),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = tokens.palette.onSurface
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (stepIndex > 0 || startAtLanguageStep) {
                        OutlinedButton(
                            onClick = { stepIndex = if (stepIndex == 0) -1 else stepIndex - 1 },
                            shape = RoundedCornerShape(tokens.buttonRadius),
                            border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                            modifier = Modifier.weight(1f).height(46.dp)
                        ) {
                            Icon(Icons.Rounded.ArrowBack, contentDescription = null, modifier = Modifier.size(16.dp), tint = tokens.palette.onSurface)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(lang.t("Kembali", "Back"), color = tokens.palette.onSurface)
                        }
                    }
                    Button(
                        onClick = {
                            if (stepIndex >= TUTORIAL_STEPS.lastIndex) onComplete()
                            else stepIndex += 1
                        },
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = tokens.accentColor,
                            contentColor = tokens.onAccentColor
                        ),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        Text(
                            text = if (stepIndex >= TUTORIAL_STEPS.lastIndex) {
                                lang.t("Selesai & Mulai", "Finish & Start")
                            } else {
                                lang.t("Lanjut", "Next")
                            },
                            fontWeight = FontWeight.Bold
                        )
                        if (stepIndex < TUTORIAL_STEPS.lastIndex) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(Icons.Rounded.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CooldownAlertModal(
    cooldownSecondsFlow: StateFlow<Int>,
    exerciseName: String,
    setNumber: Int,
    onBypass: () -> Unit,
    onDismiss: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val cooldownRemaining by cooldownSecondsFlow.collectAsStateWithLifecycle()
    val progress = (cooldownRemaining.coerceIn(0, 30) / 30f)

    Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .ironGlassSurface(tokens, borderOverride = Color(0x73F59E0B))
                .padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Rounded.Warning, contentDescription = null, tint = Color(0xFFFBBF24), modifier = Modifier.size(16.dp))
                Text(
                    text = lang.t("PENGAMAN SALAH KLIK · 30 DETIK", "ANTI-MISCLICK GUARD · 30S"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.9.sp,
                    color = Color(0xFFFBBF24)
                )
            }

            Spacer(modifier = Modifier.height(18.dp))
            Box(modifier = Modifier.size(120.dp), contentAlignment = Alignment.Center) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val stroke = 7.dp.toPx()
                    drawArc(
                        color = Color.White.copy(alpha = 0.08f),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(stroke)
                    )
                    drawArc(
                        color = Color(0xFFF59E0B),
                        startAngle = -90f,
                        sweepAngle = 360f * progress,
                        useCenter = false,
                        style = Stroke(stroke, cap = StrokeCap.Round)
                    )
                }
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = "$cooldownRemaining",
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 40.sp,
                        color = tokens.accentColor
                    )
                    Text(
                        text = lang.t("d", "s"),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 15.sp,
                        color = tokens.palette.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = lang.t("Cegah Salah Klik Set!", "Hold On — Avoid Misclicks!"),
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                color = tokens.palette.onSurface,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = lang.t(
                    "Jeda 30 detik mencegah klik ganda atau ketukan tidak sengaja pada \"$exerciseName\" Set #$setNumber. Gunakan Timer Istirahat untuk jeda antar set.",
                    "This 30s guard prevents accidental taps on \"$exerciseName\" Set #$setNumber. Use the Rest Timer for between-set recovery."
                ),
                fontSize = 13.sp,
                lineHeight = 19.sp,
                textAlign = TextAlign.Center,
                color = tokens.palette.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(
                    onClick = onDismiss,
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Icon(Icons.Rounded.Schedule, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(lang.t("Tunggu ($cooldownRemaining d)", "Wait (${cooldownRemaining}s)"), color = tokens.palette.onSurface)
                }

                Button(
                    onClick = onBypass,
                    shape = RoundedCornerShape(tokens.buttonRadius),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = tokens.accentColor,
                        contentColor = tokens.onAccentColor
                    ),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(lang.t("Tetap Centang (Lewati)", "Confirm Anyway"), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AboutDialog(onDismiss: () -> Unit) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 18.dp, vertical = 24.dp)
                .fillMaxWidth()
                .ironGlassSurface(tokens)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "About IronPulse",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = tokens.palette.onSurface
                )
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Rounded.Close, contentDescription = "Close", tint = tokens.palette.onSurfaceVariant)
                }
            }

            // Credits Hero Box
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .ironGlassSurface(tokens, subtle = true, borderOverride = tokens.accentColor.copy(alpha = 0.3f))
                    .padding(18.dp)
            ) {
                Text(
                    text = lang.t("KREDIT & PEMBUAT", "CREDITS & CREATORS"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.6.sp,
                    color = tokens.accentColor
                )
                Spacer(modifier = Modifier.height(10.dp))

                // Hello ~~world~~ Artificial Intelligence
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Hello ",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.palette.onSurface
                    )
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = "world",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = tokens.palette.onSurfaceVariant.copy(alpha = 0.72f),
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                        Canvas(modifier = Modifier.matchParentSize()) {
                            drawLine(
                                color = tokens.accentColor,
                                start = Offset(0f, size.height * 0.62f),
                                end = Offset(size.width, size.height * 0.42f),
                                strokeWidth = 3.dp.toPx(),
                                cap = StrokeCap.Round
                            )
                        }
                    }
                    Text(
                        text = " ",
                        fontSize = 22.sp
                    )
                }
                Text(
                    text = "Artificial Intelligence",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = tokens.accentColor
                )

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Spacer(modifier = Modifier.height(14.dp))

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    AboutCreditRow(lang.t("Pembuat Aplikasi", "App Builder"), "Fathan and Gemini", tokens.palette.onSurface)
                    AboutCreditRow("Concept, Release & Tester", "Fathan Alhafizhi", tokens.palette.onSurface)
                    AboutCreditRow("Scripter", "fathan, some ai", tokens.accentColor, mono = true)
                }
            }

            // About the App Box
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .ironGlassSurface(tokens, subtle = true)
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = lang.t("Tentang Aplikasi", "About the App"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.palette.onSurface
                )
                Text(
                    text = lang.t(
                        "IronPulse dirancang untuk membantu konsistensi jadwal latihan gym Anda setiap minggu, lengkap dengan alarm hari aktif, unggahan ringtone kustom, panduan daftar gerakan harian, catatan beban/set/repetisi, riwayat kalender sesi, serta timer istirahat antar set yang tersinkronisasi ke Cloud.",
                        "IronPulse is built to keep your weekly gym schedule consistent—featuring daily workout alarms, custom ringtones, daily movement plans, weight/set/rep logging, a workout history calendar, and cloud-synced rest timers."
                    ),
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                    color = tokens.palette.onSurfaceVariant
                )
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Text(
                    text = listOf(
                        lang.t("Jadwal Mingguan", "Weekly Schedule"),
                        lang.t("Kalender Riwayat", "History Calendar"),
                        lang.t("Ringtone Kustom", "Custom Ringtones"),
                        lang.t("Alarm Background Android", "Android Background Alarms")
                    ).joinToString(" · "),
                    fontSize = 11.5.sp,
                    color = tokens.palette.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun AboutCreditRow(
    label: String,
    value: String,
    valueColor: Color,
    mono: Boolean = false
) {
    val tokens = LocalIronPulseTokens.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, fontSize = 12.sp, color = tokens.palette.onSurfaceVariant)
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = if (mono) FontFamily.Monospace else FontFamily.SansSerif,
            color = valueColor
        )
    }
}

@Composable
fun ActiveAlarmOverlay(
    alarm: ActiveTestAlarmState,
    snoozeMinutes: Int,
    onStartWorkout: () -> Unit,
    onSnooze: () -> Unit,
    onDismiss: () -> Unit
) {
    val tokens = LocalIronPulseTokens.current
    val lang = tokens.lang
    val infinite = rememberInfiniteTransition(label = "inAppAlarm")
    val pulse by infinite.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.09f,
        animationSpec = infiniteRepeatable(tween(750), RepeatMode.Reverse),
        label = "pulse"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(tokens.canvasBg.copy(alpha = 0.96f))
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(24.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = lang.t("SIMULASI ALARM LATIHAN", "WORKOUT ALARM PREVIEW"),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.8.sp,
                        color = tokens.accentColor
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = alarm.timeLabel,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 44.sp,
                        color = tokens.palette.onSurface
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(144.dp)
                            .scale(if (tokens.performance.noAnimations) 1f else pulse)
                            .background(tokens.accentColor.copy(alpha = 0.16f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(98.dp)
                                .background(tokens.accentColor, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Alarm,
                                contentDescription = null,
                                tint = tokens.onAccentColor,
                                modifier = Modifier.size(46.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = alarm.focusTitle,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = tokens.palette.onSurface,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = tokens.palette.surfaceContainerHigh,
                        border = BorderStroke(1.dp, tokens.surfaceBorderColor)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Rounded.MusicNote, contentDescription = null, tint = tokens.accentColor, modifier = Modifier.size(14.dp))
                            Text(alarm.ringtoneName, fontSize = 12.sp, color = tokens.palette.onSurface)
                        }
                    }
                }

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onStartWorkout,
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = tokens.accentColor,
                            contentColor = tokens.onAccentColor
                        ),
                        modifier = Modifier.fillMaxWidth().height(54.dp)
                    ) {
                        Icon(Icons.Rounded.FitnessCenter, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(lang.t("Matikan & Mulai Latihan", "Dismiss & Start Workout"), fontWeight = FontWeight.Bold)
                    }
                    OutlinedButton(
                        onClick = onSnooze,
                        shape = RoundedCornerShape(tokens.buttonRadius),
                        border = BorderStroke(1.dp, tokens.surfaceBorderColor),
                        modifier = Modifier.fillMaxWidth().height(48.dp)
                    ) {
                        Icon(Icons.Rounded.Snooze, contentDescription = null, tint = tokens.palette.onSurface)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (lang == AppLanguage.EN) "Snooze $snoozeMinutes Min" else "Tunda $snoozeMinutes Menit",
                            color = tokens.palette.onSurface
                        )
                    }
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text(lang.t("Tutup", "Dismiss"), color = tokens.palette.onSurfaceVariant)
                    }
                }
            }
        }
    }
}
