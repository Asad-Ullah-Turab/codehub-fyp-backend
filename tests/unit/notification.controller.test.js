import { jest } from '@jest/globals';
import { getNotifications, markAsRead } from '../../src/controllers/notificationController.js';
import Notification from '../../src/models/Notification.js';

describe('Notification Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { user: null, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should require authentication for getNotifications', async () => {
    await getNotifications(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return notifications list', async () => {
    req.user = { _id: 'u1' };
    Notification.find = jest.fn().mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(['n1']) }) });
    await getNotifications(req, res);
    expect(Notification.find).toHaveBeenCalledWith({ user: req.user._id });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: ['n1'] });
  });

  it('should mark a notification read', async () => {
    req.user = { _id: 'u1' };
    req.body = { id: 'notif1' };
    Notification.findOne = jest.fn().mockResolvedValue({ isRead: false, save: jest.fn() });
    await markAsRead(req, res);
    expect(Notification.findOne).toHaveBeenCalledWith({ _id: 'notif1', user: req.user._id });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: expect.any(Object) });
  });
});
