package com.example.eventix.network

// Host principal
// const val HOST = "http://192.168.1.35:9010"
// const val HOST = "http://10.6.0.2:9010"
// const val HOST = "http://10.6.251.38:9010"
const val HOST = "http://10.8.251.113:9010"

object ApiRoutes {

    // Auth
    const val LOGIN = "$HOST/auth/login"
    const val SIGNUP = "$HOST/users/register"
    const val USER_ME = "$HOST/users/me"

    // Events
    const val EVENT_REGISTER = "$HOST/events/register"          // POST pour s'inscrire
    const val EVENT_SYNC = "$HOST/events/sync"                  // GET events modifiés depuis lastSync

    // Les endpoints qui nécessitent l'ID de l'événement
    fun events(nbpage: String) = "$HOST/events?page=$nbpage"    // GET paginé
    fun event(id: String) = "$HOST/events/$id"                  // adapte l'url selon ton API
    fun updateEventCapacity(id: String) = "$HOST/events/$id"    // PATCH
    fun deleteEvent(id: String) = "$HOST/events/$id"            // DELETE
}
