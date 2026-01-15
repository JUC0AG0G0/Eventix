import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { LoginDto } from "../../src/users/dto/login.dto";

export class AuthRoutes {
	constructor(private readonly app: INestApplication) {}

	private get httpServer() {
		return this.app.getHttpServer();
	}

	// POST /auth/login
	login(dto: LoginDto) {
		return request(this.httpServer).post("/auth/login").send(dto);
	}
}
