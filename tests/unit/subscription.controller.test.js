import { createCheckoutSession, getSubscriptionStatus } from '../../src/controllers/subscriptionController.js';
import User from '../../src/models/User.js';

// Mock stripe service so we don't hit external API
jest.mock('../../src/services/stripeService.js', () => ({
  createCheckoutSession: jest.fn(),
}));
import stripeService from '../../src/services/stripeService.js';

describe('Subscription Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    stripeService.createCheckoutSession.mockReset();
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
});