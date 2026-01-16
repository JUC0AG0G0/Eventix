import { INestApplication } from "@nestjs/common";
import { setupTestApp, teardownTestApp, TestContext, TEST_TIMEOUT } from "../../test/utils/test-setup";
import { UserFactory } from "../../test/utils/user-factory";
import { UsersRoutes } from "../../test/routes/users.routes";
import { RegisterUserDto } from "./dto/register-user.dto";

describe("Users Module (Integration)", () => {
	let context: TestContext;
	let app: INestApplication;
	let userFactory: UserFactory;
	let publicUserRoutes: UsersRoutes; // Pour les appels sans token (register)

	jest.setTimeout(TEST_TIMEOUT);

	beforeAll(async () => {
		context = await setupTestApp();
		app = context.app;
		userFactory = new UserFactory(app);
		publicUserRoutes = new UsersRoutes(app);
	});

	afterAll(async () => {
		await teardownTestApp(context);
	});

	// =================================================================
	// POST /users/register
	// =================================================================
	describe("POST /users/register", () => {
		it("should register a new user successfully and return token", async () => {
			const dto: RegisterUserDto = {
				email: `newuser-${Date.now()}@example.com`,
				password: "Password123!",
				firstName: "Alice",
				lastName: "Wonderland",
			};

			const response = await publicUserRoutes.register(dto).expect(201);

			// On vérifie que le service auth a bien renvoyé un token
			// Selon ton AuthController/Service, ça renvoie souvent { access_token: ... }
			expect(response.body).toBeDefined();
			// Adapte cette ligne selon le retour exact de ton AuthService.loginWithCredentials
			// Si ça renvoie { access_token: "..." }, alors :
			expect(response.body.access_token).toBeDefined();
		});

		it("should return 409 Conflict if email already exists", async () => {
			// 1. On crée un user en base via la factory
			const existingUser = await userFactory.create({
				email: "duplicate@example.com",
			});

			// 2. On essaie de s'inscrire avec le même email
			const dto: RegisterUserDto = {
				email: "duplicate@example.com", // Même email
				password: "AnotherPassword123",
				firstName: "Bob",
				lastName: "Builder",
			};

			await publicUserRoutes.register(dto).expect(409);
		});

		it("should return 400 Bad Request if data is invalid (missing password)", async () => {
			// On cast en 'any' pour contourner le typage TS et simuler un envoi incomplet
			const invalidDto: any = {
				email: "invalid@example.com",
				firstName: "NoPassword",
				// password manquant
			};

			await publicUserRoutes.register(invalidDto).expect(400);
		});
	});

	// =================================================================
	// GET /users/me
	// =================================================================
	describe("GET /users/me", () => {
		it("should return current user profile", async () => {
			// 1. On crée un user authentifié
			const user = await userFactory.create({
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				role: "user",
			});

			// 2. On appelle /users/me avec son token (via user.users.me())
			const response = await user.users.me().expect(200);

			// 3. Vérifications
			expect(response.body.email).toBe("john.doe@example.com");
			expect(response.body.firstName).toBe("John");
			expect(response.body.lastName).toBe("Doe");
			expect(response.body.role).toBe("user");

			// Vérification du tokenExpiresAt (format Date)
			expect(response.body.tokenExpiresAt).toBeDefined();
			expect(new Date(response.body.tokenExpiresAt).getTime()).not.toBeNaN();
		});

		it("should return 401 Unauthorized without token", async () => {
			// Appel via les routes publiques (sans token)
			await publicUserRoutes.me().expect(401);
		});
	});
});
