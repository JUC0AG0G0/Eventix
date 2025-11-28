package com.example.eventix.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
// Assure-toi d'importer ta classe Event utilisée dans l'UI.
// Si elle est dans MainScreen.kt, l'import ressemblera à ça :
import com.example.eventix.ui.screens.Event

@Entity(tableName = "events")
data class EventEntity(
    @PrimaryKey val id: String,
    val nom: String,
    val description: String,
    val image: String,
    val nbPlaceTotal: Int,
    val nbPlaceOccupe: Int,
    val status: String,
    val editDate: String,
    val alreadyRegister: String
)

// --- LA FONCTION DE MAPPING EST ICI ---
// Elle sert de pont entre la Base de Données (Entity) et l'UI (Event)
fun EventEntity.toUiEvent(): Event {
    return Event(
        id = this.id,
        nom = this.nom,
        description = this.description,
        image = this.image,
        nbPlaceTotal = this.nbPlaceTotal,
        nbPlaceOccupe = this.nbPlaceOccupe,
        status = this.status,
        editDate = this.editDate,
        alreadyRegister = this.alreadyRegister
    )
}