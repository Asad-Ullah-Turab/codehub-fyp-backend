# Stripe Subscription Setup for CodeHub

This document describes the values you need to provide in your environment variables in order to enable the paid subscription feature. The backend uses Stripe's **checkout** flow for premium subscriptions and listens for webhooks to update user records.

> These instructions assume you are using Stripe in **test mode** for development. Replace the test keys with live keys when you're ready to go to production.

## 1. Create a Product & Price in Stripe

1. Log in to your Stripe dashboard (https://dashboard.stripe.com).
2. Create a new **Product** called something like "CodeHub Premium".
3. Under that product, create a **Recurring Price** (e.g. monthly) and note the **Price ID** (starts with `price_...`).
   - Make sure to set the appropriate currency and amount.
   - You can create multiple prices (monthly/annual) but only one is required for testing.

## 2. Environment Variables

Add the following variables to your `codehub-backend/.env` (see `.env.example` for formatting):

```dotenv
# Stripe configuration for subscriptions (test keys acceptable)
STRIPE_SECRET_KEY=sk_test_...      # your Stripe secret API key
STRIPE_WEBHOOK_SECRET=whsec_...    # the signing secret from your webhook endpoint
# ID of the recurring price configured in Stripe for the premium plan
STRIPE_PRICE_ID_PREMIUM=price_...
```

- **STRIPE_SECRET_KEY** – the secret key from the API keys page.
- **STRIPE_WEBHOOK_SECRET** – after you register your webhook endpoint (see next section), Stripe will give you a signing secret used to verify incoming payloads.
- **STRIPE_PRICE_ID_PREMIUM** – the price id you created for the subscription.

If you are running locally you can leave `STRIPE_WEBHOOK_SECRET` empty; the webhook handler will skip signature verification. For production this must be set.

## 3. Webhook Registration (Development)

To test the webhook locally:

1. Install and run the Stripe CLI: `stripe login` then `stripe listen --forward-to localhost:5000/api/subscriptions/webhook`.
2. After starting the listener, the CLI will print a `webhook secret` value (e.g. `whsec_...`). Copy that into `STRIPE_WEBHOOK_SECRET`.
3. The backend route `/api/subscriptions/webhook` expects raw JSON, so the CLI command above includes the correct forwarding.

The backend will automatically update a user document when events like `checkout.session.completed` or `invoice.payment_failed` are received.

## 4. Frontend Configuration

No Stripe secret key is required in the frontend. The client initiates the flow by calling the backend endpoint `/api/subscriptions/create-checkout-session` and then redirects the browser to the returned session URL.

The only frontend route you need to handle is `/upgrade` which simply kicks off the checkout flow and redirects the user.

## 5. Notes & Future Plans

- Free users are limited to 5 queries each for the general AI chatbot, the code assistant chatbot, and tutorial generation. Limits are stored on the user record and decremented automatically.
- The system is designed to be extensible; you can later implement a scheduled job to reset these counters monthly for free users or add more tiers.
- Admin users are automatically treated as premium and bypass all limits.
- The `subscriptionPlan` and `subscriptionStatus` fields on the user document indicate the current plan; you can extend them to support new tiers.

That's everything needed to get Stripe-based subscriptions running in CodeHub. Enjoy building your paid features!