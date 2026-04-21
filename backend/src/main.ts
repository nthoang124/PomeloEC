import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ZodValidationPipe } from 'nestjs-zod';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino Logger
  app.useLogger(app.get(Logger));

  // OpenAPI Setup (Swagger)
  const config = new DocumentBuilder()
    .setTitle('PomeloEC API')
    .setDescription(
      'Full Endpoint specification for the Modular Monolith Marketplace.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Global Exception Filter for standardized error response with traceId
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Input Validation via Zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Security & CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Error bootstrapping app', err);
  process.exit(1);
});
