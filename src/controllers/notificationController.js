import Notification from "../models/Notification.js";

// fetch notifications for logged-in user, optionally only unread
export const getNotifications = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const notifications = await Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// mark a specific notification as read
export const markAsRead = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.body;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Notification id required" });
    }
    const notif = await Notification.findOne({ _id: id, user: user._id });
    if (!notif) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    notif.isRead = true;
    await notif.save();
    res.status(200).json({ success: true, data: notif });
  } catch (err) {
    console.error("Error marking notification read:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// internal helper to create a notification (doesn't send response)
export const createNotification = async ({
  userId,
  type = "general",
  message,
  link = null,
}) => {
  try {
    const notif = await Notification.create({
      user: userId,
      type,
      message,
      link,
    });
    return notif;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
};

// mark all notifications for user as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    await Notification.updateMany({ user: user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error marking all notifications read:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllNotificationsRead,
  createNotification,
};
