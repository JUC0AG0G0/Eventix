import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(configService: ConfigService) {
		const secret = configService.get<string>("JWT_SECRET");
		if (!secret) {
			throw new Error("JWT_SECRET is not defined in environment");
		}

		const opts: StrategyOptions = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: secret,
		};

		super(opts);
	}

	validate(payload: { sub: string; role?: string }) {
		return { userId: payload.sub, role: payload.role };
	}
}
