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
import { CreateSubscriptionDto } from "../dto/create-subscription-dto";
import { AuthorizationGuard } from "../../guards/authorization.guard";
import { CreateCheckoutSessionDto } from "../dto/create-checkout-session-dto";
import { Request, Response } from "express";

@Controller("payments/stripe")
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post("create-subscription")
  @UseGuards(AuthorizationGuard)
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto
  ): Promise<{ subscriptionId: string; clientSecret: string }> {
    const { user_id, priceId } = createSubscriptionDto;

    try {
      const subscription = await this.stripeService.createSubscription(
        user_id,
        priceId
      );
      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("create-checkout-session")
  // @UseGuards(AuthorizationGuard)
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto
  ) {
    const { lookup_key } = createCheckoutSessionDto;
    try {
      const sessionUrl =
        await this.stripeService.createCheckoutSession(lookup_key);

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

  @Post("/webhook")
  async webhookForStripeEvents(
    @Req() request: Request,
    @Res() response: Response
  ) {
    await this.stripeService.listenToStripeEvents(request, response);
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
}
