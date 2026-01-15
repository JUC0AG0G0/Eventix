import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Types } from "mongoose";
import { TestUser } from "./test-user";

export class UserFactory {
	constructor(private app: INestApplication) {}

	create(overrides: Partial<any> = {}): TestUser {
		const jwtService = this.app.get(JwtService);
		const userId = new Types.ObjectId();

		const mockUser = {
			_id: userId.toHexString(),
			email: overrides.email || `test-${Date.now()}@test.com`,
			role: overrides.role || "user",
		};

		const token = jwtService.sign({
			sub: mockUser._id,
			email: mockUser.email,
			role: mockUser.role,
		});

		return new TestUser(this.app, token, mockUser);
	}
}
