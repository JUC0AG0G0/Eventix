package com.example.eventix.ui.screens

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.eventix.data.local.AppDatabase
import com.example.eventix.data.local.toUiEvent
import com.example.eventix.data.repository.EventRepository
import kotlinx.coroutines.launch

@Composable
fun NoNetworkScreen(navController: NavController) {
    val context = LocalContext.current
    val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    // 1. Vérification des accès
    val token = prefs.getString("access_token", null)
    val role = prefs.getString("role", null)
    val isConnected = !token.isNullOrEmpty() && !role.isNullOrEmpty()

    // 2. Connexion à la DB locale
    // On utilise remember pour ne pas recréer l'instance à chaque recomposition
    val db = remember { AppDatabase.getDatabase(context) }

    // 3. Observation des données (Flow -> State)
    // "initial = emptyList()" permet d'avoir une liste vide le temps que ça charge
    val localEventsState by db.eventDao().getAllEvents().collectAsState(initial = emptyList())

    // On récupère la DB et on initialise le repository
    val repository = remember { EventRepository(context, db) }

    // Création d'un scope pour lancer des fonctions suspendues (coroutines)
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // En-tête "Mode Hors Connexion"
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFCC0000)) // Rouge pour signaler l'état hors ligne
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Mode Hors Connexion",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        }

        if (isConnected) {
            if (localEventsState.isEmpty()) {
                // Cas : Connecté mais base de données vide
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Aucun événement synchronisé.\nConnectez-vous à internet pour mettre à jour.",
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        color = Color.Gray
                    )
                }
            } else {
                // Cas : Connecté et données présentes -> On affiche la liste
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // On convertit les entités DB en objets UI
                    val uiEvents = localEventsState.map { it.toUiEvent() }

                    items(uiEvents) { event ->
                        // On réutilise ta EventCard existante
                        EventCard(event = event, enabled = true, onClick = {
                            try {
                                scope.launch {
                                    // Ici, on peut appeler la fonction suspendue sans erreur
                                    repository.saveUnregisterRequest(event.id)

                                    // On affiche le Toast pour confirmer
                                    android.widget.Toast.makeText(
                                        context,
                                        "Désinscription locale : ${event.id}",
                                        android.widget.Toast.LENGTH_SHORT
                                    ).show()
                                }

                            } catch (e: Exception) {
                                android.widget.Toast.makeText(
                                    context,
                                    "Erreur lors de la sauvegarde",
                                    android.widget.Toast.LENGTH_SHORT
                                ).show()
                            }
                        }) {
                            // Navigation vers le détail (attention, le détail doit aussi gérer le offline !)
                            navController.navigate("event/${event.id}")
                        }
                    }
                }
            }
        } else {
            // Cas : Pas de token (Utilisateur déconnecté)
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = androidx.compose.material.icons.Icons.Default.CloudOff, // Nécessite l'import Icons
                        contentDescription = "Offline",
                        modifier = Modifier.size(64.dp),
                        tint = Color.Gray
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Vous n'êtes pas connecté.",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}