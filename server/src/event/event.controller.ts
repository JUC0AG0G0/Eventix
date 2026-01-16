import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBody } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { EventService } from "./event.service";
import { EventDto, PaginatedEventsDto } from "./dto/event.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { RegisterEventDto } from "./dto/register-event.dto";
import { RolesGuard } from "../auth/roles.guard";
import { UpdateCapacityDto } from "./dto/update-capacity.dto";
import { SyncEventsDto } from "./dto/sync-events.dto";
import { SyncQueryDto } from "./dto/sync-query.dto";

@ApiTags("Events")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearerAuth")
@Controller("events")
export class EventController {
	constructor(private readonly eventService: EventService) {}

	@Get("sync")
	@ApiOperation({
		summary: "Synchronisation des événements pour l'utilisateur",
		description:
			"Retourne les événements auxquels l'utilisateur est inscrit et qui ont été modifiés après la date fournie.",
	})
	@ApiQuery({
		name: "since",
		required: false,
		type: String,
		description: "Date ISO 8601 de la dernière synchro",
		example: "2025-11-17T14:34:55.909Z",
	})
	@ApiResponse({
		status: 200,
		description: "Événements modifiés depuis la dernière synchro.",
		type: SyncEventsDto,
	})
	@ApiResponse({ status: 400, description: "Paramètre since invalide." })
	async sync(@Query() query: SyncQueryDto, @CurrentUser() user: JwtPayload): Promise<SyncEventsDto> {
		return this.eventService.syncUserEvents(String(user.sub), query.since);
	}

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
	async getEvents(@Query("page") pageQuery?: string, @CurrentUser() user?: JwtPayload): Promise<PaginatedEventsDto> {
		const page = pageQuery ? parseInt(pageQuery, 10) : 1;
		const pageNumber = Number.isFinite(page) && page > 0 ? page : 1;

		const userId = user ? String(user.sub) : undefined;

		const { docs, meta } = await this.eventService.findPaginatedRaw(pageNumber, 10, userId);

		const data = plainToInstance(EventDto, docs, {
			excludeExtraneousValues: true,
		});

		return { data, meta };
	}

	@Get(":id")
	@ApiOperation({
		summary: "Récupère un événement par son identifiant",
		description: "Retourne l'événement correspondant à l'identifiant fourni. Nécessite d'être authentifié.",
	})
	@ApiResponse({ status: 200, description: "Événement trouvé.", type: EventDto })
	@ApiResponse({ status: 400, description: "Identifiant invalide." })
	@ApiResponse({ status: 401, description: "Token invalide ou absent." })
	@ApiResponse({ status: 404, description: "Événement introuvable." })
	async getEventById(@Param("id") idEvent: string, @CurrentUser() user: JwtPayload): Promise<EventDto> {
		const event = await this.eventService.findById(idEvent, String(user.sub));

		return plainToInstance(EventDto, event, { excludeExtraneousValues: true });
	}

	@Post("register")
	@UseGuards(RolesGuard)
	@Roles("user")
	@ApiOperation({
		summary: "Inscrire l'utilisateur connecté à un événement",
		description: "Permet à un utilisateur authentifié de s'inscrire à un événement en envoyant l'id de l'événement.",
	})
	@ApiBody({
		type: RegisterEventDto,
		description: "DTO contenant l'identifiant de l'événement auquel s'inscrire",
	})
	@ApiResponse({
		status: 201,
		description: "Inscription réussie, retourne l'événement mis à jour.",
	})
	@ApiResponse({ status: 400, description: "Événement complet." })
	@ApiResponse({ status: 401, description: "Token invalide ou absent." })
	@ApiResponse({ status: 403, description: "Rôle insuffisant pour cette action." })
	@ApiResponse({ status: 404, description: "Événement introuvable." })
	async register(@Body() dto: RegisterEventDto, @CurrentUser() user: JwtPayload) {
		await this.eventService.registerUser(dto.id, String(user.sub));
		return;
	}

	@Post("unregister")
	@UseGuards(RolesGuard)
	@Roles("user")
	@ApiOperation({
		summary: "Désinscrire l'utilisateur connecté d'un événement",
		description: "Permet à un utilisateur de se désinscrire. Met à jour les places et le statut de l'événement.",
	})
	@ApiBody({
		type: RegisterEventDto,
		description: "DTO contenant l'identifiant de l'événement duquel se désinscrire",
	})
	@ApiResponse({
		status: 200,
		description: "Désinscription réussie.",
	})
	@ApiResponse({ status: 400, description: "L'utilisateur n'est pas inscrit à cet événement." })
	@ApiResponse({ status: 401, description: "Token invalide ou absent." })
	@ApiResponse({ status: 403, description: "Rôle insuffisant." })
	@ApiResponse({ status: 404, description: "Événement introuvable." })
	@ApiResponse({ status: 409, description: "Conflit : L'événement est annulé (event_cancel)." })
	async unregister(@Body() dto: RegisterEventDto, @CurrentUser() user: JwtPayload) {
		await this.eventService.unregisterUser(dto.id, String(user.sub));
		return;
	}

	@Patch(":id")
	@UseGuards(RolesGuard)
	@Roles("admin")
	@ApiOperation({
		summary: "Modifier la capacité d'un événement (nbplace)",
		description:
			"Permet à un administrateur de modifier la capacité maximale (nbplace) d'un événement. " +
			"La mise à jour est refusée si la nouvelle capacité est inférieure au nombre de participants déjà inscrits ou au minimum autorisé.",
	})
	@ApiBody({
		type: UpdateCapacityDto,
		description: "Corps contenant la nouvelle capacité (nbplace).",
	})
	@ApiResponse({ status: 204, description: "Capacité mise à jour avec succès." })
	@ApiResponse({ status: 400, description: "Nouvelle capacité invalide ou inférieure au nombre d'inscrits." })
	@ApiResponse({ status: 401, description: "Token invalide ou absent." })
	@ApiResponse({ status: 403, description: "Rôle insuffisant pour cette action." })
	@ApiResponse({ status: 404, description: "Événement introuvable." })
	async updateCapacity(@Param("id") idEvent: string, @Body() body: UpdateCapacityDto) {
		const patched = await this.eventService.patchEvent(idEvent, body);
		return patched;
	}

	@Delete(":id")
	@UseGuards(RolesGuard)
	@Roles("admin")
	@ApiOperation({
		summary: "Suppression ou annulation d'un événement",
		description:
			"Supprime totalement l'événement s'il n'a aucun inscrit. Si des participants sont enregistrés, l'événement est marqué comme annulé au lieu d'être supprimé.",
	})
	@ApiResponse({
		status: 200,
		description: "Indique si l'événement a été supprimé ou annulé.",
		schema: {
			example: { action: "deleted" },
		},
	})
	@ApiResponse({
		status: 400,
		description: "Requête invalide ou état de l'événement incompatible.",
	})
	@ApiResponse({ status: 401, description: "Token invalide ou absent." })
	@ApiResponse({ status: 403, description: "Rôle insuffisant pour cette action." })
	@ApiResponse({ status: 404, description: "Événement introuvable." })
	async delete(@Param("id") idEvent: string) {
		const result = await this.eventService.deleteEvent(idEvent);

		if (result?.Status === "Cancelled") {
			return { action: "canceled" };
		}

		return { action: "deleted" };
	}
}
