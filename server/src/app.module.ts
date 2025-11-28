import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { HealthController } from "./health/health.controller";
import { EventModule } from "./event/event.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>("DATABASE_URL") || "mongodb://localhost/eventix",
			}),
			inject: [ConfigService],
		}),
		EventModule,
		UsersModule,
		AuthModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
