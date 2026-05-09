import mongoose from "mongoose";

const subscriptionCancellationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stripeSubscriptionId: { type: String },
    reason: { type: String, default: null },
    cancelledAt: { type: Date, default: Date.now },
    // additional metadata if desired
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true },
);

const SubscriptionCancellation = mongoose.model(
  "SubscriptionCancellation",
  subscriptionCancellationSchema,
);

export default SubscriptionCancellation;
