package com.example.eventix.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface EventDao {
    // Récupère tous les événements pour l'affichage (optionnel si tu veux afficher le cache)
    @Query("SELECT * FROM events")
    fun getAllEvents(): Flow<List<EventEntity>>

    // Insert ou Met à jour (REPLACE) si l'ID existe déjà. C'est la clé de ton système de "correction"
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(events: List<EventEntity>)

    @Query("DELETE FROM events WHERE id = :eventId")
    suspend fun deleteById(eventId: String)

    @Query("SELECT id FROM events")
    suspend fun getAllEventIds(): List<String>
}