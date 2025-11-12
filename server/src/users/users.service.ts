import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { UserDocument, User } from "./user.schema";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class UsersService {
	constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

	// Création utilisateur
	async create(dto: RegisterUserDto) {
		const { email, password, firstName, lastName } = dto;
		const passwordHash = await bcrypt.hash(password, 10);

		try {
			const created = new this.userModel({
				email,
				firstName,
				lastName,
				passwordHash,
				role: "user", // role par défaut
			});
			return await created.save();
		} catch (err: any) {
			const error = err as { code?: number };
			if (error.code === 11000) {
				throw new ConflictException("Email already exists");
			}
			throw err;
		}
	}

	// Recherche par email
	async findByEmail(email: string) {
		return this.userModel.findOne({ email }).exec();
	}

	// Login
	async login(dto: LoginDto) {
		const { email, password } = dto;
		const user = await this.findByEmail(email);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			throw new UnauthorizedException("Invalid credentials");
		}

		return {
			message: "Login successful",
			user: {
				id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
			},
		};
	}
}
