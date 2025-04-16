import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger: Logger = new Logger('Bootstrap');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  //
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application running on http://localhost:${process.env.PORT}`);
  logger.log(`Swagger running on http://localhost:${process.env.PORT}/api`);
}
bootstrap();
