import { jest } from '@jest/globals';

import { createCheckoutSession, getSubscriptionStatus, cancelSubscription, __setStripeService, __setSubscriptionCancellationModel } from '../../src/controllers/subscriptionController.js';

// create a simple mock stripe service that tests can manipulate
const mockStripe = {
  createCheckoutSession: jest.fn(),
  cancelSubscription: jest.fn(),
};
// override the controller's stripe service reference
__setStripeService(mockStripe);

// create a mock subscription cancellation model
const mockCancellation = { create: jest.fn() };
__setSubscriptionCancellationModel(mockCancellation);

// use mock objects for assertions later
const stripeService = mockStripe;
const SubscriptionCancellation = mockCancellation;



describe('Subscription Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { user: null, headers: {}, connection: { remoteAddress: '127.0.0.1' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // reset mocks on stripe service
    if (stripeService.createCheckoutSession && stripeService.createCheckoutSession.mockReset) {
      stripeService.createCheckoutSession.mockReset();
    }
    if (stripeService.cancelSubscription && stripeService.cancelSubscription.mockReset) {
      stripeService.cancelSubscription.mockReset();
    }

    // reset subscription cancellation mock
    if (SubscriptionCancellation.create && SubscriptionCancellation.create.mockReset) {
      SubscriptionCancellation.create.mockReset();
    }
  });

  it('should return 401 when user not authenticated on create session', async () => {
    await createCheckoutSession(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
  });

  it('should call stripe and return url when user present', async () => {
    req.user = { email: 'test@example.com' };
    stripeService.createCheckoutSession.mockResolvedValue({ url: 'https://stripe.test/session' });
    await createCheckoutSession(req, res);
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(req.user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { url: 'https://stripe.test/session' } });
  });

  it('should report error if stripeService throws', async () => {
    req.user = { email: 'test@example.com' };
    stripeService.createCheckoutSession.mockRejectedValue(new Error('stripe error'));
    await createCheckoutSession(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'stripe error' });
  });

  it('should return subscription status for logged in user', async () => {
    const now = new Date();
    req.user = {
      subscriptionPlan: 'free',
      subscriptionStatus: 'none',
      chatQueriesRemaining: 5,
      codeQueriesRemaining: 5,
      tutorialGenRemaining: 5,
    };
    await getSubscriptionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        plan: 'free',
        status: 'none',
        chatQueriesRemaining: 5,
        codeQueriesRemaining: 5,
        tutorialGenRemaining: 5,
      },
    });
  });

  it('should cancel an existing subscription when user has one', async () => {
    req.user = { _id: 'u1', stripeSubscriptionId: 'sub_123' };
    stripeService.cancelSubscription.mockResolvedValue({ id: 'sub_123', status: 'canceled' });
    SubscriptionCancellation.create.mockResolvedValue({});

    await cancelSubscription(req, res);
    expect(stripeService.cancelSubscription).toHaveBeenCalledWith(req.user);
    expect(SubscriptionCancellation.create).toHaveBeenCalledWith(expect.objectContaining({
      user: req.user._id,
      stripeSubscriptionId: req.user.stripeSubscriptionId,
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'sub_123', status: 'canceled' } });
  });

  it('should still respond success when cancellation record fails', async () => {
    req.user = { _id: 'u1', stripeSubscriptionId: 'sub_123' };
    stripeService.cancelSubscription.mockResolvedValue({ id: 'sub_123', status: 'canceled' });
    SubscriptionCancellation.create.mockRejectedValue(new Error('db error'));
    await cancelSubscription(req, res);
    expect(stripeService.cancelSubscription).toHaveBeenCalledWith(req.user);
    expect(SubscriptionCancellation.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 when cancelling without an active subscription', async () => {
    req.user = {};
    await cancelSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No active subscription found' });
  });

  it('should return 401 when user not authenticated on cancel', async () => {
    req.user = null;
    await cancelSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
  });

  it('should respond success when stripe reports missing subscription id', async () => {
    req.user = { _id: 'u1', stripeSubscriptionId: 'sub_123' };
    stripeService.cancelSubscription.mockResolvedValue({ id: null, status: 'canceled' });

    await cancelSubscription(req, res);
    expect(stripeService.cancelSubscription).toHaveBeenCalledWith(req.user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: null, status: 'canceled' },
    });
  });
});