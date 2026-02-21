# 🔗 Stripe Webhook Local Development Guide

Complete guide for running Stripe webhooks in your local development environment.

## 📋 Prerequisites

- Node.js backend running on `localhost:5000`
- Stripe account with test API keys
- Windows development environment

## 🛠️ Setup Steps

### 1. Install Stripe CLI

```powershell
# Install Scoop (if not already installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Stripe CLI
scoop install stripe

# Verify installation
stripe --version
```

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID_PREMIUM=price_your_price_id_here

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Backend Middleware Setup

**Critical**: Webhook routes must come BEFORE `express.json()` middleware:

```javascript
// ❌ WRONG - JSON middleware parses body first
app.use(express.json());
app.use("/api/subscriptions", subscriptionRoutes);

// ✅ CORRECT - Webhook route gets raw body
app.use("/api/subscriptions", subscriptionRoutes);
app.use(express.json());
```

### 4. Webhook Route Configuration

```javascript
// routes/subscriptionRoutes.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  subscriptionController.stripeWebhook,
);
```

## 🚀 Running Webhooks Locally

### Step 1: Start Your Backend Server

```powershell
cd codehub-backend
npm start
# Server should be running on localhost:5000
```

### Step 2: Authenticate Stripe CLI

```powershell
# Add Stripe CLI to PATH (run this each time you open new terminal)
$env:PATH += ";$env:USERPROFILE\scoop\shims"

# Login to your Stripe account
stripe login
```

### Step 3: Start Webhook Listener

```powershell
# Navigate to your backend directory
cd C:\Development\CodeHub\codehub-backend

# Ensure Stripe CLI is in PATH
$env:PATH += ";$env:USERPROFILE\scoop\shims"

# Start webhook listener
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```

**Expected Output:**

```
> Ready! You are using Stripe API Version [2026-01-28.clover]
> Your webhook signing secret is whsec_51e1393358d84f2bdfb9d43d35a9081559bc28f8e90c2562ac60208a67b9c026
```

### Step 4: Update Webhook Secret

Copy the webhook secret from Step 3 output and update your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_51e1393358d84f2bdfb9d43d35a9081559bc28f8e90c2562ac60208a67b9c026
```

**Restart your backend server** after updating the webhook secret.

## 🧪 Testing Webhooks

### Method 1: Real Payment Test

1. Go to `http://localhost:5173/upgrade`
2. Login with test user
3. Use test card: `4242 4242 4242 4242`
4. Complete payment process

**Watch for:**

- Stripe CLI shows webhook events
- Backend logs show processing
- User account upgraded automatically

### Method 2: Trigger Test Events

```powershell
# Trigger a test checkout completion
stripe trigger checkout.session.completed
```

### Method 3: Manual Event Testing

```powershell
# Test webhook endpoint directly
Invoke-WebRequest -Uri "http://localhost:5000/api/subscriptions/webhook" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"test":"data"}'
# Expected: "Webhook Error: No stripe-signature header" (this is correct!)
```

## 📊 Expected Logs

### Successful Webhook Processing:

```
🎯 WEBHOOK RECEIVED - Full Debug: {
  signature: true,
  secret: true,
  bodyType: 'object'
}

🔐 ATTEMPTING EVENT CONSTRUCTION...
✅ EVENT VERIFIED WITH SIGNATURE
✅ WEBHOOK EVENT CONSTRUCTED: { type: 'checkout.session.completed' }

🚀 STARTING WEBHOOK EVENT PROCESSING...
🎯 STRIPE SERVICE: Processing webhook event: checkout.session.completed
🔍 PROCESSING CHECKOUT SESSION COMPLETED
🔎 SEARCHING FOR USER WITH EMAIL: user@example.com
👤 USER SEARCH RESULT: Found: user@example.com
✅ FOUND USER - UPDATING SUBSCRIPTION
💾 SAVING USER TO DATABASE...
🎉 USER SUCCESSFULLY UPGRADED TO PREMIUM!
```

### Stripe CLI Logs:

```
2026-02-22 01:18:01   --> checkout.session.completed [evt_xxx]
2026-02-22 01:18:01  <--  [200] POST http://localhost:5000/api/subscriptions/webhook [evt_xxx]
```

## 🛠️ Troubleshooting

### Issue: `stripe: command not found`

**Solution:**

```powershell
# Add to PATH each terminal session
$env:PATH += ";$env:USERPROFILE\scoop\shims"

# Or add permanently to system PATH
```

### Issue: `[400] Webhook signature verification failed`

**Causes:**

- Webhook secret mismatch
- Middleware order wrong
- Body parsing issues

**Solution:**

1. Copy correct webhook secret from `stripe listen` output
2. Ensure webhook routes come before `express.json()`
3. Restart backend after changing `.env`

### Issue: `bodyType: 'object'` instead of raw

**Solution:**
Move subscription routes BEFORE `express.json()` middleware in `app.js`

### Issue: User not found in database

**Check:**

- Email matches between Stripe checkout and your database
- User exists and email is correct
- MongoDB connection working

### Issue: Events not forwarding

**Check:**

- Backend server running on port 5000
- Stripe CLI authenticated (`stripe login`)
- Correct webhook URL format

## 🔒 Security Notes

### Development vs Production

**Development (Local):**

- Uses Stripe CLI for webhook forwarding
- Test API keys only
- Webhook secret changes each session

**Production:**

- Configure webhooks directly in Stripe Dashboard
- Use live API keys
- Static webhook endpoint and secret

### Webhook Endpoint Security

- Always verify Stripe signatures
- Use HTTPS in production
- Keep webhook secrets secure
- Log webhook events for debugging

## 📚 Quick Reference

### MAIN COMMANDS

{

### Essential Commands:

```powershell
# Setup PATH
$env:PATH += ";$env:USERPROFILE\scoop\shims"

# Start webhook listener
stripe listen --forward-to localhost:5000/api/subscriptions/webhook

# Test webhook
stripe trigger checkout.session.completed

# Check Stripe CLI version
stripe --version
```

}

### Key Files:

- `.env` - Environment variables
- `src/app.js` - Middleware order
- `src/routes/subscriptionRoutes.js` - Webhook route
- `src/controllers/subscriptionController.js` - Webhook handler
- `src/services/stripeService.js` - Event processing

## ✅ Success Checklist

- [ ] Stripe CLI installed and authenticated
- [ ] Backend server running on localhost:5000
- [ ] Webhook listener active and showing "Ready!"
- [ ] Environment variables configured
- [ ] Middleware order correct (webhooks before express.json)
- [ ] Test payment completes successfully
- [ ] User account upgrades automatically
- [ ] Stripe CLI shows [200] responses

---

## 🆘 Need Help?

1. Check backend logs for detailed error messages
2. Verify Stripe CLI is forwarding events
3. Ensure webhook secret matches between CLI and .env
4. Test with `stripe trigger` commands
5. Verify user exists in database with correct email

Your webhook system should now automatically process subscription upgrades! 🎉
