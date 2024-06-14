import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  const PORT = new ConfigService().get<number>("PORT");
  const allowedOrigins: string[] = ['http://localhost:3000']; // Adjust as needed
  const corsOptions: CorsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.enableCors(corsOptions);
  await app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
}
bootstrap();