import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // Correction : utiliser un nom de DB différent du service
    MongooseModule.forRoot('mongodb://localhost:27017/myapp-dev'),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
