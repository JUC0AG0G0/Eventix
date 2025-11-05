import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { EventService } from "./event.service";
import { EventDto, PaginatedEventsDto } from "./dto/event.dto";

@ApiTags("Events")
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

		// Récupère les docs bruts depuis le service
		const { docs, meta } = await this.eventService.findPaginatedRaw(pageNumber, 10);

		// Transformation vers DTO : on prend les champs exposés dans EventDto.
		// plainToInstance ignore par défaut les champs qui ne sont pas marqués @Expose si on utilise enableImplicitConversion=false.
		const data = plainToInstance(EventDto, docs, {
			excludeExtraneousValues: true, // CRUCIAL : filtre _id et autres champs non exposés
		});

		return { data, meta };
	}
}
