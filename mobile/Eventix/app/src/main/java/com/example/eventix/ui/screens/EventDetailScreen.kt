package com.example.eventix.ui.screens

import android.util.Log
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Delete
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import coil.compose.rememberAsyncImagePainter
import com.example.eventix.data.local.AppDatabase
import com.example.eventix.data.repository.EventRepository
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

    // états pour admin (modification nombre de places)
    var isUpdatingCapacity by remember { mutableStateOf(false) }
    var capacityDirty by remember { mutableStateOf(false) } // devient true si admin modifie la valeur

    // états locaux de places (initialisés une fois eventData chargé)
    var nbPlaceTotalState by remember { mutableStateOf(1) }
    var nbPlaceOccupeState by remember { mutableStateOf(0) }

    // Nouveaux états pour suppression
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var isDeleting by remember { mutableStateOf(false) }

    // scope pour lancer des coroutines depuis des handlers (onClick, etc.)
    val coroutineScope = rememberCoroutineScope()

    val role = remember { prefs.getString("role", "") ?: "" }

    var isUnregistering by remember { mutableStateOf(false) }
    var showUnregisterConfirmDialog by remember { mutableStateOf(false) }

    val db = AppDatabase.getDatabase(context)
    val repository = EventRepository(context, db)


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
                response.body?.string()?.let {
                    eventData = JSONObject(it)
                    // initialisation des états liés aux places si présents dans le JSON
                    val total = eventData?.optInt("nbPlaceTotal", 1) ?: 1
                    val occ = eventData?.optInt("nbPlaceOccupe", 0) ?: 0
                    nbPlaceTotalState = if (total >= 1) total else 1
                    nbPlaceOccupeState = if (occ >= 0) occ else 0
                }
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

    // isCancelled calculé à chaque recomposition à partir de eventData (supporte "cancelled" et "annulé")
    val isCancelled = remember(eventData) {
        val status = eventData?.optString("Status", "") ?: ""
        status.equals("cancelled", ignoreCase = true) || status.equals("annulé", ignoreCase = true)
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

    suspend fun performUpdateCapacity(newTotal: Int): Pair<Boolean, String?> {
        val token = prefs.getString("access_token", null) ?: return Pair(false, "Token manquant")
        return try {
            val client = OkHttpClient()
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val bodyJson = JSONObject()
                .put("nbplace", newTotal)
                .toString()
            val body = bodyJson.toRequestBody(mediaType)

            val request = Request.Builder()
                .url(ApiRoutes.updateEventCapacity(eventId))
                .addHeader("Authorization", "Bearer $token")
                .patch(body)
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

    suspend fun performUnregister(): Pair<Boolean, String?> {
        val token = prefs.getString("access_token", null) ?: return Pair(false, "Token manquant")
        return try {
            val client = OkHttpClient()
            val mediaType = "application/json; charset=utf-8".toMediaType()

            val bodyJson = JSONObject()
                .put("id", eventId)
                .toString()

            val body = bodyJson.toRequestBody(mediaType)

            val request = Request.Builder()
                .url(ApiRoutes.EVENT_UNREGISTER)
                .addHeader("Authorization", "Bearer $token")
                .post(body)
                .build()

            val resp = withContext(Dispatchers.IO) { client.newCall(request).execute() }

            if (resp.isSuccessful) {

                Log.d("DELETE_TEST_screen", "Deleting id = $eventId")
                repository.deleteEventById(eventId)
                Pair(true, null)
            } else {
                val msg = resp.body?.string()?.takeIf { it.isNotBlank() }
                    ?: "Erreur serveur ${resp.code}"
                Pair(false, msg)
            }

        } catch (e: Exception) {
            Pair(false, e.message ?: "Erreur réseau")
        }
    }

    suspend fun performDeleteEvent(): Pair<Boolean, String?> {
        val token = prefs.getString("access_token", null) ?: return Pair(false, "Token manquant")
        return try {
            val client = OkHttpClient()
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val emptyBody = "".toRequestBody(mediaType)
            val request = Request.Builder()
                .url(ApiRoutes.deleteEvent(eventId))
                .addHeader("Authorization", "Bearer $token")
                .delete(emptyBody)
                .build()

            val resp = withContext(Dispatchers.IO) { client.newCall(request).execute() }
            if (resp.isSuccessful && resp.code == 200) {
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
                },
                actions = {
                    if (role.lowercase() == "admin") {
                        // visible mais désactivé si isCancelled
                        IconButton(
                            onClick = {
                                if (!isCancelled) {
                                    showDeleteConfirm = true
                                }
                            },
                            enabled = !isCancelled
                        ) {
                            Icon(Icons.Filled.Delete, contentDescription = "Supprimer l'événement")
                        }
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

                        // --- Section admin: compteur nb places + boutons + Enregistrer ---
                        if (role.lowercase() == "admin") {
                            // calcul du minimum autorisé : >= 1 et >= nbPlaceOccupeState
                            val minAllowed = maxOf(1, nbPlaceOccupeState)

                            // Affichage du compteur
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                IconButton(
                                    onClick = {
                                        if (!isCancelled) {
                                            val newVal = (nbPlaceTotalState - 1).coerceAtLeast(minAllowed)
                                            if (newVal != nbPlaceTotalState) {
                                                nbPlaceTotalState = newVal
                                                capacityDirty = true
                                            }
                                        }
                                    },
                                    enabled = !isCancelled && nbPlaceTotalState > minAllowed
                                ) {
                                    Icon(Icons.Filled.Remove, contentDescription = "Diminuer")
                                }

                                Spacer(modifier = Modifier.width(8.dp))

                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "${nbPlaceOccupeState}/${nbPlaceTotalState}",
                                        style = MaterialTheme.typography.titleLarge
                                    )
                                    Text(
                                        text = "places occupées / total",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }

                                Spacer(modifier = Modifier.width(8.dp))

                                IconButton(
                                    onClick = {
                                        if (!isCancelled) {
                                            nbPlaceTotalState = nbPlaceTotalState + 1
                                            capacityDirty = true
                                        }
                                    },
                                    enabled = !isCancelled
                                ) {
                                    Icon(Icons.Filled.Add, contentDescription = "Augmenter")
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Bouton Enregistrer (admin)
                            Button(
                                onClick = {
                                    if (!isCancelled) {
                                        // Appel API pour sauvegarder la nouvelle capacité
                                        isUpdatingCapacity = true
                                        coroutineScope.launch {
                                            val (ok, errorMsg) = performUpdateCapacity(nbPlaceTotalState)
                                            isUpdatingCapacity = false
                                            if (ok) {
                                                // Mettre à jour localement eventData pour refléter le changement
                                                try {
                                                    eventData = JSONObject(data.toString()).put("NbPlaceTotal", nbPlaceTotalState)
                                                    capacityDirty = false
                                                } catch (_: Exception) {}
                                                // Navigation vers page success — adapte la route si tu as une util spécifique
                                                navController.navigate(successRouteFor(SuccessType.UPDATE))
                                            } else {
                                                Toast.makeText(context, "Erreur : $errorMsg", Toast.LENGTH_LONG).show()
                                            }
                                        }
                                    }
                                },
                                enabled = capacityDirty && !isUpdatingCapacity && !isCancelled,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (capacityDirty && !isCancelled) Color(0xFFFF9800) else Color(0xFFE0A85A),
                                    disabledContainerColor = Color(0xFFE0A85A)
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                if (isUpdatingCapacity) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Enregistrement…")
                                } else {
                                    Text("Enregistrer")
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // --- LOGIQUE D'ACTIVATION DU BOUTON POUR 'user' ---
                        val status = data.optString("Status", "").lowercase() // ex: "ok", "full", "cancelled"
                        val alreadyRegistered = data.optBoolean("AlreadyRegister", false)
                        val canRegister = status == "ok" && !alreadyRegistered && !isRegistering
                        val canUnregister = alreadyRegistered && !isUnregistering

                        when (role.lowercase()) {
                            "user" -> {
                                // Bouton principal pour user
                                Button(
                                    onClick = {
                                        when {
                                            alreadyRegistered -> showUnregisterConfirmDialog = true
                                            canRegister -> showConfirmDialog = true
                                        }
                                    },
                                    enabled = canRegister || canUnregister,
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
                                                status.equals("cancelled", ignoreCase = true)
                                                        || status.equals("annulé", ignoreCase = true) ->
                                                    "Annulé"

                                                alreadyRegistered ->
                                                    "Se désinscrire"

                                                status.equals("full", ignoreCase = true)
                                                        || status.equals("complet", ignoreCase = true) ->
                                                    "Complet"

                                                status != "ok" ->
                                                    "Inscription indisponible"

                                                else ->
                                                    "S'inscrire"
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
                                if (showUnregisterConfirmDialog) {
                                    AlertDialog(
                                        onDismissRequest = { if (!isUnregistering) showUnregisterConfirmDialog = false },
                                        title = { Text("Confirmer la désinscription") },
                                        text = { Text("Voulez-vous vous désinscrire de \"${data.optString("Nom")}\" ?") },
                                        confirmButton = {
                                            Button(
                                                onClick = {
                                                    showUnregisterConfirmDialog = false
                                                    isUnregistering = true

                                                    coroutineScope.launch {
                                                        val (ok, errorMsg) = performUnregister()
                                                        isUnregistering = false

                                                        if (ok) {
                                                            try {
                                                                eventData = JSONObject(data.toString())
                                                                    .put("AlreadyRegister", false)
                                                            } catch (_: Exception) {}

                                                            navController.navigate(successRouteFor(SuccessType.CANCELLATION))
                                                        } else {
                                                            Toast.makeText(context, "Erreur : $errorMsg", Toast.LENGTH_LONG).show()
                                                        }
                                                    }
                                                },
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
                                                onClick = { showUnregisterConfirmDialog = false }
                                            ) {
                                                Text("Annuler")
                                            }
                                        }
                                    )
                                }
                            }

                            "admin" -> {
                                // pour admin, le bouton Enregistrer est géré plus haut (après le compteur)
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

        // --- Dialog de confirmation pour la suppression (accessible depuis l'IconButton poubelle) ---
        if (showDeleteConfirm) {
            AlertDialog(
                onDismissRequest = { if (!isDeleting) showDeleteConfirm = false },
                title = { Text("Supprimer l'événement") },
                text = { Text("Voulez-vous vraiment supprimer l'événement \"${eventData?.optString("Nom") ?: ""}\" ? Cette action est irréversible.") },
                confirmButton = {
                    Button(
                        onClick = {
                            // lancer la suppression
                            isDeleting = true
                            coroutineScope.launch {
                                val (ok, errorMsg) = performDeleteEvent()
                                isDeleting = false
                                showDeleteConfirm = false
                                if (ok) {
                                    // redirige vers la page success cancellation
                                    navController.navigate(successRouteFor(SuccessType.CANCELLATION))
                                } else {
                                    Toast.makeText(context, "Erreur : $errorMsg", Toast.LENGTH_LONG).show()
                                }
                            }
                        },
                        enabled = !isDeleting,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFFF9800),
                            contentColor = Color.White
                        )
                    ) {
                        if (isDeleting) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Suppression…")
                        } else {
                            Text("Supprimer")
                        }
                    }
                },
                dismissButton = {
                    Button(
                        onClick = { if (!isDeleting) showDeleteConfirm = false },
                        enabled = !isDeleting,
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
}

private fun navigateToMain(navController: NavController) {
    navController.navigate("main") {
        launchSingleTop = true
        popUpTo(navController.graph.startDestinationId) { saveState = false }
        restoreState = false
    }
}
