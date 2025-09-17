import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthController } from "./health/health.controller";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
	imports: [
		// Connexion SIMPLE sans authentification
		MongooseModule.forRoot(process.env.DATABASE_URL || "mongodb://mongodb:27017/eventix"),
	],
	controllers: [AppController, HealthController],
	providers: [AppService],
})
export class AppModule {}
