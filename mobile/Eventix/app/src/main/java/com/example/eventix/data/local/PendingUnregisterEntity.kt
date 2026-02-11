package com.example.eventix.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_unregister")
data class PendingUnregisterEntity(
    @PrimaryKey
    val eventId: String
)
