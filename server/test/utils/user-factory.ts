import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as bcrypt from "bcrypt";
import { TestUser } from "./test-user";
import { User } from "../../src/users/user.schema";
import { UsersRoutes } from "../routes/users.routes";
import { EventRoutes } from "../routes/event.routes";

export class UserFactory {
	private userModel: Model<any>;

	constructor(private app: INestApplication) {
		try {
			this.userModel = app.get(getModelToken(User.name));
		} catch (e) {}
	}

	async create(overrides: Partial<any> = {}): Promise<TestUser> {
		const jwtService = this.app.get(JwtService);
		const userId = new Types.ObjectId();

		const plainPassword = "password123";
		const passwordHash = await bcrypt.hash(plainPassword, 10);

		const mockUser = {
			_id: userId,
			email: overrides.email || `user-${Date.now()}@test.com`,
			firstName: overrides.firstName || "John",
			lastName: overrides.lastName || "Doe",
			passwordHash: passwordHash,
			role: overrides.role || "user",
			...overrides,
		};

		if (this.userModel) {
			await this.userModel.create(mockUser);
		}

		const token = jwtService.sign({
			sub: mockUser._id.toHexString(),
			email: mockUser.email,
			firstName: mockUser.firstName,
			lastName: mockUser.lastName,
			role: mockUser.role,
		});

		const testUser = new TestUser(this.app, token, { ...mockUser, plainPassword });
		(testUser as any).users = new UsersRoutes(this.app, token);
		(testUser as any).event = new EventRoutes(this.app, token);

		return testUser;
	}
}
