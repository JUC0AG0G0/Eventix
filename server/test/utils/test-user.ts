import { INestApplication } from "@nestjs/common";
import { EventRoutes } from "../routes/event.routes";
import { UsersRoutes } from "../routes/users.routes"; // Ajout

export class TestUser {
	public readonly event: EventRoutes;
	public readonly users: UsersRoutes; // Ajout

	constructor(
		private readonly app: INestApplication,
		private readonly token: string,
		public readonly userData: any,
	) {
		this.event = new EventRoutes(app, token);
		this.users = new UsersRoutes(app, token); // Ajout
	}
}
