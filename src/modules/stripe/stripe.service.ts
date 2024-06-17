import { Inject, Injectable } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(@Inject("STRIPE_API_KEY") private readonly apiKey: string) {
    this.stripe = new Stripe(this.apiKey, {
      apiVersion: "2024-04-10",
    });
  }

  async createSubscription(userId: string, priceId: string): Promise<any> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: userId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });
      console.log(`Subscription created for customer: ${userId}`);
      return subscription;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error; // Re-throw for controller handling
    }
  }

  async createCheckoutSession(lookup_key: string): Promise<any> {
    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: [lookup_key],
        expand: ["data.product"],
      });
      const session = await this.stripe.checkout.sessions.create({
        billing_address_collection: "auto",
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
      return session.url;
    } catch (error) {
      console.error("Error creating stripe session:", error);
      throw error; // Re-throw for controller handling
    }
  }
}
