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
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.eventix.network.ApiRoutes
import com.example.eventix.ui.screens.* // J'ai simplifié les imports ici
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
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

            // --- Surveillance du réseau ---
            val context = this@MainActivity
            val connectivityManager = remember {
                context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            }

            // On utilise un State pour que Compose réagisse aux changements
            val isConnected = remember { mutableStateOf(checkCurrentlyConnected(connectivityManager)) }

            DisposableEffect(Unit) {
                val request = NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build()

                val callback = object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        isConnected.value = true
                    }

                    override fun onLost(network: Network) {
                        isConnected.value = false
                    }

                    override fun onUnavailable() {
                        isConnected.value = false
                    }
                }

                connectivityManager.registerNetworkCallback(request, callback)
                onDispose {
                    try {
                        connectivityManager.unregisterNetworkCallback(callback)
                    } catch (_: Exception) { }
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

            // --- Logique de réaction aux changements d'état réseau ---
            LaunchedEffect(isConnected.value) {
                val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
                val token = prefs.getString("access_token", null)

                if (!isConnected.value) {
                    // PERTE DE RÉSEAU
                    // On navigue vers no_network sans l'empiler plusieurs fois (launchSingleTop)
                    try {
                        val currentRoute = navController.currentDestination?.route
                        if (currentRoute != "no_network") {
                            navController.navigate("no_network") {
                                launchSingleTop = true
                            }
                        }
                    } catch (_: Exception) {}
                } else {
                    // RETOUR DU RÉSEAU
                    // Petit délai pour laisser le temps au réseau d'être vraiment stable (DNS, etc.)
                    // Cela évite le bug où on tente la requête trop vite, elle échoue, et on retourne sur no_network
                    delay(1000)

                    if (token.isNullOrEmpty()) {
                        // Pas de token, direction Login
                        navController.navigate("login") {
                            // On nettoie tout, y compris no_network si on y était
                            popUpTo(0) { inclusive = true }
                        }
                    } else {
                        // Token présent, on valide
                        validateTokenAndNavigate(navController, token)
                    }
                }
            }

            // Vérification initiale au lancement de l'app (hors changement réseau)
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

                    prefs.edit().putString("role", role).apply()

                    withContext(Dispatchers.Main) {
                        // SUCCÈS : On va sur Main
                        navController.navigate("main") {
                            // C'est ici le secret : on nettoie 'no_network' et 'login' de la pile
                            popUpTo("no_network") { inclusive = true }
                            popUpTo("login") { inclusive = true }
                            // Ou plus radical pour nettoyer tout l'historique précédent :
                            // popUpTo(0) { inclusive = true }
                        }
                    }
                } else {
                    // Token invalide ou expiré
                    prefs.edit().remove("access_token").apply()
                    prefs.edit().remove("role").apply()
                    withContext(Dispatchers.Main) {
                        navController.navigate("login") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    val currentRoute = navController.currentDestination?.route
                    if (currentRoute != "no_network") {
                        navController.navigate("no_network") {
                            launchSingleTop = true
                        }
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