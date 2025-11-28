/* server/test/event.integration.ts */
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";

jest.setTimeout(180000); // 3 minutes au total pour hooks longs

let app: INestApplication;
let mongoContainer: StartedTestContainer | undefined;

beforeAll(async () => {
	// Timeout plus généreux pour le démarrage des containers
	jest.setTimeout(180000);

	if (process.env.DATABASE_URL) {
		// CI fournit déjà Mongo (via services GH Actions)
		console.log("Using DATABASE_URL from env (CI service).");
	} else {
		// Démarre testcontainers en local/dev
		// NOTE: withEnvironment (pas withEnv) — API documentée.
		// On caste le résultat pour satisfaire TS/ESLint si la lib expose des any.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		mongoContainer = (await new GenericContainer("mongo:7.0")
			.withExposedPorts(27017)
			.withEnvironment({
				MONGO_INITDB_ROOT_USERNAME: "testuser",
				MONGO_INITDB_ROOT_PASSWORD: "testpass",
				MONGO_INITDB_DATABASE: "testdb",
			})
			.withWaitStrategy(Wait.forHealthCheck()) // attend le healthcheck docker
			.withStartupTimeout(120000) // 2 minutes
			.start()) as unknown as StartedTestContainer;

		const mongoPort = mongoContainer.getMappedPort(27017);
		const mongoHost = mongoContainer.getHost();
		process.env.DATABASE_URL = `mongodb://testuser:testpass@${mongoHost}:${mongoPort}/testdb?authSource=admin`;
	}

	// variables communes
	process.env.JWT_SECRET = "testsecret";
	process.env.JWT_EXPIRES_IN = "3600";
	process.env.NODE_ENV = "test";
	process.env.SERVER_PORT = "0";

	// Création du module + init app
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
		await mongoContainer.stop();
	}
});

describe("Events Module (e2e)", () => {
	it("GET /events should return 401 without token", async () => {
		// supertest attend un http server : getHttpServer() est ok ici
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const response = await request(app.getHttpServer()).get("/events").expect(401);

		expect(response.body).toBeDefined();
	});
});
