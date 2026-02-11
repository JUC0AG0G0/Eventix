package com.example.eventix.ui.screens

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.rememberAsyncImagePainter
import com.example.eventix.network.ApiRoutes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import coil.compose.AsyncImagePainter
import coil.request.ImageRequest
import androidx.compose.foundation.lazy.rememberLazyListState
import com.example.eventix.data.local.AppDatabase
import com.example.eventix.data.local.EventEntity
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

data class Event(
    val id: String,
    val nom: String,
    val description: String,
    val image: String,
    val nbPlaceTotal: Int,
    val nbPlaceOccupe: Int,
    val status: String,
    val editDate: String,
    val alreadyRegister: String
)

@Composable
fun MainScreen(navController: NavController) {
    val context = LocalContext.current
    val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    val token = prefs.getString("access_token", null)

    var events by remember { mutableStateOf(listOf<Event>()) }
    var loading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var currentPage by remember { mutableStateOf(1) }
    var endReached by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = loading)

    suspend fun loadPage(page: Int, reset: Boolean = false) {
        if (token.isNullOrEmpty()) {
            errorMessage = "Token manquant."
            loading = false
            return
        }

        loading = true
        try {
            val result = withContext(Dispatchers.IO) {
                val client = OkHttpClient()
                val request = Request.Builder()
                    .url(ApiRoutes.events(page.toString()))
                    .addHeader("Authorization", "Bearer $token")
                    .get()
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        val errorBody = response.body?.string()
                        throw RuntimeException("Erreur HTTP ${response.code}: ${response.message}\n${errorBody ?: ""}")
                    }
                    response.body?.string() ?: throw RuntimeException("Empty body")
                }
            }

            val json = JSONObject(result)
            val data = json.getJSONArray("data")
            val list = mutableListOf<Event>()
            for (i in 0 until data.length()) {
                val item = data.getJSONObject(i)
                list.add(
                    Event(
                        id = item.getString("_id"),
                        nom = item.getString("Nom"),
                        description = item.getString("Description"),
                        image = item.getString("Image"),
                        nbPlaceTotal = item.getInt("nbPlaceTotal"),
                        nbPlaceOccupe = item.getInt("nbPlaceOccupe"),
                        status = item.getString("Status"),
                        editDate = item.getString("EditDate"),
                        alreadyRegister = item.getString("AlreadyRegister")
                    )
                )
            }

            if (reset) {
                events = list
                currentPage = 1
                endReached = false
            } else {
                events = events + list
            }

            val meta = json.getJSONObject("meta")
            val pageCount = meta.getInt("pageCount")
            endReached = currentPage >= pageCount

        } catch (e: Exception) {
            errorMessage = "Erreur réseau: ${e.message}"
            e.printStackTrace()
        } finally {
            loading = false
        }
    }

    suspend fun syncEvents(context: Context, token: String) {
        val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val db = AppDatabase.getDatabase(context)

        // 1. Récupérer la date ou la valeur par défaut (ISO 8601 très ancienne)
        val lastSyncDate = prefs.getString("date_sync", "1970-11-01T10:30:50.909Z") ?: "1970-11-01T10:30:50.909Z"

        withContext(Dispatchers.IO) {
            try {
                // 2. Préparer la requête
                val client = OkHttpClient()
                // Assure-toi que ApiRoutes.EVENT_SYNC gère le paramètre date correctement
                val url = ApiRoutes.EVENT_SYNC(lastSyncDate)

                val request = Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer $token")
                    .get()
                    .build()

                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Requette de synchro", Toast.LENGTH_SHORT).show()
                }

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        throw RuntimeException("Sync failed: url : ${url} et le reste : ${response.code}")
                    }

                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Successfull", Toast.LENGTH_SHORT).show()
                    }

                    val responseBody = response.body?.string() ?: return@use
                    val json = JSONObject(responseBody)

                    // 3. Parser la réponse
                    val newLastSync = json.getString("lastSync")
                    val eventsArray = json.getJSONArray("events")

                    val entitiesToInsert = mutableListOf<EventEntity>()

                    for (i in 0 until eventsArray.length()) {
                        val item = eventsArray.getJSONObject(i)

                        // Conversion JSON -> Entity
                        entitiesToInsert.add(
                            EventEntity(
                                id = item.getString("_id"),
                                nom = item.getString("Nom"),
                                description = item.getString("Description"),
                                image = item.getString("Image"),
                                nbPlaceTotal = item.getInt("nbPlaceTotal"),
                                nbPlaceOccupe = item.getInt("nbPlaceOccupe"),
                                status = item.getString("Status"),
                                editDate = item.getString("EditDate"),
                                // Attention: l'API renvoie un booléen, ton UI attend un String
                                alreadyRegister = item.optBoolean("AlreadyRegister", false)
                                    .toString()
                            )
                        )
                    }

                    // 4. Sauvegarder dans la DB locale (Upsert)
                    if (entitiesToInsert.isNotEmpty()) {
                        db.eventDao().upsertAll(entitiesToInsert)
                    }

                    // 5. Mettre à jour la date de sync UNIQUEMENT si tout s'est bien passé
                    prefs.edit().putString("date_sync", newLastSync).apply()

                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "synchro fini", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    LaunchedEffect(Unit) {
        if (!token.isNullOrEmpty()) {
            launch(Dispatchers.IO) {
                syncEvents(context, token)
            }
        }
    }

    // Vérification du rôle si manquant
    LaunchedEffect(Unit) {
        checkRoleIfMissing(context, navController, token)
        loadPage(1)
    }

    // Détection du scroll en bas
    LaunchedEffect(listState.firstVisibleItemIndex, listState.layoutInfo.totalItemsCount) {
        val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
        if (lastVisible >= events.size - 3 && !loading && !endReached) {
            currentPage++
            loadPage(currentPage)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp, bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Bonjour",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold
            )

            Button(
                onClick = { logout(context, navController) },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
            ) {
                Text(text = "Déconnexion", color = Color.White)
            }
        }

        SwipeRefresh(
            state = swipeRefreshState,
            onRefresh = {
                scope.launch { loadPage(1, reset = true) }
            }
        ) {
            if (loading && events.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFFFFA500))
                }
            } else if (!errorMessage.isNullOrEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = errorMessage!!)
                }
            } else if (events.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "Aucun événement disponible pour le moment.")
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(top = 24.dp, bottom = 64.dp)
                ) {
                    items(events) { event ->
                        EventCard(event = event, onClick = {
                            navController.navigate("event/${event.id}")
                        }) {
                            // Navigation vers le détail (attention, le détail doit aussi gérer le offline !)
                            navController.navigate("event/${event.id}")
                        }
                    }
                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "Vous avez atteint la fin des événements.",
                            modifier = Modifier.fillMaxWidth(),
                            color = Color.Gray,
                            fontSize = 14.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(40.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun EventCard(event: Event, enabled: Boolean = true, onClick: () -> Unit, function: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled) { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            if (event.image.isNotBlank()) {

                val request = ImageRequest.Builder(LocalContext.current)
                    .data(event.image)
                    .crossfade(true)
                    .build()

                val painter = rememberAsyncImagePainter(model = request)

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .background(Color.LightGray)
                ) {

                    Image(
                        painter = painter,
                        contentDescription = event.nom,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )

                    when (val state = painter.state) {
                        is AsyncImagePainter.State.Loading -> {
                            CircularProgressIndicator(
                                modifier = Modifier.align(Alignment.Center),
                                color = Color(0xFFFFA500)
                            )
                        }

                        is AsyncImagePainter.State.Error -> {
                            val err = state.result.throwable

                            Text(
                                text = "Erreur: ${err?.message ?: err}",
                                color = Color.White,
                                modifier = Modifier
                                    .align(Alignment.Center)
                                    .background(Color(0x99000000))
                                    .padding(8.dp)
                            )
                        }

                        else -> Unit
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(text = event.nom, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = event.description, maxLines = 3, color = Color.DarkGray)
            Spacer(modifier = Modifier.height(8.dp))

            val ratio = if (event.nbPlaceTotal > 0) {
                event.nbPlaceOccupe.toFloat() / event.nbPlaceTotal.toFloat()
            } else 0f

            val clamped = ratio.coerceIn(0f, 1f)
            val statusColor = lerp(Color(0xFF2ECC71), Color(0xFFE74C3C), clamped)

            val isFull = event.nbPlaceOccupe >= event.nbPlaceTotal && event.nbPlaceTotal > 0
            val isRegister = event.alreadyRegister == "true"
            val isCancelled = event.status == "Cancelled"

            val label = when {
                isCancelled -> "Annulé"
                isRegister -> "Inscrit"
                isFull -> "Complet"
                else -> "${event.nbPlaceOccupe} / ${event.nbPlaceTotal} places occupées"
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    fontSize = 12.sp,
                    color = statusColor
                )

                Spacer(modifier = Modifier.width(8.dp))

                if (!isFull) {
                    LinearProgressIndicator(
                        progress = clamped,
                        modifier = Modifier
                            .height(8.dp)
                            .fillMaxWidth(),
                        color = statusColor
                    )
                }
            }
        }
    }
}

private suspend fun checkRoleIfMissing(
    context: Context,
    navController: NavController,
    token: String?
) {
    if (token.isNullOrEmpty()) {
        navController.navigate("login") {
            popUpTo("login") { inclusive = true }
        }
        return
    }

    val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    val existingRole = prefs.getString("role", null)

    if (!existingRole.isNullOrEmpty()) return

    try {
        val client = OkHttpClient()
        val request = Request.Builder()
            .url(ApiRoutes.USER_ME)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()

        val response = withContext(Dispatchers.IO) { client.newCall(request).execute() }

        if (response.isSuccessful) {
            val body = response.body?.string()
            if (!body.isNullOrEmpty()) {
                val json = JSONObject(body)
                val role = json.optString("role", "")
                if (role.isNotEmpty()) {
                    prefs.edit().putString("role", role).apply()
                }
            }
        } else {
            if (response.code == 401) {
                prefs.edit().remove("access_token").apply()
                prefs.edit().remove("role").apply()
                navController.navigate("login") {
                    popUpTo("main") { inclusive = true }
                }
            }
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun logout(context: Context, navController: NavController) {
    val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    prefs.edit().remove("access_token").apply()
    prefs.edit().remove("role").apply()

    navController.navigate("login") {
        popUpTo("main") { inclusive = true }
    }
}
