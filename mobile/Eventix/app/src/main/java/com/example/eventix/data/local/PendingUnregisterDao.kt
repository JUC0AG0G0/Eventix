package com.example.eventix.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface PendingUnregisterDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: PendingUnregisterEntity)

    @Query("SELECT * FROM pending_unregister")
    suspend fun getAll(): List<PendingUnregisterEntity>

    @Query("DELETE FROM pending_unregister WHERE eventId = :eventId")
    suspend fun deleteById(eventId: String)
}
