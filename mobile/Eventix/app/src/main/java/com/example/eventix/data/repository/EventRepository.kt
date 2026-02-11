package com.example.eventix.data.repository

import android.content.Context
import android.util.Log
import android.widget.Toast
import androidx.room.withTransaction
import com.example.eventix.data.local.AppDatabase
import com.example.eventix.data.local.EventEntity
import com.example.eventix.network.ApiRoutes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

class EventRepository(
    private val context: Context,
    private val db: AppDatabase
) {

    companion object {
        private const val DEFAULT_SYNC_DATE = "1970-11-01T10:30:50.909Z"
    }

    private val client = OkHttpClient()

    suspend fun syncEvents(token: String) = withContext(Dispatchers.IO) {

        try {
            val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
            val lastSyncDate = prefs.getString("date_sync", DEFAULT_SYNC_DATE)!!

            // 🔹 Récupération des IDs locaux
            val localIds = db.eventDao().getAllEventIds()

            val idsCsv = if (localIds.isNotEmpty()) {
                java.net.URLEncoder.encode(
                    localIds.joinToString(","),
                    java.nio.charset.StandardCharsets.UTF_8.toString()
                )
            } else null

            val request = Request.Builder()
                .url(ApiRoutes.EVENT_SYNC(lastSyncDate, idsCsv))
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()

            val response = client.newCall(request).execute()

            if (!response.isSuccessful) throw Exception("Sync failed ${response.code}")

            val body = response.body?.string() ?: return@withContext
            val json = JSONObject(body)

            val newLastSync = json.getString("lastSync")
            val eventsArray = json.getJSONArray("events")
            val removedArray = json.getJSONArray("removedEventIds")

            val entities = mutableListOf<EventEntity>()

            for (i in 0 until eventsArray.length()) {
                val item = eventsArray.getJSONObject(i)

                entities.add(
                    EventEntity(
                        id = item.getString("_id"),
                        nom = item.optString("Nom"),
                        description = item.optString("Description"),
                        image = item.optString("Image"),
                        nbPlaceTotal = item.optInt("nbPlaceTotal"),
                        nbPlaceOccupe = item.optInt("nbPlaceOccupe"),
                        status = item.optString("Status"),
                        editDate = item.optString("EditDate"),
                        alreadyRegister = item.optBoolean("AlreadyRegister", false)
                    )
                )
            }

            db.withTransaction {

                if (entities.isNotEmpty()) {
                    db.eventDao().upsertAll(entities)
                }

                for (i in 0 until removedArray.length()) {
                    db.eventDao().deleteById(removedArray.getString(i))
                }
            }

            prefs.edit().putString("date_sync", newLastSync).apply()

        } catch (e: Exception) {
            Log.e("SYNC", "Error", e)
        }
    }

    suspend fun deleteEventById(eventId: String) {
        withContext(Dispatchers.IO) {
            try {
                Log.d("DELETE_TEST", "Deleting id = $eventId")

                val eventsList = db.eventDao().getAllEvents().first()
                Log.d("DELETE_TEST", "Current events before delete: $eventsList")

                db.eventDao().deleteById(eventId)

                val eventsAfter = db.eventDao().getAllEvents().first()
                Log.d("DELETE_TEST", "Current events after delete: $eventsAfter")

            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Erreur suppression", Toast.LENGTH_SHORT).show()
                }
                e.printStackTrace()
            }
        }
    }
}
