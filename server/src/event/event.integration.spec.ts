import { INestApplication } from "@nestjs/common";
import { setupTestApp, teardownTestApp, TestContext, TEST_TIMEOUT } from "../../test/utils/test-setup";
import { UserFactory } from "../../test/utils/user-factory";
import { EventFactory } from "../../test/utils/event-factory";
import { TestUser } from "../../test/utils/test-user";

describe("Events Module (Integration)", () => {
	let context: TestContext;
	let app: INestApplication;
	let userFactory: UserFactory;
	let eventFactory: EventFactory;

	jest.setTimeout(TEST_TIMEOUT);

	beforeAll(async () => {
		context = await setupTestApp();
		app = context.app;
		userFactory = new UserFactory(app);
		eventFactory = new EventFactory(app);
	});

	afterAll(async () => {
		await teardownTestApp(context);
	});

	afterEach(async () => {
		await eventFactory.cleanup();
	});

	it("GET /events should return a list of events", async () => {
		await eventFactory.create({ Nom: "Concert Integration" });
		const user: TestUser = await userFactory.create();

		const response = await user.event.getAll().expect(200);

		expect(response.body.data).toBeDefined();
		expect(response.body.data.length).toBeGreaterThanOrEqual(1);
		expect(response.body.data[0].Nom).toBe("Concert Integration");
	});

	it("POST /events/register should register user to event", async () => {
		const event = await eventFactory.create({ nbPlaceTotal: 10 });

		const user = await userFactory.create({ role: "user" });

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		await user.event.register(event._id.toString()).expect(201);
	});
});
