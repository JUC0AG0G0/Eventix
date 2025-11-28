import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";

jest.setTimeout(300000); // 5 minutes pour l'ensemble (sécuritaire)

let app: INestApplication;
let mongoContainer: StartedTestContainer | undefined;

beforeAll(async () => {
	// Timeout généreux pour le démarrage du container
	jest.setTimeout(300000);

	if (process.env.DATABASE_URL) {
		console.log("Using DATABASE_URL from env (CI service).");
	} else {
		// Démarre testcontainers en local/dev
		// Utiliser la log message et le listening port, et augmenter le startup timeout
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		mongoContainer = (await new GenericContainer("mongo:7.0")
			.withExposedPorts(27017)
			.withEnvironment({
				MONGO_INITDB_ROOT_USERNAME: "testuser",
				MONGO_INITDB_ROOT_PASSWORD: "testpass",
				MONGO_INITDB_DATABASE: "testdb",
			})
			// Wait strategy plus robuste : log message OR port listening
			.withWaitStrategy(Wait.forLogMessage("Waiting for connections"))
			.withStartupTimeout(180_000) // 3 minutes
			.start()) as unknown as StartedTestContainer;

		// En complément, si tu veux être ultra-robuste, tu peux attendre explicitement le port :
		// await new Promise((res) => setTimeout(res, 2000)); // petit délai après start()
		const mongoPort = mongoContainer.getMappedPort(27017);
		const mongoHost = mongoContainer.getHost();
		process.env.DATABASE_URL = `mongodb://testuser:testpass@${mongoHost}:${mongoPort}/testdb?authSource=admin`;
	}

	// variables communes
	process.env.JWT_SECRET = "testsecret";
	process.env.JWT_EXPIRES_IN = "3600";
	process.env.NODE_ENV = "test";
	process.env.SERVER_PORT = "0";

	const moduleRef: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	app = moduleRef.createNestApplication() as INestApplication;
	await app.init();
	await app.listen(0);
});

afterAll(async () => {
	if (app) {
		await app.close();
	}
	if (mongoContainer) {
		// récupère les logs pour débogage si besoin
		try {
			const logs = await mongoContainer.logs();
			console.log("Mongo container logs (tail):", logs);
		} catch (err) {
			// ignore
		}
		await mongoContainer.stop();
	}
});

describe("Events Module (e2e)", () => {
	it("GET /events should return 401 without token", async () => {
		const response = await request(app.getHttpServer()).get("/events").expect(401);
		expect(response.body).toBeDefined();
	});
});
