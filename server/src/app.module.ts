import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";

import { HealthController } from "./health/health.controller";
import { EventModule } from "./event/event.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		MongooseModule.forRoot(process.env.DATABASE_URL || "mongodb://localhost:27017/eventix", {
			autoIndex: true,
		}),
		EventModule,
		UsersModule,
		AuthModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
