import { INestApplication } from "@nestjs/common";
import { setupTestApp, teardownTestApp, TestContext, TEST_TIMEOUT } from "../../test/utils/test-setup";
import { UserFactory } from "../../test/utils/user-factory";
import { AuthRoutes } from "../../test/routes/auth.routes";
import { LoginDto } from "../users/dto/login.dto";

describe("Auth Module (Integration)", () => {
	let context: TestContext;
	let app: INestApplication;
	let userFactory: UserFactory;
	let authRoutes: AuthRoutes;

	jest.setTimeout(TEST_TIMEOUT);

	beforeAll(async () => {
		context = await setupTestApp();
		app = context.app;
		userFactory = new UserFactory(app);
		authRoutes = new AuthRoutes(app);
	});

	afterAll(async () => {
		await teardownTestApp(context);
	});

	describe("POST /auth/login", () => {
		it("should return 200 and access_token with valid credentials", async () => {
			const user = await userFactory.create({
				email: "login-success@test.com",
			});

			const dto: LoginDto = {
				email: "login-success@test.com",
				password: "password123",
			};

			const response = await authRoutes.login(dto).expect(200);

			expect(response.body).toHaveProperty("access_token");
			expect(typeof response.body.access_token).toBe("string");
		});

		it("should return 401 Unauthorized with wrong password", async () => {
			await userFactory.create({
				email: "wrong-pass@test.com",
			});

			const dto: LoginDto = {
				email: "wrong-pass@test.com",
				password: "WrongPassword!!!",
			};

			await authRoutes.login(dto).expect(401);
		});

		it("should return 401 Unauthorized if email does not exist", async () => {
			const dto: LoginDto = {
				email: "unknown-user@test.com",
				password: "password123",
			};

			await authRoutes.login(dto).expect(401);
		});

		it("should return 401 Bad Request if data is invalid (missing email)", async () => {
			const invalidDto: any = {
				password: "password123",
			};

			await authRoutes.login(invalidDto).expect(401);
		});

		it("should return 401 Bad Request if data is invalid (missing password)", async () => {
			const invalidDto: any = {
				email: "test@test.com",
			};

			await authRoutes.login(invalidDto).expect(401);
		});
	});
});
