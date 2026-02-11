package com.example.eventix.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface EventDao {

    @Query("SELECT * FROM events")
    fun getAllEvents(): Flow<List<EventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(events: List<EventEntity>)

    @Query("DELETE FROM events WHERE id = :eventId")
    suspend fun deleteById(eventId: String)

    @Query("SELECT id FROM events")
    suspend fun getAllEventIds(): List<String>

    @Query("UPDATE events SET alreadyRegister = :value WHERE id = :eventId")
    suspend fun setAlreadyRegister(eventId: String, value: Boolean)
}