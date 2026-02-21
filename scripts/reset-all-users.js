// Reset all manually upgraded users back to free plan
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codehub');
    
    // Find all users with premium plans or test stripe IDs
    const premiumUsers = await User.find({
      $or: [
        { subscriptionPlan: 'premium' },
        { stripeCustomerId: { $in: ['cus_test_manual', null] } },
        { stripeSubscriptionId: { $in: ['sub_test_manual', null] } }
      ]
    });
    
    console.log(`Found ${premiumUsers.length} users to reset:`);
    
    for (const user of premiumUsers) {
      console.log(`📧 Resetting: ${user.email} (${user.subscriptionPlan || 'free'})`);
      
      // Reset to original free plan state
      user.subscriptionPlan = 'free';
      user.subscriptionStatus = 'none';
      user.stripeCustomerId = null;
      user.stripeSubscriptionId = null;
      user.subscriptionStart = null;
      user.chatQueriesRemaining = 5;
      user.codeQueriesRemaining = 5;
      user.tutorialGenRemaining = 5;
      
      await user.save({ validateBeforeSave: false });
    }
    
    console.log('✅ All users reset to free plan successfully!');
    console.log('🔄 Ready for clean webhook testing');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetAllUsers();