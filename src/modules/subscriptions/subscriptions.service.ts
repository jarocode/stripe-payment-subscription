import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Subscription } from "./schema/subscription.schema";
import { SubscriptionDto } from "./dto/subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>
  ) {}

  async addSubscriptionToDB(
    subscriptionDto: SubscriptionDto
  ): Promise<Subscription> {
    try {
      const createdSubscription = new this.subscriptionModel(subscriptionDto);
      return createdSubscription.save();
    } catch (error) {
      throw error;
    }
  }
  async updateSubscriptionInDB(
    subscriptionDto: SubscriptionDto
  ): Promise<void> {
    try {
      await this.subscriptionModel.findOneAndUpdate(
        {
          subscription_id: subscriptionDto.subscription_id,
        },
        { $set: subscriptionDto }
      );
    } catch (error) {
      throw error;
    }
  }

  async getUserSubscription(customer_id: string): Promise<any> {
    try {
      const subscription = await this.subscriptionModel
        .findOne({
          customer_id,
        })
        .lean();

      return subscription;
    } catch (error) {
      throw error;
    }
  }
  async findSubscriptionByProductID(product_id: string): Promise<any> {
    try {
      const subscription = await this.subscriptionModel
        .findOne({
          product_id,
        })
        .lean();

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  async deleteSubscription(subscription_id: string): Promise<void> {
    try {
      await this.subscriptionModel.deleteOne({
        subscription_id,
      });
    } catch (error) {
      throw error;
    }
  }
}
