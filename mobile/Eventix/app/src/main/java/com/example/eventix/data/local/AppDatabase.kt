package com.example.eventix.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        EventEntity::class,
        PendingUnregisterEntity::class   // ← TU AS OUBLIÉ ÇA
    ],
    version = 2, // ← augmente la version
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun eventDao(): EventDao
    abstract fun pendingUnregisterDao(): PendingUnregisterDao

    companion object {

        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {

                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "eventix_db"
                )
                    .fallbackToDestructiveMigration() // safe pour dev
                    .build()

                INSTANCE = instance
                instance
            }
        }
    }
}
