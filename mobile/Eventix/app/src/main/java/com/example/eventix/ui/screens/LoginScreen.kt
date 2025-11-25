package com.example.eventix.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.eventix.network.ApiRoutes
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

@Composable
fun LoginScreen(navController: NavController) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    val context = LocalContext.current
    val orange = Color(0xFFFF9800)

    fun login() {
        if (email.isBlank() || password.isBlank()) {
            message = "Veuillez renseigner tous les champs"
            return
        }

        // Coroutine pour requête réseau
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val json = JSONObject()
                json.put("email", email)
                json.put("password", password)

                val body = json.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url(ApiRoutes.LOGIN)
                    .post(body)
                    .addHeader("Content-Type", "application/json")
                    .build()

                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    val token = JSONObject(responseBody!!).getString("access_token")

                    // Stocker le token avec DataStore ou SharedPreferences
                    context.getSharedPreferences("app_prefs", 0).edit()
                        .putString("access_token", token)
                        .apply()

                    // Naviguer vers MainScreen
                    withContext(Dispatchers.Main) {
                        navController.navigate("main") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        message = "Échec de la connexion : ${response.message}"
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    message = "Erreur réseau : ${e.localizedMessage}"
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
        )

        Spacer(modifier = Modifier.height(16.dp))

        TextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation()
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = { login() },
            colors = ButtonDefaults.buttonColors(containerColor = orange),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Se connecter", color = Color.White)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Créer un compte",
            color = orange,
            modifier = Modifier.clickable {
                navController.navigate("inscription")
            }
        )

        Spacer(modifier = Modifier.height(16.dp))
        if (message.isNotEmpty()) {
            Text(text = message, color = Color.Red)
        }
    }
}
