import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "../users/dto/login.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("login")
	@HttpCode(HttpStatus.OK)
	async login(@Body() dto: LoginDto) {
		return this.authService.loginWithCredentials(dto.email, dto.password);
	}
}
