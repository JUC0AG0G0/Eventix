import { INestApplication } from "@nestjs/common";
import { EventRoutes } from "../routes/event.routes";

export class TestUser {
	public readonly event: EventRoutes;

	constructor(
		private readonly app: INestApplication,
		private readonly token: string,
		public readonly userData: any, // Pour garder une trace de l'ID ou email du user créé
	) {
		// On instancie les routes en leur passant le token de ce user
		this.event = new EventRoutes(app, token);
	}
}
