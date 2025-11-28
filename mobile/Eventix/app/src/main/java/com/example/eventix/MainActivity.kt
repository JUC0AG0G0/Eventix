package com.example.eventix

import android.annotation.SuppressLint
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.eventix.network.ApiRoutes
import com.example.eventix.ui.screens.EventDetailScreen
import com.example.eventix.ui.screens.LoginScreen
import com.example.eventix.ui.screens.InscriptionScreen
import com.example.eventix.ui.screens.LoadingScreen
import com.example.eventix.ui.screens.MainScreen
import com.example.eventix.ui.screens.NoNetworkScreen
import com.example.eventix.ui.screens.SuccessScreen
import com.example.eventix.ui.screens.SuccessType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    @SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val navController = rememberNavController()

            // --- Surveillance du réseau (Compose-friendly) ---
            val context = this@MainActivity
            val connectivityManager =
                context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

            val isConnected = remember { mutableStateOf(checkCurrentlyConnected(connectivityManager)) }

            // Register/unregister network callback in a DisposableEffect so lifecycle is handled
            DisposableEffect(Unit) {
                val request = NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build()

                val callback = object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        isConnected.value = true
                    }

                    override fun onLost(network: Network) {
                        isConnected.value = checkCurrentlyConnected(connectivityManager)
                    }

                    override fun onUnavailable() {
                        isConnected.value = false
                    }
                }

                connectivityManager.registerNetworkCallback(request, callback)

                onDispose {
                    try {
                        connectivityManager.unregisterNetworkCallback(callback)
                    } catch (_: Exception) { /* ignore */ }
                }
            }

            Scaffold(modifier = Modifier.fillMaxSize()) {
                NavHost(
                    navController = navController,
                    startDestination = "loader"
                ) {
                    composable("loader") { LoadingScreen(navController) }
                    composable("login") { LoginScreen(navController) }
                    composable("inscription") { InscriptionScreen(navController) }
                    composable("main") { MainScreen(navController) }
                    composable("no_network") { NoNetworkScreen(navController) }
                    composable(
                        route = "event/{eventId}",
                        arguments = listOf(navArgument("eventId") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val eventId = backStackEntry.arguments?.getString("eventId") ?: ""
                        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
                        EventDetailScreen(navController = navController, eventId = eventId, prefs = prefs)
                    }
                    composable("success/{type}", arguments = listOf(navArgument("type") { type = NavType.StringType })) { backStackEntry ->
                        val raw = backStackEntry.arguments?.getString("type") ?: SuccessType.REGISTRATION.name
                        val type = try { SuccessType.valueOf(raw) } catch (e: Exception) { SuccessType.REGISTRATION }
                        SuccessScreen(navController = navController, successType = type)
                    }
                }
            }

            LaunchedEffect(isConnected.value) {
                val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
                val token = prefs.getString("access_token", null)

                if (!isConnected.value) {
                    // Coupure réseau : montrer NoNetwork
                    navController.navigate("no_network") {
                        popUpTo(0) { inclusive = false }
                    }
                } else {
                    if (token.isNullOrEmpty()) {
                        navController.navigate("login") {
                            popUpTo("login") { inclusive = true }
                        }
                    } else {
                        // Validation du token
                        validateTokenAndNavigate(navController, token)
                    }
                }
            }

            LaunchedEffect(Unit) {
                if (isConnected.value) {
                    checkAccessTokenOnStart(navController)
                }
            }
        }
    }

    private fun checkAccessTokenOnStart(navController: androidx.navigation.NavController) {
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val token = prefs.getString("access_token", null)

        if (token.isNullOrEmpty()) {
            navController.navigate("login") {
                popUpTo("login") { inclusive = true }
            }
            return
        }

        validateTokenAndNavigate(navController, token)
    }

    private fun validateTokenAndNavigate(navController: androidx.navigation.NavController, token: String) {
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val client = OkHttpClient()
                val request = Request.Builder()
                    .url(ApiRoutes.USER_ME)
                    .addHeader("Authorization", "Bearer $token")
                    .get()
                    .build()

                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    val role = JSONObject(responseBody ?: "{}").optString("role", "")

                    prefs.edit()
                        .putString("role", role)
                        .apply()

                    withContext(Dispatchers.Main) {
                        navController.navigate("main") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                } else {
                    prefs.edit().remove("access_token").apply()
                    prefs.edit().remove("role").apply()
                    withContext(Dispatchers.Main) {
                        navController.navigate("login") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                }
            } catch (e: Exception) {
                // Si erreur réseau ici, on interprète comme perte de connexion : montrer no_network
                withContext(Dispatchers.Main) {
                    navController.navigate("no_network") {
                        popUpTo(0) { inclusive = false }
                    }
                }
            }
        }
    }

    private fun checkCurrentlyConnected(connectivityManager: ConnectivityManager): Boolean {
        val active = connectivityManager.activeNetwork ?: return false
        val caps = connectivityManager.getNetworkCapabilities(active) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
