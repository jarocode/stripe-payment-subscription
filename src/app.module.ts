import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { StripeModule } from "./modules/stripe/stripe.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.development", ".env.production"],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
      }),
      inject: [ConfigService],
    }),
    SubscriptionsModule,
    StripeModule.forRootAsync(),
  ],
  controllers: [],
  providers: [],
})
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(RawBodyMiddleware)
//       .exclude(
//         "payments/stripe/create-subscription",
//         "payments/stripe/create-checkout-session"
//       )
//       .forRoutes(StripeController);
//   }
// }
export class AppModule {}
