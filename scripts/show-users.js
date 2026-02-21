// Show available users for manual upgrade
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function showUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codehub');
    
    const users = await User.find({}).select('email name subscriptionPlan').limit(10);
    
    console.log('📧 Available user accounts:');
    users.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} (${user.name}) - Plan: ${user.subscriptionPlan || 'free'}`);
    });
    
    console.log('\n💡 To upgrade any user to premium:');
    console.log('   node manual-upgrade.js <email>');
    console.log('   Example: node manual-upgrade.js user@example.com');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

showUsers();