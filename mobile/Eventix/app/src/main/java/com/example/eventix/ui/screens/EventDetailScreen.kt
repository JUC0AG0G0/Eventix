package com.example.eventix.ui.screens

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import coil.compose.rememberAsyncImagePainter
import com.example.eventix.network.ApiRoutes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.IOException

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventDetailScreen(navController: NavController, eventId: String, prefs: android.content.SharedPreferences) {
    val context = LocalContext.current
    var eventData by remember { mutableStateOf<JSONObject?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    val role = remember { prefs.getString("role", "") ?: "" }

    LaunchedEffect(eventId) {
        val token = prefs.getString("access_token", null)
        if (token == null) return@LaunchedEffect navigateToMain(navController)

        try {
            val response = withContext(Dispatchers.IO) {
                OkHttpClient().newCall(
                    Request.Builder()
                        .url(ApiRoutes.event(eventId))
                        .addHeader("Authorization", "Bearer $token")
                        .get()
                        .build()
                ).execute()
            }

            if (response.isSuccessful) {
                eventData = response.body?.string()?.let { JSONObject(it) }
            } else {
                navigateToMain(navController)
            }
        } catch (e: IOException) {
            Toast.makeText(context, "Erreur réseau", Toast.LENGTH_SHORT).show()
            navigateToMain(navController)
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("") },
                navigationIcon = {
                    IconButton(onClick = { navigateToMain(navController) }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Retour")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                eventData?.let { data ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        data.optString("Image").takeIf { it.isNotEmpty() }?.let { imageUrl ->
                            Image(
                                painter = rememberAsyncImagePainter(imageUrl),
                                contentDescription = null,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(250.dp),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // Titre de l'événement souligné en orange
                        Text(
                            data.optString("Nom"),
                            style = MaterialTheme.typography.headlineSmall,
                            color = Color.Black
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .height(3.dp)
                                .width(80.dp) // ligne un peu plus longue
                                .background(Color(0xFFFF9800))
                                .align(Alignment.Start)
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        // Section description
                        Text(
                            "Description",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.Black
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Box(
                            modifier = Modifier
                                .height(3.dp)
                                .width(50.dp) // ligne plus courte que le titre
                                .background(Color(0xFFFF9800))
                                .align(Alignment.Start)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(data.optString("Description"), style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(16.dp))

                        Text("Rôle : ${role.ifEmpty { "non défini" }}", style = MaterialTheme.typography.bodyLarge)
                        Spacer(modifier = Modifier.height(12.dp))

                        Spacer(modifier = Modifier.weight(1f)) // pousse le bouton en bas

                        when (role.lowercase()) {
                            "user" -> {
                                Button(
                                    onClick = {
                                        Toast.makeText(context, "Inscription demandée", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFFF9800)
                                    ),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(56.dp)
                                ) {
                                    Text("Inscription")
                                }
                            }

                            "admin" -> {
                                Button(
                                    onClick = { },
                                    enabled = false,
                                    colors = ButtonDefaults.buttonColors(
                                        disabledContainerColor = Color(0xFFFFC107)
                                    ),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(56.dp)
                                ) {
                                    Text("Enregistrer")
                                }
                            }

                            else -> {
                                OutlinedButton(
                                    onClick = { },
                                    enabled = false,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(56.dp)
                                ) {
                                    Text("Action non disponible")
                                }
                            }
                        }
                    }
                } ?: run {
                    Text(
                        "Événement introuvable",
                        modifier = Modifier.align(Alignment.Center),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }
        }
    }
}

private fun navigateToMain(navController: NavController) {
    navController.navigate("main") {
        launchSingleTop = true
        popUpTo(navController.graph.startDestinationId) { saveState = false }
        restoreState = false
    }
}
