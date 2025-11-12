import { Body, Controller, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post("register")
	async register(@Body() dto: RegisterUserDto) {
		return this.usersService.create(dto);
	}

	@Post("login")
	async login(@Body() dto: LoginDto) {
		return this.usersService.login(dto);
	}
}
