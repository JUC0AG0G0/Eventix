package com.example.eventix

import android.annotation.SuppressLint
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

class MainActivity : ComponentActivity() {
    @SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val navController = rememberNavController()

            Scaffold(modifier = Modifier.fillMaxSize()) {
                NavHost(
                    navController = navController,
                    startDestination = "loader"
                ) {
                    composable("loader") { LoadingScreen(navController) }
                    composable("login") { LoginScreen(navController) }
                    composable("inscription") { InscriptionScreen(navController) }
                    composable("main") { MainScreen(navController) }
                    composable(
                        route = "event/{eventId}",
                        arguments = listOf(navArgument("eventId") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val eventId = backStackEntry.arguments?.getString("eventId") ?: ""
                        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
                        EventDetailScreen(navController = navController, eventId = eventId, prefs = prefs)
                    }
                }
            }
            LaunchedEffect(Unit) {
                checkAccessToken(navController)
            }
        }

    }

    private fun checkAccessToken(navController: androidx.navigation.NavController) {
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val token = prefs.getString("access_token", null)

        if (token.isNullOrEmpty()) {
            // Pas de token → login
            navController.navigate("login") {
                popUpTo("login") { inclusive = true }
            }
            return
        }

        // Token présent → vérification via /users/me
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val request = Request.Builder()
                    .url(ApiRoutes.USER_ME)
                    .addHeader("Authorization", "Bearer $token")
                    .get()
                    .build()

                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    // Token valide → MainScreen
                    withContext(Dispatchers.Main) {
                        navController.navigate("main") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                } else {
                    // Token invalide ou expiré → supprimer et login
                    prefs.edit().remove("access_token").apply()
                    withContext(Dispatchers.Main) {
                        navController.navigate("login") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                }

            } catch (e: Exception) {
                // Erreur réseau → supprimer token et login
                prefs.edit().remove("access_token").apply()
                withContext(Dispatchers.Main) {
                    navController.navigate("login") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            }
        }
    }
}
