import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { SignOptions } from "jsonwebtoken";

@Module({
	imports: [
		ConfigModule, // global normalement
		PassportModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService): JwtModuleOptions => {
				const secret = config.get<string>("JWT_SECRET");
				if (!secret) {
					throw new Error("JWT_SECRET is not defined in environment");
				}

				const expiresInRaw = config.get<string>("JWT_EXPIRES_IN") ?? "3600";
				const asNumber = Number(expiresInRaw);
				const expiresInValue: number | string =
					Number.isFinite(asNumber) && asNumber > 0 ? asNumber : String(expiresInRaw);

				const signOptions: SignOptions = {
					expiresIn: expiresInValue as SignOptions["expiresIn"],
				};

				return {
					secret,
					signOptions,
				};
			},
		}),
		UsersModule,
	],
	providers: [AuthService, JwtStrategy],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
