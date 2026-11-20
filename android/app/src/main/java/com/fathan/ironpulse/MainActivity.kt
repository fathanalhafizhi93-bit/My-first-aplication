package com.fathan.ironpulse

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.getValue
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import com.fathan.ironpulse.ui.IronPulseRoot
import com.fathan.ironpulse.ui.theme.IronPulseTheme
import com.fathan.ironpulse.ui.viewmodel.GymViewModel
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val viewModel: GymViewModel by viewModels()

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
        // Permission result handled gracefully by AlarmScheduler / RestTimerService
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val state by viewModel.uiState.collectAsStateWithLifecycle()
            IronPulseTheme(
                darkTheme = isSystemInDarkTheme(),
                dynamicColor = true
            ) {
                IronPulseRoot(
                    state = state,
                    viewModel = viewModel,
                    onRequestGoogleSignIn = ::launchGoogleSignIn,
                    onRequestNotificationPermission = ::requestNotificationPermissionIfNeeded,
                    onOpenExactAlarmSettings = ::openExactAlarmSettings
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.refreshDateClock()
    }

    private fun resolveWebClientId(): String {
        val resId = resources.getIdentifier("default_web_client_id", "string", packageName)
        return if (resId != 0) getString(resId) else getString(R.string.default_web_client_id_fallback)
    }

    private fun launchGoogleSignIn() {
        val credentialManager = CredentialManager.create(this)
        val serverClientId = resolveWebClientId()

        lifecycleScope.launch {
            viewModel.setAuthLoading(true)
            viewModel.setAuthError(null)
            try {
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(serverClientId)
                    .setAutoSelectEnabled(false)
                    .build()

                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()

                val response = try {
                    credentialManager.getCredential(this@MainActivity, request)
                } catch (e: NoCredentialException) {
                    val fallbackOption = GetSignInWithGoogleOption.Builder(serverClientId).build()
                    val fallbackRequest = GetCredentialRequest.Builder()
                        .addCredentialOption(fallbackOption)
                        .build()
                    credentialManager.getCredential(this@MainActivity, fallbackRequest)
                }

                val credential = response.credential
                val googleCred = GoogleIdTokenCredential.createFrom(credential.data)
                viewModel.signInWithGoogleToken(googleCred.idToken)
            } catch (_: GetCredentialCancellationException) {
                viewModel.setAuthLoading(false)
                viewModel.setAuthError("Login Google dibatalkan.")
            } catch (e: Exception) {
                viewModel.setAuthLoading(false)
                viewModel.setAuthError(
                    e.localizedMessage ?: "Gagal masuk dengan Google. Pastikan akun Google aktif di perangkat."
                )
            }
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            runCatching {
                startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM))
            }
        }
    }
}
