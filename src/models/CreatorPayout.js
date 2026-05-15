import mongoose from "mongoose";

const creatorPayoutSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    // Revenue snapshot for that month
    totalPremiumRevenue: { type: Number, default: 0 },
    // Enrollment counts used to calculate the share
    creatorEnrollments: { type: Number, default: 0 },
    totalEnrollments: { type: Number, default: 0 },
    enrollmentShare: { type: Number, default: 0 }, // 0–1 fraction
    // 40 % of total premium revenue is the pool distributed to all creators
    sharePool: { type: Number, default: 0 },
    payoutAmount: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    // Stripe transfer details
    stripeTransferId: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "skipped"],
      default: "pending",
    },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true },
);

creatorPayoutSchema.index({ creator: 1, month: 1, year: 1 }, { unique: true });
creatorPayoutSchema.index({ status: 1 });

const CreatorPayout = mongoose.model("CreatorPayout", creatorPayoutSchema);
export default CreatorPayout;
