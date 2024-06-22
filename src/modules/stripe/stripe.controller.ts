import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { Request, Response } from "express";
import Stripe from "stripe";

import { CreateSubscriptionDto } from "../dto/create-subscription-dto";
import { AuthorizationGuard } from "../../guards/authorization.guard";
import { CreateCheckoutSessionDto } from "../dto/create-checkout-session-dto";

import { ConfigService } from "@nestjs/config";

@Controller("payments/stripe")
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private readonly configService: ConfigService
  ) {}

  // @Post("create-subscription")
  // @UseGuards(AuthorizationGuard)
  // async createSubscription(
  //   @Body() createSubscriptionDto: CreateSubscriptionDto
  // ): Promise<{ subscriptionId: string; clientSecret: string }> {
  //   const { user_id, priceId } = createSubscriptionDto;

  //   try {
  //     const subscription = await this.stripeService.createSubscription(
  //       user_id,
  //       priceId
  //     );
  //     return {
  //       subscriptionId: subscription.id,
  //       clientSecret: subscription.latest_invoice.payment_intent.client_secret,
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: error.message },
  //       HttpStatus.BAD_REQUEST
  //     );
  //   }
  // }

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
    sessionUrl: string;
  }> {
    const { lookup_key } = createCheckoutSessionDto;
    try {
      await this.stripeService.updateSubscription(lookup_key);
      return {
        message: "subscription updated successfully",
        sessionUrl: "/",
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
