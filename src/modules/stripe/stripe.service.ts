import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import { SubscriptionsService } from "../subscriptions/subscriptions.service";

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @Inject("STRIPE_API_KEY") private readonly apiKey: string,
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionsService
  ) {
    this.stripe = new Stripe(this.apiKey, {
      apiVersion: "2024-04-10",
    });
  }

  // async createSubscription(userId: string, priceId: string): Promise<any> {
  //   try {
  //     const subscription = await this.stripe.subscriptions.create({
  //       customer: userId,
  //       items: [{ price: priceId }],
  //       payment_behavior: "default_incomplete",
  //       expand: ["latest_invoice.payment_intent"],
  //     });
  //     console.log(`Subscription created for customer: ${userId}`);
  //     return subscription;
  //   } catch (error) {
  //     console.error("Error creating subscription:", error);
  //     throw error; // Re-throw for controller handling
  //   }
  // }

  async createSubscriptionCheckout(lookup_key: string): Promise<any> {
    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: [lookup_key],
        expand: ["data.product"],
      });

      // console.log("prices", prices);

      const session = await this.stripe.checkout.sessions.create({
        billing_address_collection: "auto",
        customer: "cus_QLAusbOPLnIVoF",
        line_items: [
          {
            price: prices.data[0].id,
            // For metered billing, do not pass quantity
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `https://stripe-payments-nextjs.vercel.app/payment-success?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://stripe-payments-nextjs.vercel.app/payment-cancelled?canceled=true`,
      });

      // console.log("session", session.url);

      return session.url;
    } catch (error) {
      console.error("Error creating stripe session:", error);
      throw error; // Re-throw for controller handling
    }
  }

  async updateSubscription(lookup_key: string): Promise<any> {
    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: [lookup_key],
        expand: ["data.product"],
      });
      const subscriptionList = await this.stripe.subscriptions.list({
        customer: "cus_QLAusbOPLnIVoF",
      });
      const subscription = subscriptionList.data[0];
      const subscriptionItemId = subscription.items.data[0].id;
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscription.id,
        {
          items: [{ id: subscriptionItemId, price: prices.data[0].id }],
          proration_behavior: "always_invoice",
        }
      );
      return updatedSubscription;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error; // Re-throw for controller handling
    }
  }

  async listenToStripeEvents(
    body: any,
    // signature: string | string[],
    endpointSecret: string
  ) {
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      try {
        // const event = this.stripe.webhooks.constructEvent(
        //   JSON.stringify(body),
        //   signature,
        //   endpointSecret
        // );
        const event = body;

        let subscription;
        let status: string;
        // Handle the event
        switch (event.type) {
          case "customer.subscription.trial_will_end":
            subscription = event.data.object;
            status = subscription.status;
            // console.log(`Subscription status is ${status}.`);

            break;
          case "customer.subscription.deleted":
            subscription = event.data.object;
            status = subscription.status;
            // console.log(`Subscription status is ${status}.`);

            break;
          case "invoice.payment_succeeded":
            const invoice = event.data.object;
            status = invoice.status;
            console.log(`Invoice status is ${status}.`);
            // await this.stripe.invoices.sendInvoice(invoice.id);

            break;
          case "customer.subscription.created":
            subscription = event.data.object;
            status = subscription.status;
            console.log(`Subscription`, subscription);
            const {
              id: subscription_id,
              customer: customer_id,
              plan,
            } = subscription;
            const { product: product_id, amount } = plan;
            await this.subscriptionService.addSubscriptionToDB({
              subscription_id,
              customer_id,
              product_id,
              amount,
            });

            break;
          case "customer.subscription.updated":
            const updatedSubscription = event.data.object;
            const updatedStatus = updatedSubscription.status;
            const { id, customer, plan: updatedPlan } = updatedSubscription;
            const { product, amount: updatedAmount } = updatedPlan;
            await this.subscriptionService.addSubscriptionToDB({
              subscription_id: id,
              customer_id: customer,
              product_id: product,
              amount: updatedAmount,
            });
            console.log(`Subscription status is ${updatedStatus}.`);
            break;
          default:
            // Unexpected event type
            break;
          // console.log(`Unhandled event type ${event.type}.`);
        }
        return true;
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        throw new BadRequestException(err.message);
      }
    }
  }
}
