import { forwardRef, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

interface PublicUser {
	id?: string;
	_id?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	role?: string;
	[key: string]: unknown;
}

function safeToString(x: unknown): string | null {
	if (x === null || x === undefined) {
		return null;
	}
	if (typeof x === "string") {
		return x;
	}
	if (typeof (x as { toString?: unknown }).toString === "function") {
		const res = (x as { toString: () => unknown }).toString();
		if (typeof res === "string") {
			return res;
		}
	}
	return null;
}

function toPublicRecord(obj: unknown): Record<string, unknown> | null {
	if (!obj || typeof obj !== "object") {
		return null;
	}

	const maybe = obj as { toObject?: unknown };
	let plain: unknown;
	if (typeof maybe.toObject === "function") {
		const fn = maybe.toObject as () => unknown;
		plain = fn.call(maybe);
	} else {
		plain = obj;
	}

	if (!plain || typeof plain !== "object") {
		return null;
	}

	const record = { ...(plain as Record<string, unknown>) };

	const normalized = safeToString(record._id);
	if (normalized !== null) {
		record._id = normalized;
	}
	if (!record.id && typeof record._id === "string") {
		record.id = record._id;
	}

	return record;
}

@Injectable()
export class AuthService {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async validateUser(email: string, password: string): Promise<PublicUser | null> {
		const raw: unknown = await this.usersService.findByEmail(email);
		const source = toPublicRecord(raw);
		if (!source) {
			return null;
		}

		const maybeHash = source["passwordHash"];
		if (typeof maybeHash !== "string") {
			return null;
		}

		const isValid = await bcrypt.compare(password, maybeHash);
		if (!isValid) {
			return null;
		}

		const publicObj: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(source)) {
			if (k === "passwordHash") {
				continue;
			}
			publicObj[k] = v;
		}

		if (publicObj._id !== undefined) {
			const s = safeToString(publicObj._id);
			if (s !== null) {
				publicObj._id = s;
			}
		}
		if (!publicObj.id && typeof publicObj._id === "string") {
			publicObj.id = publicObj._id;
		}

		return publicObj as PublicUser;
	}

	async login(user: PublicUser): Promise<{ access_token: string }> {
		const userId = user.id ?? user._id;
		if (typeof userId !== "string" && typeof userId !== "number") {
			throw new UnauthorizedException("Invalid user");
		}

		const payload = {
			sub: String(userId),
			email: typeof user.email === "string" ? user.email : undefined,
			firstName: typeof user.firstName === "string" ? user.firstName : undefined,
			lastName: typeof user.lastName === "string" ? user.lastName : undefined,
			role: typeof user.role === "string" ? user.role : "user",
		};

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
