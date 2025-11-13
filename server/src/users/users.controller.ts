import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post("register")
	async register(@Body() dto: RegisterUserDto) {
		return this.usersService.create(dto);
	}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	async getMe(@CurrentUser() user: { id: string; role: string; email?: string }) {
		const userFromDb = await this.usersService.findByEmail(user.email!);
		return {
			id: user.id,
			email: userFromDb?.email,
			firstName: userFromDb?.firstName,
			lastName: userFromDb?.lastName,
			role: user.role,
		};
	}
}
