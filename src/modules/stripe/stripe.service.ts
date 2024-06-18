import { Inject, Injectable } from "@nestjs/common";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
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

      // console.log("prices", prices);

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

      // console.log("session", session.url);

      return session.url;
    } catch (error) {
      console.error("Error creating stripe session:", error);
      throw error; // Re-throw for controller handling
    }
  }

  async listenToStripeEvents(
    request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    response: Response<any, Record<string, any>>
  ) {
    let event = request.body;
    // Replace this endpoint secret with your endpoint's unique secret
    // If you are testing with the CLI, find the secret by running 'stripe listen'
    // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    // at https://dashboard.stripe.com/webhooks
    const endpointSecret = "whsec_12345";
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers["stripe-signature"];
      try {
        event = this.stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }
    let subscription;
    let status: string;
    // Handle the event
    switch (event.type) {
      case "customer.subscription.trial_will_end":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription trial ending.
        // handleSubscriptionTrialEnding(subscription);
        break;
      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case "customer.subscription.created":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case "customer.subscription.updated":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;
      case "entitlements.active_entitlement_summary.updated":
        subscription = event.data.object;
        console.log(`Active entitlement summary updated for ${subscription}.`);
        // Then define and call a method to handle active entitlement summary updated
        // handleEntitlementUpdated(subscription);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
  }
}
