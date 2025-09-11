import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Eventix API')
      .setDescription('API Backend pour Eventix')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    console.log(
      `📚 Documentation Swagger disponible sur http://localhost:${process.env.SERVER_PORT}/docs`,
    );
  }

  const port = process.env.SERVER_PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Eventix API démarrée sur http://localhost:${port}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Base de données: ${process.env.MONGO_DB}`);
  console.log(`📊 Niveau de log: ${process.env.LOG_LEVEL}`);
}
bootstrap();
