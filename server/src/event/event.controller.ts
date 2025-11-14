import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { EventService } from "./event.service";
import { EventDto, PaginatedEventsDto } from "./dto/event.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { RegisterEventDto } from "./dto/register-event.dto";

@ApiTags("Events")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearerAuth")
@Controller("events")
export class EventController {
	constructor(private readonly eventService: EventService) {}

	@Get()
	@ApiOperation({
		summary: "Récupère la liste paginée des événements",
		description:
			"Retourne 10 événements par page, triés par date d’édition décroissante. Utiliser `?page=` pour naviguer.",
	})
	@ApiQuery({
		name: "page",
		required: false,
		type: Number,
		description: "Numéro de page (par défaut: 1)",
		example: 1,
	})
	@ApiResponse({
		status: 200,
		description: "Liste paginée des événements (sans la liste des personnes inscrites).",
		type: PaginatedEventsDto,
	})
	async getEvents(@Query("page") pageQuery?: string): Promise<PaginatedEventsDto> {
		const page = pageQuery ? parseInt(pageQuery, 10) : 1;
		const pageNumber = Number.isFinite(page) && page > 0 ? page : 1;

		const { docs, meta } = await this.eventService.findPaginatedRaw(pageNumber, 10);

		const data = plainToInstance(EventDto, docs, {
			excludeExtraneousValues: true,
		});

		return { data, meta };
	}

	@Post("register")
	@Roles("user")
	@ApiOperation({ summary: "Inscrire l'utilisateur connecté à un événement (envoie { id })" })
	@ApiResponse({ status: 200, description: "Inscription réussie, retourne l'événement mis à jour." })
	@ApiResponse({ status: 400, description: "Événement complet." })
	@ApiResponse({ status: 401, description: "Token invalide/absent." })
	@ApiResponse({ status: 403, description: "Rôle insuffisant." })
	@ApiResponse({ status: 404, description: "Événement introuvable." })
	async register(@Body() dto: RegisterEventDto, @CurrentUser() user: JwtPayload) {
		const userId = user.sub; // sub contient l'id (string)
		const updated = await this.eventService.registerUser(dto.id, String(userId));
		return updated;
	}
}
