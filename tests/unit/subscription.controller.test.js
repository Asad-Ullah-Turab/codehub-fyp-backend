import { createCheckoutSession, getSubscriptionStatus, cancelSubscription } from '../../src/controllers/subscriptionController.js';
import User from '../../src/models/User.js';
import SubscriptionCancellation from '../../src/models/SubscriptionCancellation.js';

// Mock stripe service so we don't hit external API
jest.mock('../../src/services/stripeService.js', () => ({
  createCheckoutSession: jest.fn(),
}));
import stripeService from '../../src/services/stripeService.js';

// mock cancellation model
jest.mock('../../src/models/SubscriptionCancellation.js', () => ({
  create: jest.fn(),
}));

describe('Subscription Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    stripeService.createCheckoutSession.mockReset();
    if (stripeService.cancelSubscription && stripeService.cancelSubscription.mockReset) {
      stripeService.cancelSubscription.mockReset();
    }
    if (SubscriptionCancellation.create) {
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
    stripeService.cancelSubscription = jest.fn().mockResolvedValue({ id: 'sub_123', status: 'canceled' });
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
    stripeService.cancelSubscription = jest.fn().mockResolvedValue({ id: 'sub_123', status: 'canceled' });
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
});