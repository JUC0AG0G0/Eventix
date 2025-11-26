import { Injectable, ConflictException, InternalServerErrorException, Inject, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { UserDocument, User } from "./user.schema";
import { RegisterUserDto } from "./dto/register-user.dto";
import { AuthService } from "../auth/auth.service";

type MaybeMongoDuplicateError = {
	code?: number | string;
	keyValue?: Record<string, unknown>;
};

function isMongoDuplicateError(err: unknown): err is MaybeMongoDuplicateError {
	return typeof err === "object" && err !== null && ("code" in err || "keyValue" in (err as Record<string, unknown>));
}

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
	) {}

	async create(dto: RegisterUserDto) {
		const { email, password, firstName, lastName } = dto;
		const normalizedEmail = (email || "").trim().toLowerCase();

		const existing = await this.userModel.findOne({ email: normalizedEmail }).lean();
		if (existing) {
			throw new ConflictException("Email already exists");
		}

		const passwordHash = await bcrypt.hash(password, 10);

		try {
			const created = new this.userModel({
				email: normalizedEmail,
				firstName,
				lastName,
				passwordHash,
				role: "user",
			});

			await created.save();
			return this.authService.loginWithCredentials(email, password);
		} catch (err: unknown) {
			if (isMongoDuplicateError(err) && (err.code === 11000 || err.code === "11000")) {
				const dupField = err.keyValue ? Object.keys(err.keyValue).join(", ") : "email";
				throw new ConflictException(`${dupField} already exists`);
			}
			throw new InternalServerErrorException("Failed to create user");
		}
	}

	async findByEmail(email: string) {
		const normalized = (email || "").trim().toLowerCase();
		return this.userModel.findOne({ email: normalized }).exec();
	}
}
