import { cancelSubscription } from '../../src/services/stripeService.js';

// We'll manipulate the stripe client directly since the module exports it
import stripeService from '../../src/services/stripeService.js';
import { jest } from '@jest/globals';

describe('stripeService.cancelSubscription', () => {
  let user;

  beforeEach(() => {
    user = {
      _id: 'user1',
      stripeSubscriptionId: 'sub_abc',
      subscriptionStatus: 'active',
      subscriptionPlan: 'premium',
      chatQueriesRemaining: 999,
      codeQueriesRemaining: 999,
      tutorialGenRemaining: 999,
      save: jest.fn().mockResolvedValue(true),
    };
  });

  it('cancels subscription via Stripe and updates user record', async () => {
    stripeService.stripe.subscriptions.del = jest.fn().mockResolvedValue({
      id: 'sub_abc',
      status: 'canceled',
    });

    const result = await cancelSubscription(user);

    expect(stripeService.stripe.subscriptions.del).toHaveBeenCalledWith('sub_abc');
    expect(user.subscriptionStatus).toBe('canceled');
    expect(user.subscriptionPlan).toBe('free');
    expect(user.chatQueriesRemaining).toBe(5);
    expect(user.codeQueriesRemaining).toBe(5);
    expect(user.tutorialGenRemaining).toBe(5);
    expect(user.save).toHaveBeenCalled();
    expect(result).toEqual({ id: 'sub_abc', status: 'canceled' });
  });

  it('handles Stripe resource_missing error by clearing local id', async () => {
    const err = new Error('No such subscription');
    err.type = 'StripeInvalidRequestError';
    err.code = 'resource_missing';

    stripeService.stripe.subscriptions.del = jest.fn().mockRejectedValue(err);

    const result = await cancelSubscription(user);

    // subscription request attempted
    expect(stripeService.stripe.subscriptions.del).toHaveBeenCalledWith('sub_abc');
    // user got reset to free plan and id cleared
    expect(user.subscriptionPlan).toBe('free');
    expect(user.subscriptionStatus).toBe('canceled');
    expect(user.stripeSubscriptionId).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
    expect(result).toEqual({ id: null, status: 'canceled' });
  });

  it('throws if user has no stripeSubscriptionId', async () => {
    user.stripeSubscriptionId = undefined;
    await expect(cancelSubscription(user)).rejects.toThrow('No active subscription to cancel');
  });
});