import { INestApplication } from "@nestjs/common";
import request from "supertest";

export class EventRoutes {
	constructor(
		private readonly app: INestApplication,
		private readonly token?: string,
	) {}

	private get httpServer() {
		return this.app.getHttpServer();
	}

	private auth(req: request.Test) {
		if (this.token) {
			return req.set("Authorization", `Bearer ${this.token}`);
		}
		return req;
	}

	getAll(page: number = 1) {
		return this.auth(request(this.httpServer).get(`/events?page=${page}`));
	}

	getOne(id: string) {
		return this.auth(request(this.httpServer).get(`/events/${id}`));
	}

	sync(since?: string) {
		const query = since ? `?since=${since}` : "";
		return this.auth(request(this.httpServer).get(`/events/sync${query}`));
	}

	register(eventId: string) {
		return this.auth(request(this.httpServer).post("/events/register").send({ id: eventId }));
	}

	updateCapacity(id: string, nbplace: number) {
		return this.auth(request(this.httpServer).patch(`/events/${id}`).send({ nbplace }));
	}

	delete(id: string) {
		return this.auth(request(this.httpServer).delete(`/events/${id}`));
	}
}
