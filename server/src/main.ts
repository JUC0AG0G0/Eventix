import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import mongoose from "mongoose";
import { AppModule } from "./app.module";

async function bootstrap() {
	try {
		// Vérif des variables critiques
		if (!process.env.JWT_SECRET) {
			throw new Error("❌ Variable d'environnement manquante : JWT_SECRET");
		}

		if (!process.env.DATABASE_URL) {
			throw new Error("❌ Variable d'environnement manquante : DATABASE_URL");
		}

		// Test connexion à Mongo avant lancement Nest
		console.log("⏳ Vérification de la connexion à la base de données...");
		await mongoose.connect(process.env.DATABASE_URL, {
			serverSelectionTimeoutMS: 5000, // timeout rapide
		});
		console.log("✅ Connexion à la base de données réussie.");

		const app = await NestFactory.create(AppModule);

		app.enableCors();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidNonWhitelisted: true,
				transformOptions: { enableImplicitConversion: true },
			}),
		);

		if (process.env.SWAGGER_ENABLED === "true") {
			const config = new DocumentBuilder()
				.setTitle("Eventix API")
				.setDescription("API Backend pour Eventix")
				.addBearerAuth()
				.build();
			const document = SwaggerModule.createDocument(app, config);
			SwaggerModule.setup("docs", app, document);
			console.log(`📚 Swagger: http://localhost:${process.env.SERVER_PORT}/docs`);
		}

		const port = process.env.SERVER_PORT || 3000;
		await app.listen(port);

		console.log(`🚀 Eventix API démarrée sur http://localhost:${port}`);
		console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
		console.log(`🗄️  Base de données: ${process.env.DATABASE_URL}`);
		console.log(`🔒 Jwt Secret: ${process.env.JWT_SECRET}`);
		console.log(`🔒 Jwt Expires In: ${process.env.JWT_EXPIRES_IN}`);
		console.log(`📊 Niveau de log: ${process.env.LOG_LEVEL}`);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(error.message);
		} else {
			console.error("💥 Une erreur inconnue est survenue :", error);
		}
		console.error("💥 Échec du démarrage de l'application. Arrêt du processus...");
		process.exit(1);
	}
}

void bootstrap();
