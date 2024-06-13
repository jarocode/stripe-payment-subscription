import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StripeModule } from './modules/stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.development', '.env.production']}),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    SubscriptionsModule,
    StripeModule.forRootAsync(), 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
