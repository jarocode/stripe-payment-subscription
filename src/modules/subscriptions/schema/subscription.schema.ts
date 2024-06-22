import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema()
export class Subscription {
  @Prop({ isRequired: true })
  subscription_id: string;

  @Prop({ isRequired: true })
  customer_id: string;

  @Prop({ isRequired: true })
  product_id: string;

  @Prop({ isRequired: true })
  amount: number;

  @Prop({ isRequired: false })
  user_id: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
