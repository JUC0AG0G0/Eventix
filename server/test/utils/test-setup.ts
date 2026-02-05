import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../../src/app.module";

export const TEST_TIMEOUT = 300000;

export interface TestContext {
	app: INestApplication;
	mongoContainer: StartedTestContainer;
	moduleRef: TestingModule;
}

export async function setupTestApp(): Promise<TestContext> {
	let mongoContainer: StartedTestContainer;

	if (process.env.DATABASE_URL) {
		console.log("Using DATABASE_URL from env.");
	}

	mongoContainer = await new GenericContainer("mongo:7.0")
		.withExposedPorts(27017)
		.withEnvironment({
			MONGO_INITDB_ROOT_USERNAME: "testuser",
			MONGO_INITDB_ROOT_PASSWORD: "testpass",
			MONGO_INITDB_DATABASE: "testdb",
		})
		.withWaitStrategy(Wait.forLogMessage("Waiting for connections"))
		.withStartupTimeout(180_000)
		.start();

	const mongoPort = mongoContainer.getMappedPort(27017);
	const mongoHost = mongoContainer.getHost();
	process.env.DATABASE_URL = `mongodb://testuser:testpass@${mongoHost}:${mongoPort}/testdb?authSource=admin`;

	process.env.JWT_SECRET = "testsecret";
	process.env.JWT_EXPIRES_IN = "3600";
	process.env.NODE_ENV = "test";

	const moduleRef: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const app = moduleRef.createNestApplication();
	await app.init();
	await app.listen(0);

	return { app, mongoContainer, moduleRef };
}

export async function teardownTestApp(context: TestContext) {
	if (context.app) {
		await context.app.close();
	}
	if (context.mongoContainer) {
		await context.mongoContainer.stop();
	}
}
