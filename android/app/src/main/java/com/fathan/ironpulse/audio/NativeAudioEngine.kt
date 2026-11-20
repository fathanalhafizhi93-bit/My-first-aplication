package com.fathan.ironpulse.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import com.fathan.ironpulse.model.CustomRingtone
import com.fathan.ironpulse.model.RingtoneStorageMode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Locale
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

class NativeAudioEngine(context: Context) {

    private val appContext = context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private var mediaPlayer: MediaPlayer? = null
    private var activeTrack: AudioTrack? = null
    private var chirpTrack: AudioTrack? = null
    private var loopJob: Job? = null
    private var endJob: Job? = null
    private var playToken: Int = 0

    @Synchronized
    fun stop() {
        playToken += 1
        loopJob?.cancel()
        loopJob = null
        endJob?.cancel()
        endJob = null

        runCatching {
            activeTrack?.pause()
            activeTrack?.flush()
            activeTrack?.release()
        }
        activeTrack = null

        runCatching {
            mediaPlayer?.setOnCompletionListener(null)
            mediaPlayer?.stop()
            mediaPlayer?.release()
        }
        mediaPlayer = null
    }

    fun play(
        ringtoneId: String,
        volume: Float,
        loop: Boolean = false,
        useAlarmStream: Boolean = false,
        customRingtones: List<CustomRingtone> = emptyList(),
        onEnded: (() -> Unit)? = null
    ) {
        stop()
        val token = playToken
        val clampedVol = volume.coerceIn(0f, 1f)

        val custom = customRingtones.firstOrNull { it.id == ringtoneId }
        val localFile = ringtoneLocalFile(appContext, ringtoneId)

        scope.launch {
            if (custom != null || localFile.exists()) {
                val played = playCustomAudioFileOrData(
                    ringtoneId = ringtoneId,
                    custom = custom,
                    localFile = localFile,
                    volume = clampedVol,
                    loop = loop,
                    useAlarmStream = useAlarmStream,
                    token = token,
                    onEnded = onEnded
                )
                if (played) return@launch
            }

            if (token != playToken) return@launch

            val pcm = synthesizeBuiltinBurst(ringtoneId, clampedVol)
            playPcmBurst(pcm, useAlarmStream, token)

            if (loop) {
                loopJob = scope.launch {
                    while (isActive && token == playToken) {
                        delay(1500L)
                        if (token != playToken) break
                        playPcmBurst(pcm, useAlarmStream, token)
                    }
                }
            } else {
                endJob = scope.launch {
                    delay(1300L)
                    if (token == playToken) {
                        withContext(Dispatchers.Main) { onEnded?.invoke() }
                    }
                }
            }
        }
    }

    private fun playCustomAudioFileOrData(
        ringtoneId: String,
        custom: CustomRingtone?,
        localFile: File,
        volume: Float,
        loop: Boolean,
        useAlarmStream: Boolean,
        token: Int,
        onEnded: (() -> Unit)?
    ): Boolean {
        val fileToPlay: File? = when {
            localFile.exists() && localFile.length() > 0L -> localFile
            custom != null && custom.audioDataUrl.startsWith("data:") -> {
                decodeDataUrlToTempFile(ringtoneId, custom.audioDataUrl)
            }
            else -> null
        }

        if (fileToPlay == null || !fileToPlay.exists()) return false
        if (token != playToken) return true

        return runCatching {
            val attrs = AudioAttributes.Builder()
                .setUsage(if (useAlarmStream) AudioAttributes.USAGE_ALARM else AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val player = MediaPlayer().apply {
                setAudioAttributes(attrs)
                setDataSource(fileToPlay.absolutePath)
                isLooping = loop
                setVolume(volume, volume)
                setOnCompletionListener {
                    if (!loop && token == playToken) {
                        scope.launch(Dispatchers.Main) { onEnded?.invoke() }
                    }
                }
                prepare()
                start()
            }
            synchronized(this) {
                if (token != playToken) {
                    runCatching { player.stop(); player.release() }
                } else {
                    mediaPlayer = player
                }
            }
            true
        }.getOrDefault(false)
    }

    private fun decodeDataUrlToTempFile(id: String, dataUrl: String): File? {
        return runCatching {
            val commaIdx = dataUrl.indexOf(',')
            if (commaIdx <= 0) return null
            val base64Part = dataUrl.substring(commaIdx + 1)
            val bytes = Base64.decode(base64Part, Base64.DEFAULT)
            val cacheDir = File(appContext.cacheDir, "ringtone_cache").apply { mkdirs() }
            val out = File(cacheDir, "${id.replace(Regex("[^a-zA-Z0-9_-]"), "_")}.audio")
            out.writeBytes(bytes)
            out
        }.getOrNull()
    }

    @Synchronized
    private fun playPcmBurst(pcm: ShortArray, useAlarmStream: Boolean, token: Int) {
        if (token != playToken || pcm.isEmpty()) return
        runCatching {
            activeTrack?.pause()
            activeTrack?.flush()
            activeTrack?.release()
        }
        activeTrack = null

        runCatching {
            val attrs = AudioAttributes.Builder()
                .setUsage(if (useAlarmStream) AudioAttributes.USAGE_ALARM else AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            val format = AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(SAMPLE_RATE)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .build()
            val track = AudioTrack.Builder()
                .setAudioAttributes(attrs)
                .setAudioFormat(format)
                .setBufferSizeInBytes(pcm.size * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()
            track.write(pcm, 0, pcm.size)
            track.play()
            activeTrack = track
        }
    }

    fun playMascotChirp(variant: String = "ready", volume: Float = 0.85f) {
        scope.launch {
            val pcm = synthesizeChirp(variant, volume.coerceIn(0f, 1f))
            if (pcm.isEmpty()) return@launch
            synchronized(this@NativeAudioEngine) {
                runCatching {
                    chirpTrack?.pause()
                    chirpTrack?.flush()
                    chirpTrack?.release()
                }
                chirpTrack = null
                runCatching {
                    val attrs = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                    val format = AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                    val track = AudioTrack.Builder()
                        .setAudioAttributes(attrs)
                        .setAudioFormat(format)
                        .setBufferSizeInBytes(pcm.size * 2)
                        .setTransferMode(AudioTrack.MODE_STATIC)
                        .build()
                    track.write(pcm, 0, pcm.size)
                    track.play()
                    chirpTrack = track
                }
            }
        }
    }

    private enum class Wave { SINE, TRIANGLE, SQUARE, SAWTOOTH }

    private fun synthesizeBuiltinBurst(toneId: String, volume: Float): ShortArray {
        val totalSeconds = 1.25
        val buffer = DoubleArray((SAMPLE_RATE * totalSeconds).toInt())
        val master = volume.coerceIn(0.05f, 1f).toDouble()

        fun addNote(freq: Double, startSec: Double, durSec: Double, wave: Wave, peakGain: Double) {
            val startIdx = (startSec * SAMPLE_RATE).roundToInt().coerceAtLeast(0)
            val endIdx = min(buffer.size, ((startSec + durSec) * SAMPLE_RATE).roundToInt())
            val attackSamples = (0.015 * SAMPLE_RATE).roundToInt().coerceAtLeast(1)
            val totalSamples = (endIdx - startIdx).coerceAtLeast(1)

            for (i in startIdx until endIdx) {
                val localIdx = i - startIdx
                val t = localIdx.toDouble() / SAMPLE_RATE
                val env = if (localIdx < attackSamples) {
                    localIdx.toDouble() / attackSamples
                } else {
                    val decayFrac = (localIdx - attackSamples).toDouble() / (totalSamples - attackSamples).coerceAtLeast(1)
                    (1.0 - decayFrac) * (1.0 - decayFrac)
                }
                val phase = (t * freq) % 1.0
                val sample = when (wave) {
                    Wave.SINE -> sin(2.0 * PI * phase)
                    Wave.TRIANGLE -> 2.0 * abs(2.0 * phase - 1.0) - 1.0
                    Wave.SQUARE -> if (phase < 0.5) 1.0 else -1.0
                    Wave.SAWTOOTH -> 2.0 * phase - 1.0
                }
                buffer[i] += sample * peakGain * master * env
            }
        }

        when (toneId) {
            "builtin_arena_horn" -> {
                addNote(220.0, 0.0, 0.32, Wave.SAWTOOTH, 0.35)
                addNote(330.0, 0.0, 0.32, Wave.SAWTOOTH, 0.25)
                addNote(440.0, 0.36, 0.55, Wave.SAWTOOTH, 0.40)
            }
            "builtin_digital_pulse" -> {
                listOf(0.0, 0.16, 0.32, 0.60).forEach { offset ->
                    addNote(1046.5, offset, 0.11, Wave.SQUARE, 0.25)
                }
            }
            "builtin_kettlebell_chime" -> {
                addNote(880.0, 0.0, 0.45, Wave.SINE, 0.45)
                addNote(1318.5, 0.08, 0.55, Wave.TRIANGLE, 0.30)
            }
            "builtin_sprint_interval" -> {
                listOf(440.0, 554.37, 659.25, 880.0).forEachIndexed { idx, freq ->
                    addNote(freq, idx * 0.13, 0.22, Wave.TRIANGLE, 0.38)
                }
            }
            else -> { // builtin_athletic_bell
                addNote(784.0, 0.0, 0.28, Wave.TRIANGLE, 0.48)
                addNote(1568.0, 0.0, 0.24, Wave.SINE, 0.20)
                addNote(784.0, 0.32, 0.28, Wave.TRIANGLE, 0.48)
                addNote(1046.5, 0.64, 0.48, Wave.TRIANGLE, 0.52)
            }
        }

        return ShortArray(buffer.size) { idx ->
            (buffer[idx].coerceIn(-0.98, 0.98) * Short.MAX_VALUE).roundToInt().toShort()
        }
    }

    private fun synthesizeChirp(variant: String, volume: Float): ShortArray {
        val totalSeconds = 0.28
        val buffer = DoubleArray((SAMPLE_RATE * totalSeconds).toInt())
        val master = (volume * 0.22f).coerceIn(0.03f, 0.28f).toDouble()

        fun addSweep(fStart: Double, fEnd: Double, offsetSec: Double, durSec: Double, wave: Wave, gainScale: Double) {
            val startIdx = (offsetSec * SAMPLE_RATE).roundToInt().coerceAtLeast(0)
            val endIdx = min(buffer.size, ((offsetSec + durSec) * SAMPLE_RATE).roundToInt())
            val len = (endIdx - startIdx).coerceAtLeast(1)
            val attack = (0.01 * SAMPLE_RATE).roundToInt().coerceAtLeast(1)
            var phaseAcc = 0.0

            for (i in startIdx until endIdx) {
                val local = i - startIdx
                val prog = local.toDouble() / len
                val freq = fStart + (fEnd - fStart) * prog
                phaseAcc = (phaseAcc + freq / SAMPLE_RATE) % 1.0
                val env = if (local < attack) local.toDouble() / attack else (1.0 - prog)
                val sample = when (wave) {
                    Wave.SINE -> sin(2.0 * PI * phaseAcc)
                    Wave.TRIANGLE -> 2.0 * abs(2.0 * phaseAcc - 1.0) - 1.0
                    else -> sin(2.0 * PI * phaseAcc)
                }
                buffer[i] += sample * master * gainScale * env
            }
        }

        when (variant) {
            "celebrate", "milestone" -> {
                addSweep(587.33, 659.25, 0.0, 0.055, Wave.TRIANGLE, 1.0)
                addSweep(783.99, 880.0, 0.065, 0.06, Wave.TRIANGLE, 1.05)
                addSweep(1046.5, 1174.66, 0.135, 0.085, Wave.SINE, 1.1)
            }
            "clap" -> {
                addSweep(659.25, 783.99, 0.0, 0.05, Wave.TRIANGLE, 0.95)
                addSweep(880.0, 987.77, 0.06, 0.07, Wave.SINE, 1.0)
            }
            "rest", "timerActive" -> {
                addSweep(523.25, 587.33, 0.0, 0.055, Wave.SINE, 0.85)
                addSweep(659.25, 698.46, 0.07, 0.065, Wave.SINE, 0.85)
            }
            "restday", "night" -> {
                addSweep(440.0, 493.88, 0.0, 0.065, Wave.SINE, 0.72)
                addSweep(523.25, 554.37, 0.08, 0.075, Wave.SINE, 0.68)
            }
            else -> {
                addSweep(540.0, 680.0, 0.0, 0.048, Wave.TRIANGLE, 0.9)
                addSweep(720.0, 820.0, 0.058, 0.045, Wave.TRIANGLE, 0.95)
                addSweep(640.0, 760.0, 0.115, 0.065, Wave.SINE, 0.85)
            }
        }

        return ShortArray(buffer.size) { idx ->
            (buffer[idx].coerceIn(-0.98, 0.98) * Short.MAX_VALUE).roundToInt().toShort()
        }
    }

    companion object {
        private const val SAMPLE_RATE = 44100
        private const val MAX_FILE_BYTES = 15L * 1024L * 1024L
        private const val MAX_CLOUD_DATA_URL_LEN = 550_000

        fun ringtoneLocalFile(context: Context, ringtoneId: String): File {
            val dir = File(context.applicationContext.filesDir, "ringtones").apply { mkdirs() }
            val safe = ringtoneId.replace(Regex("[^a-zA-Z0-9_-]"), "_")
            return File(dir, "$safe.bin")
        }

        fun deleteLocalRingtoneFile(context: Context, ringtoneId: String) {
            runCatching {
                val f = ringtoneLocalFile(context, ringtoneId)
                if (f.exists()) f.delete()
            }
        }

        suspend fun importAudioFromUri(
            context: Context,
            uri: Uri,
            userId: String,
            ringtoneId: String
        ): Result<CustomRingtone> = withContext(Dispatchers.IO) {
            runCatching {
                val cr = context.contentResolver
                var fileName = "Ringtone Kustom"
                var fileSize = -1L

                cr.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)
                    ?.use { cursor ->
                        if (cursor.moveToFirst()) {
                            val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                            val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
                            if (nameIdx >= 0) fileName = cursor.getString(nameIdx) ?: fileName
                            if (sizeIdx >= 0) fileSize = cursor.getLong(sizeIdx)
                        }
                    }

                val mimeType = (cr.getType(uri) ?: "audio/mpeg").take(60)
                val looksAudio = mimeType.startsWith("audio/") ||
                    Regex("\\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)$", RegexOption.IGNORE_CASE).containsMatchIn(fileName)
                require(looksAudio) { "Format file harus berupa audio (.mp3, .wav, .ogg, .m4a)." }

                if (fileSize > MAX_FILE_BYTES) {
                    throw IllegalArgumentException("Ukuran file maksimal 15 MB.")
                }

                val bytes = cr.openInputStream(uri)?.use { it.readBytes() }
                    ?: throw IllegalStateException("Gagal membaca file audio dari perangkat.")
                if (bytes.size.toLong() > MAX_FILE_BYTES) {
                    throw IllegalArgumentException("Ukuran file maksimal 15 MB.")
                }

                val durationSec = runCatching {
                    val mmr = MediaMetadataRetriever()
                    mmr.setDataSource(context, uri)
                    val ms = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
                    mmr.release()
                    (ms / 1000L).toInt().coerceIn(0, 3600)
                }.getOrDefault(0)

                val cleanName = fileName.replace(Regex("\\.[^/.]+$"), "").trim().take(80).ifEmpty { "Ringtone Kustom" }
                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                val dataUrl = "data:$mimeType;base64,$base64"

                // Save locally regardless so native AlarmReceiver/RestTimer works immediately offline
                ringtoneLocalFile(context, ringtoneId).writeBytes(bytes)

                val isCloud = dataUrl.length <= MAX_CLOUD_DATA_URL_LEN
                CustomRingtone(
                    id = ringtoneId,
                    userId = userId,
                    name = cleanName,
                    mimeType = mimeType,
                    sizeBytes = bytes.size.toLong(),
                    durationSeconds = durationSec,
                    storageMode = if (isCloud) RingtoneStorageMode.CLOUD else RingtoneStorageMode.LOCAL_IDB,
                    audioDataUrl = if (isCloud) dataUrl else ""
                )
            }
        }
    }
}
