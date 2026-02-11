package com.example.eventix.network

// Host principal
const val HOST = "http://eventix.julescorneille.fr"

object ApiRoutes {

    // Auth
    const val LOGIN = "$HOST/auth/login"
    const val SIGNUP = "$HOST/users/register"
    const val USER_ME = "$HOST/users/me"

    // Events
    const val EVENT_REGISTER = "$HOST/events/register"          // POST pour s'inscrire
    const val EVENT_UNREGISTER = "$HOST/events/unregister"          // POST pour déinscrire
    fun EVENT_SYNC(since: String, idsCsv: String?): String {

        val base = "$HOST/events/sync?since=$since"

        return if (!idsCsv.isNullOrEmpty()) {
            "$base&ids=$idsCsv"
        } else {
            base
        }
    }

    // Les endpoints qui nécessitent l'ID de l'événement
    fun events(nbpage: String) = "$HOST/events?page=$nbpage"    // GET paginé
    fun event(id: String) = "$HOST/events/$id"                  // adapte l'url selon ton API
    fun updateEventCapacity(id: String) = "$HOST/events/$id"    // PATCH
    fun deleteEvent(id: String) = "$HOST/events/$id"            // DELETE
}
