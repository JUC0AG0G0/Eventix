import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { RegisterUserDto } from "../../src/users/dto/register-user.dto";

export class UsersRoutes {
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

	// POST /users/register
	register(dto: RegisterUserDto) {
		// Note: Pas besoin d'auth ici car c'est une route publique
		return request(this.httpServer).post("/users/register").send(dto);
	}

	// GET /users/me
	me() {
		return this.auth(request(this.httpServer).get("/users/me"));
	}
}
