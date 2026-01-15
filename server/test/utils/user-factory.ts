import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { TestUser } from "./test-user";
// Assure-toi que le chemin vers User est bon (UserDocument si tu as fait la modif précédente)
import { User } from "../../src/users/user.schema";
import { UsersRoutes } from "../routes/users.routes"; // Import des routes users

export class UserFactory {
	private userModel: Model<any>;

	constructor(private app: INestApplication) {
		try {
			// On récupère le modèle User.name ou 'User' selon ta config
			this.userModel = app.get(getModelToken(User.name));
		} catch (e) {}
	}

	async create(overrides: Partial<any> = {}): Promise<TestUser> {
		const jwtService = this.app.get(JwtService);
		const userId = new Types.ObjectId();

		const mockUser = {
			_id: userId,
			email: overrides.email || `user-${Date.now()}@test.com`,
			firstName: overrides.firstName || "John",
			lastName: overrides.lastName || "Doe",
			passwordHash: "hashed_secret", // Simule un hash en DB
			role: overrides.role || "user",
			...overrides,
		};

		// Insertion réelle en base
		if (this.userModel) {
			await this.userModel.create(mockUser);
		}

		// Création du token correspondant
		const token = jwtService.sign({
			sub: mockUser._id.toHexString(),
			email: mockUser.email,
			firstName: mockUser.firstName, // Ajouté pour matcher ton payload JWT
			lastName: mockUser.lastName, // Ajouté pour matcher ton payload JWT
			role: mockUser.role,
		});

		// Retourne le TestUser enrichi avec les routes Users
		const testUser = new TestUser(this.app, token, mockUser);
		// On peut attacher dynamiquement les routes users si on ne veut pas modifier la classe TestUser
		// Mais l'idéal est d'ajouter public readonly users: UsersRoutes dans la classe TestUser.
		// Pour l'instant, on instanciera UsersRoutes dans le test directement ou via une propriété ad-hoc.

		return testUser;
	}
}
