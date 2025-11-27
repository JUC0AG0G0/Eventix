package com.example.eventix.ui.screens

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import coil.compose.rememberAsyncImagePainter
import com.example.eventix.network.ApiRoutes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventDetailScreen(navController: NavController, eventId: String, prefs: android.content.SharedPreferences) {
    val context = LocalContext.current
    var eventData by remember { mutableStateOf<JSONObject?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    // Nouveaux états pour l'inscription
    var isRegistering by remember { mutableStateOf(false) }
    var showConfirmDialog by remember { mutableStateOf(false) }

    // scope pour lancer des coroutines depuis des handlers (onClick, etc.)
    val coroutineScope = rememberCoroutineScope()

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

    // Fonction locale pour appeler l'API d'inscription (utilise les extensions modernes)
    suspend fun performRegistration(): Pair<Boolean, String?> {
        val token = prefs.getString("access_token", null) ?: return Pair(false, "Token manquant")
        return try {
            val client = OkHttpClient()
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val bodyJson = JSONObject().put("id", eventId).toString()
            val body = bodyJson.toRequestBody(mediaType)

            val request = Request.Builder()
                .url(ApiRoutes.EVENT_REGISTER)
                .addHeader("Authorization", "Bearer $token")
                .post(body)
                .build()

            val resp = withContext(Dispatchers.IO) { client.newCall(request).execute() }
            if (resp.isSuccessful) {
                Pair(true, null)
            } else {
                val msg = resp.body?.string()?.takeIf { it.isNotBlank() } ?: "Erreur serveur ${resp.code}"
                Pair(false, msg)
            }
        } catch (e: Exception) {
            Pair(false, e.message ?: "Erreur réseau")
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

                        Text(
                            data.optString("Nom"),
                            style = MaterialTheme.typography.headlineSmall,
                            color = Color.Black
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .height(3.dp)
                                .width(80.dp)
                                .background(Color(0xFFFF9800))
                                .align(Alignment.Start)
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            "Description",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.Black
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Box(
                            modifier = Modifier
                                .height(3.dp)
                                .width(50.dp)
                                .background(Color(0xFFFF9800))
                                .align(Alignment.Start)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(data.optString("Description"), style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(16.dp))

                        Spacer(modifier = Modifier.weight(1f))

                        // --- LOGIQUE D'ACTIVATION DU BOUTON ---
                        val status = data.optString("Status", "").lowercase() // ex: "ok", "full", "cancelled"
                        val alreadyRegistered = data.optBoolean("AlreadyRegister", false)
                        val canRegister = status == "ok" && !alreadyRegistered && !isRegistering

                        when (role.lowercase()) {
                            "user" -> {
                                // Bouton principal
                                Button(
                                    onClick = {
                                        if (canRegister) showConfirmDialog = true
                                    },
                                    enabled = canRegister,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFFF9800),
                                        disabledContainerColor = Color(0xFFE0A85A)
                                    ),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(56.dp),
                                    shape = RoundedCornerShape(12.dp),
                                ) {
                                    if (isRegistering) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Inscription…")
                                    } else {
                                        Text(
                                            when {
                                                alreadyRegistered -> "Déjà inscrit"
                                                status != "ok" -> when (status) {
                                                    "full", "complet" -> "Complet"
                                                    "cancelled", "annulé" -> "Annulé"
                                                    else -> "Inscription indisponible"
                                                }
                                                else -> "S'inscrire"
                                            }
                                        )
                                    }
                                }

                                // Dialog de confirmation
                                if (showConfirmDialog) {
                                    AlertDialog(
                                        onDismissRequest = { if (!isRegistering) showConfirmDialog = false },
                                        title = { Text("Confirmer l'inscription") },
                                        text = { Text("Voulez-vous confirmer votre inscription à \"${data.optString("Nom")}\" ?") },
                                        confirmButton = {
                                            Button(
                                                onClick = {
                                                    showConfirmDialog = false
                                                    isRegistering = true
                                                    coroutineScope.launch {
                                                        val (ok, errorMsg) = performRegistration()
                                                        isRegistering = false
                                                        if (ok) {
                                                            try {
                                                                eventData = JSONObject(data.toString()).put("AlreadyRegister", true)
                                                            } catch (_: Exception) {}
                                                            navController.navigate(successRouteFor(SuccessType.REGISTRATION))
                                                        } else {
                                                            Toast.makeText(context, "Erreur : $errorMsg", Toast.LENGTH_LONG).show()
                                                        }
                                                    }
                                                },
                                                enabled = !isRegistering,
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = Color(0xFFFF9800),
                                                    contentColor = Color.White
                                                )
                                            ) {
                                                Text("Confirmer")
                                            }
                                        },
                                        dismissButton = {
                                            Button(
                                                onClick = { showConfirmDialog = false },
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = Color(0xFFFF9800),
                                                    contentColor = Color.White
                                                )
                                            ) {
                                                Text("Annuler")
                                            }
                                        }
                                    )
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
                                        .height(56.dp),
                                    shape = RoundedCornerShape(12.dp),
                                ) {
                                    Text("Enregistrer")
                                }
                            }

                            else -> {
                                // rôle inconnu : retourne au main
                                LaunchedEffect(Unit) { navigateToMain(navController) }
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
