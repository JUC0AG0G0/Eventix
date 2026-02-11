package com.example.eventix.data.repository

import android.content.Context
import android.util.Log
import android.widget.Toast
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

    private val client = OkHttpClient()

    suspend fun syncEvents(token: String) {

        val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

        val lastSyncDate =
            prefs.getString("date_sync", "1970-11-01T10:30:50.909Z")
                ?: "1970-11-01T10:30:50.909Z"

        withContext(Dispatchers.IO) {
            try {

                val url = ApiRoutes.EVENT_SYNC(lastSyncDate)

                val request = Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer $token")
                    .get()
                    .build()

                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Requête de synchro", Toast.LENGTH_SHORT).show()
                }

                client.newCall(request).execute().use { response ->

                    if (!response.isSuccessful) {
                        throw RuntimeException("Sync failed : ${response.code}")
                    }

                    val responseBody = response.body?.string() ?: return@use
                    val json = JSONObject(responseBody)

                    val newLastSync = json.getString("lastSync")
                    val eventsArray = json.getJSONArray("events")

                    val entities = mutableListOf<EventEntity>()

                    for (i in 0 until eventsArray.length()) {

                        val item = eventsArray.getJSONObject(i)

                        entities.add(
                            EventEntity(
                                id = item.getString("_id"),
                                nom = item.getString("Nom"),
                                description = item.getString("Description"),
                                image = item.getString("Image"),
                                nbPlaceTotal = item.getInt("nbPlaceTotal"),
                                nbPlaceOccupe = item.getInt("nbPlaceOccupe"),
                                status = item.getString("Status"),
                                editDate = item.getString("EditDate"),
                                alreadyRegister = item
                                    .optBoolean("AlreadyRegister", false)
                                    .toString()
                            )
                        )
                    }

                    if (entities.isNotEmpty()) {
                        db.eventDao().upsertAll(entities)
                    }

                    prefs.edit().putString("date_sync", newLastSync).apply()

                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Synchro terminée", Toast.LENGTH_SHORT).show()
                    }
                }

            } catch (e: Exception) {
                e.printStackTrace()
            }
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
