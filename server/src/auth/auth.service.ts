import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

interface PublicUser {
	id?: string | number;
	_id?: string | number;
	role?: string;
	[key: string]: unknown;
}

function toPlainRecord(obj: unknown): Record<string, unknown> | null {
	if (!obj || typeof obj !== "object") {
		return null;
	}

	const maybe = obj as { toObject?: unknown };
	if (typeof maybe.toObject === "function") {
		const plain = (maybe.toObject as () => unknown)();
		if (plain && typeof plain === "object") {
			return plain as Record<string, unknown>;
		}
		return null;
	}

	return obj as Record<string, unknown>;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async validateUser(email: string, password: string): Promise<PublicUser | null> {
		const raw = await this.usersService.findByEmail(email);

		const source = toPlainRecord(raw);
		if (!source) {
			return null;
		}

		const passwordHash = source.passwordHash;
		if (typeof passwordHash !== "string") {
			return null;
		}

		const isValid = await bcrypt.compare(password, passwordHash);
		if (!isValid) {
			return null;
		}

		const entries = Object.entries(source).filter(([key]) => key !== "passwordHash");
		const publicObj = Object.fromEntries(entries) as Record<string, unknown>;

		return publicObj as PublicUser;
	}

	async login(user: PublicUser): Promise<{ access_token: string }> {
		const userId = user.id ?? user._id;
		if (typeof userId !== "string" && typeof userId !== "number") {
			throw new UnauthorizedException("Invalid user");
		}

		const payload = { sub: String(userId), role: typeof user.role === "string" ? user.role : "user" };
		const access_token = await this.jwtService.signAsync(payload);
		return { access_token };
	}

	async loginWithCredentials(email: string, password: string): Promise<{ access_token: string }> {
		const user = await this.validateUser(email, password);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}
		return this.login(user);
	}
}
