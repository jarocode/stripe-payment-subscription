import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Subscription } from "./schema/subscription.schema";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>
  ) {}

  async addSubscriptionToDB(subscriptionDto: any): Promise<Subscription> {
    const createdSubscription = new this.subscriptionModel(subscriptionDto);
    return createdSubscription.save();
  }
}
