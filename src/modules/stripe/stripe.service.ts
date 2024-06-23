import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { SubscriptionDto } from "../subscriptions/dto/subscription.dto";

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

  async createSubscriptionCheckout(lookup_key: string): Promise<string> {
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

  async updateSubscription(lookup_key: string): Promise<Stripe.Subscription> {
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
      console.error("Error updating subscription:", error);
      throw error; // Re-throw for controller handling
    }
  }

  async cancelSubscription(subscription_id: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscription_id);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error; // Re-throw for controller handling
    }
  }

  async getUserSubscription(): Promise<SubscriptionDto> {
    try {
      let customer_id = "cus_QLAusbOPLnIVoF";

      let subscription =
        await this.subscriptionService.getUserSubscription(customer_id);

      if (subscription) {
        const { name } = await this.stripe.products.retrieve(
          subscription.product_id
        );

        subscription.product_name = name;
      }

      return subscription;
    } catch (error) {
      console.error("Error geting user subscription:", error);
      throw error; // Re-throw for controller handling
    }
  }

  async listenToStripeEvents(
    body: any,
    // signature: string | string[],
    endpointSecret: string
  ) {
    if (endpointSecret) {
      try {
        const event = body;

        let subscription: any;
        let status: string;
        // Handle the event
        switch (event.type) {
          case "customer.subscription.deleted":
            subscription = event.data.object;
            status = subscription.status;
            console.log(`Subscription status is ${status}.`);
            await this.subscriptionService.deleteSubscription(subscription.id);

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
            await this.subscriptionService.updateSubscriptionInDB({
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
