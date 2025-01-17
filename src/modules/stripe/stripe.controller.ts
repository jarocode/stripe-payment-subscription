import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { Request, Response } from "express";

import { AuthorizationGuard } from "../../guards/authorization.guard";
import { CreateCheckoutSessionDto } from "./dto/create-checkout-session-dto";

import { ConfigService } from "@nestjs/config";
import { CancelSubscriptionDto } from "../subscriptions/dto/cancelSubscription.dto";
import { SubscriptionDto } from "../subscriptions/dto/subscription.dto";

@Controller("payments/stripe")
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private readonly configService: ConfigService
  ) {}

  @Post("create-subscription-checkout")
  // @UseGuards(AuthorizationGuard)
  async createSubscriptionCheckout(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto
  ) {
    const { lookup_key } = createCheckoutSessionDto;
    try {
      const sessionUrl =
        await this.stripeService.createSubscriptionCheckout(lookup_key);

      return {
        sessionUrl,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("update-subscription")
  // @UseGuards(AuthorizationGuard)
  async updateSubscription(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto
  ): Promise<{
    message: string;
  }> {
    const { lookup_key } = createCheckoutSessionDto;
    try {
      await this.stripeService.updateSubscription(lookup_key);
      return {
        message: "subscription updated successfully",
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("cancel-subscription")
  // @UseGuards(AuthorizationGuard)
  async cancelSubscription(
    @Body() cancelSubscriptionDto: CancelSubscriptionDto
  ): Promise<{
    message: string;
  }> {
    const { subscription_id } = cancelSubscriptionDto;
    try {
      await this.stripeService.cancelSubscription(subscription_id);
      return {
        message: "subscription cancelled successfully",
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }
  @Get("get-user-subscription")
  // @UseGuards(AuthorizationGuard)
  async getUserSubscription(): Promise<{
    message: string;
    data: SubscriptionDto;
  }> {
    try {
      const data = await this.stripeService.getUserSubscription();
      return {
        message: "subscription retrieved successfully",
        data,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("/webhook")
  async webhookForStripeEvents(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const signature = req.headers["stripe-signature"];
    const endpointSecret = await this.configService.getOrThrow(
      "WEBHOOK_SIGNING_SECRET"
    );

    const processed = await this.stripeService.listenToStripeEvents(
      body,
      // signature
      endpointSecret
    );
    if (processed) {
      res.send();
    } else {
      res.sendStatus(400);
    }
  }
}
