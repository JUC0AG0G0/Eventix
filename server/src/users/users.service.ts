import { Injectable, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { UserDocument, User } from "./user.schema";
import { RegisterUserDto } from "./dto/register-user.dto";

@Injectable()
export class UsersService {
	constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

	async create(dto: RegisterUserDto) {
		const { email, password, firstName, lastName } = dto;
		const passwordHash = await bcrypt.hash(password, 10);

		try {
			const created = new this.userModel({
				email,
				firstName,
				lastName,
				passwordHash,
				role: "user",
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

	async findByEmail(email: string) {
		return this.userModel.findOne({ email }).exec();
	}
}
