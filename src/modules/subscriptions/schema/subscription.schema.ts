import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema()
export class Subscription {
  @Prop({ isRequired: true })
  id: string;

  @Prop({ isRequired: true })
  user_id: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
