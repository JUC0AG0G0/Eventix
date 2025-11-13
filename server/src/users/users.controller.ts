import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import * as currentUserDecorator from "../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post("register")
	async register(@Body() dto: RegisterUserDto) {
		return this.usersService.create(dto);
	}

	@UseGuards(JwtAuthGuard)
	@Get("me")
	getMe(@currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload) {
		return {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			tokenExpiresAt: new Date(user.exp * 1000),
		};
	}
}
