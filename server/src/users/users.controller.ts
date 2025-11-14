import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import * as currentUserDecorator from "../common/decorators/current-user.decorator";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiBody,
} from "@nestjs/swagger";

@ApiTags("Users")
@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post("register")
	@ApiOperation({ summary: "Créer un nouvel utilisateur" })
	@ApiBody({ type: RegisterUserDto })
	@ApiResponse({ status: 201, description: "Utilisateur créé avec succès." })
	@ApiResponse({ status: 400, description: "Données invalides." })
	async register(@Body() dto: RegisterUserDto) {
		return this.usersService.create(dto);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth("bearerAuth")
	@Get("me")
	@ApiOperation({ summary: "Récupérer les informations du compte connecté" })
	@ApiResponse({
		status: 200,
		description: "Informations de l'utilisateur connecté.",
		schema: {
			type: "object",
			properties: {
				email: { type: "string", example: "user@example.com" },
				firstName: { type: "string", example: "John" },
				lastName: { type: "string", example: "Doe" },
				role: { type: "string", example: "user" },
				tokenExpiresAt: { type: "string", format: "date-time", example: "2025-11-14T12:34:56Z" },
			},
		},
	})
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
