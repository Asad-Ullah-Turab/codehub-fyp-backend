// Temporary script to manually upgrade user to premium for testing
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function upgradeUserToPremium(userEmail) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codehub');
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User with email ${userEmail} not found`);
      return;
    }
    
    // Update to premium
    user.subscriptionPlan = 'premium';
    user.subscriptionStatus = 'active';
    user.stripeCustomerId = 'cus_test_manual';
    user.stripeSubscriptionId = 'sub_test_manual';
    user.subscriptionStart = new Date();
    user.chatQueriesRemaining = 9999;
    user.codeQueriesRemaining = 9999;
    user.tutorialGenRemaining = 9999;
    
    await user.save({ validateBeforeSave: false });
    
    console.log(`✅ Successfully upgraded ${userEmail} to premium!`);
    console.log(`   Plan: ${user.subscriptionPlan}`);
    console.log(`   Status: ${user.subscriptionStatus}`);
    console.log(`   Chat queries: ${user.chatQueriesRemaining}`);
    console.log(`   Code queries: ${user.codeQueriesRemaining}`);
    console.log(`   Tutorial gen: ${user.tutorialGenRemaining}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get email from command line argument
const userEmail = process.argv[2];
if (!userEmail) {
  console.log('Usage: node manual-upgrade.js <user-email>');
  console.log('Example: node manual-upgrade.js user@example.com');
  process.exit(1);
}

upgradeUserToPremium(userEmail);