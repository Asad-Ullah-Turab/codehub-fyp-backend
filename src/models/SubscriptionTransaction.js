import mongoose from 'mongoose';

const subscriptionTransactionSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    stripeCustomerId: { 
      type: String, 
      required: true 
    },
    stripeSubscriptionId: { 
      type: String, 
      required: true,
      index: true
    },
    stripeInvoiceId: { 
      type: String,
      default: null
    },
    stripePaymentIntentId: { 
      type: String,
      default: null
    },
    // Transaction details
    type: { 
      type: String, 
      enum: ['subscription_created', 'subscription_renewed', 'subscription_cancelled', 'payment_failed', 'refund'],
      required: true,
      index: true
    },
    amount: { 
      type: Number, 
      required: true,
      default: 9.99 // Monthly premium price
    },
    currency: { 
      type: String, 
      default: 'usd' 
    },
    status: { 
      type: String, 
      enum: ['completed', 'failed', 'pending', 'refunded'],
      default: 'completed',
      index: true
    },
    // Subscription period
    periodStart: { 
      type: Date, 
      default: null 
    },
    periodEnd: { 
      type: Date, 
      default: null 
    },
    // Metadata
    description: { 
      type: String, 
      default: 'Premium Subscription' 
    },
    metadata: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
    // Analytics
    transactionDate: { 
      type: Date, 
      default: Date.now,
      index: true
    },
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
subscriptionTransactionSchema.index({ transactionDate: -1 });
subscriptionTransactionSchema.index({ type: 1, status: 1 });
subscriptionTransactionSchema.index({ user: 1, transactionDate: -1 });

// Static method to calculate total revenue
subscriptionTransactionSchema.statics.getTotalRevenue = async function() {
  const result = await this.aggregate([
    {
      $match: {
        type: { $in: ['subscription_created', 'subscription_renewed'] },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ]);
  return result[0] || { totalRevenue: 0, totalTransactions: 0 };
};

// Static method to get revenue by date range
subscriptionTransactionSchema.statics.getRevenueByDateRange = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        type: { $in: ['subscription_created', 'subscription_renewed'] },
        status: 'completed',
        transactionDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { 
          $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  return result;
};

// Static method to get monthly recurring revenue
subscriptionTransactionSchema.statics.getMonthlyRecurringRevenue = async function() {
  // Count active premium users and multiply by price
  const User = mongoose.model('User');
  const activePremiumUsers = await User.countDocuments({
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active'
  });
  return activePremiumUsers * 9.99;
};

const SubscriptionTransaction = mongoose.model(
  'SubscriptionTransaction',
  subscriptionTransactionSchema
);

export default SubscriptionTransaction;
