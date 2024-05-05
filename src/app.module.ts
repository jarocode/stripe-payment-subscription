import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI), // this database config should be separate module called DatabaseModule, that module should be called here
    SubscriptionsModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
