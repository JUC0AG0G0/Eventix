import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";

jest.setTimeout(60000); // 60 secondes pour les hooks longs

let app: INestApplication;
let mongoContainer: StartedTestContainer;

beforeAll(async () => {
	// 1️⃣ Démarrer un conteneur MongoDB temporaire
	mongoContainer = await new GenericContainer("mongo:7.0")
		.withExposedPorts(27017)
		.withEnvironment({
			MONGO_INITDB_ROOT_USERNAME: "testuser",
			MONGO_INITDB_ROOT_PASSWORD: "testpass",
			MONGO_INITDB_DATABASE: "testdb",
		})
		.withWaitStrategy(Wait.forLogMessage("Waiting for connections")) // attend que Mongo soit prêt
		.start();

	const mongoPort = mongoContainer.getMappedPort(27017);
	const mongoHost = mongoContainer.getHost();
	const mongoUri = `mongodb://testuser:testpass@${mongoHost}:${mongoPort}/testdb?authSource=admin`;

	// 2️⃣ Définir les variables d'environnement nécessaires
	process.env.DATABASE_URL = mongoUri;
	process.env.JWT_SECRET = "testsecret"; // Obligatoire pour AuthModule
	process.env.JWT_EXPIRES_IN = "3600"; // Obligatoire pour AuthModule
	process.env.NODE_ENV = "test";
	process.env.SERVER_PORT = "0"; // port aléatoire

	// 3️⃣ Créer le module complet
	const moduleRef: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	// 4️⃣ Initialiser l'application
	app = moduleRef.createNestApplication();
	await app.init();

	// 5️⃣ Écouter sur un port aléatoire
	await app.listen(0);
});

afterAll(async () => {
	if (app) {
		await app.close();
	}
	if (mongoContainer) {
		await mongoContainer.stop();
	}
});

describe("Events Module (e2e)", () => {
	it("GET /events should return 401 without token", async () => {
		const response = await request(app.getHttpServer()).get("/events").expect(401); // Auth JWT active

		expect(response.body).toBeDefined();
	});
});
