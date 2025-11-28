package com.example.eventix.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

/**
 * Ecran générique de succès.
 * - Utilise NavController
 * - Reçoit un paramètre SuccessType (via route ou appel direct)
 * - Affiche une image et un texte dépendant du type
 * - Bouton orange en bas: "Retour à la liste des événements"
 */

enum class SuccessType(val title: String, val drawableResName: String) {
    REGISTRATION("Inscription réussie", "ic_register"),
    UPDATE("Nombre de place modifié", "ic_update"),
    CANCELLATION("Evenement annulé", "ic_delete")
}

// Route helper pour la navigation par chaîne
fun successRouteFor(type: SuccessType) = "success/${type.name}"

@Composable
fun SuccessScreen(
    navController: NavController,
    successType: SuccessType,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Image: on utilise painterResource; assurez-vous d'avoir les drawables correspondants
            val drawableName = successType.drawableResName
            val resId = rememberDrawableIdByName(drawableName)

            if (resId != 0) {
                Image(
                    painter = painterResource(id = resId),
                    contentDescription = successType.title,
                    modifier = Modifier
                        .size(160.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = successType.title,
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold
                ),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = when (successType) {
                    SuccessType.REGISTRATION -> "Merci ! Ton inscription a bien été prise en compte."
                    SuccessType.UPDATE -> "Le nombre de place de cette événement a bien été mis a jour"
                    SuccessType.CANCELLATION -> "L'annulation/suppression de l'événement a bien été éffectué."
                },
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }

        // Bouton fixe en bas
        Button(
            onClick = {
                // Naviguer vers la liste des événements
                navController.navigate("main") {
                    // Eviter d'empiler des écrans identiques
                    popUpTo("main") { inclusive = true }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .align(Alignment.BottomCenter),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF9800))
        ) {
            Text(
                text = "Retour à la liste des événements",
                color = Color.White,
                fontWeight = FontWeight.Medium,
                fontSize = 16.sp
            )
        }
    }
}

@Composable
private fun rememberDrawableIdByName(name: String): Int {
    val ctx = LocalContext.current
    // remember pour éviter des recherches répétées
    return remember(name) {
        ctx.resources.getIdentifier(name, "drawable", ctx.packageName)
    }
}
