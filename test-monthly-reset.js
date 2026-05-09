import mongoose from "mongoose";
import User from "./src/models/User.js";
import monthlyResetService from "./src/services/monthlyResetService.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Test script to verify monthly reset functionality
async function testMonthlyReset() {
  try {
    // Connect to database (using test database)
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/codehub-test",
    );
    console.log("Connected to database");

    // Create test users with different query counts and subscription statuses
    const testUsers = [
      {
        name: "Free User One",
        username: "freeUser1",
        email: "free1@test.com",
        password: "TempPassword123!",
        subscriptionPlan: "free",
        subscriptionStatus: "active",
        chatQueriesRemaining: 2,
        codeQueriesRemaining: 1,
        tutorialGenRemaining: 0,
      },
      {
        name: "Free User Two",
        username: "freeUser2",
        email: "free2@test.com",
        password: "TempPassword123!",
        subscriptionPlan: "free",
        subscriptionStatus: "active",
        chatQueriesRemaining: 0,
        codeQueriesRemaining: 0,
        tutorialGenRemaining: 0,
      },
      {
        name: "Premium User",
        username: "premiumUser",
        email: "premium@test.com",
        password: "TempPassword123!",
        subscriptionPlan: "premium",
        subscriptionStatus: "active",
        chatQueriesRemaining: 9999,
        codeQueriesRemaining: 9999,
        tutorialGenRemaining: 9999,
      },
      {
        name: "Cancelled User",
        username: "cancelledUser",
        email: "cancelled@test.com",
        password: "TempPassword123!",
        subscriptionPlan: "free",
        subscriptionStatus: "canceled",
        chatQueriesRemaining: 3,
        codeQueriesRemaining: 2,
        tutorialGenRemaining: 1,
      },
    ];

    // Clean up existing test users
    await User.deleteMany({ email: { $in: testUsers.map((u) => u.email) } });

    // Insert test users
    await User.insertMany(testUsers);
    console.log("Created test users");

    // Get users before reset
    const beforeReset = await User.find({
      email: { $in: testUsers.map((u) => u.email) },
    });
    console.log("\nUsers BEFORE monthly reset:");
    beforeReset.forEach((user) => {
      console.log(
        `${user.email} (${user.subscriptionPlan}): Chat=${user.chatQueriesRemaining}, Code=${user.codeQueriesRemaining}, Tutorial=${user.tutorialGenRemaining}`,
      );
    });

    // Perform monthly reset
    console.log("\nPerforming monthly reset...");
    await monthlyResetService.performMonthlyReset();
    console.log("Reset completed");

    // Get users after reset
    const afterReset = await User.find({
      email: { $in: testUsers.map((u) => u.email) },
    });
    console.log("\nUsers AFTER monthly reset:");
    afterReset.forEach((user) => {
      console.log(
        `${user.email} (${user.subscriptionPlan}): Chat=${user.chatQueriesRemaining}, Code=${user.codeQueriesRemaining}, Tutorial=${user.tutorialGenRemaining}`,
      );
    });

    // Verify results
    const freeUsers = afterReset.filter((u) => u.subscriptionPlan === "free");
    const premiumUsers = afterReset.filter(
      (u) => u.subscriptionPlan === "premium",
    );

    console.log("\nVerification:");

    // Check free users have 5 queries each
    const correctFreeUsers = freeUsers.every(
      (user) =>
        user.chatQueriesRemaining === 5 &&
        user.codeQueriesRemaining === 5 &&
        user.tutorialGenRemaining === 5,
    );
    console.log(
      `✓ Free users reset to 5 queries: ${correctFreeUsers ? "PASS" : "FAIL"}`,
    );

    // Check premium users kept their limits
    const correctPremiumUsers = premiumUsers.every(
      (user) =>
        user.chatQueriesRemaining === 9999 &&
        user.codeQueriesRemaining === 9999 &&
        user.tutorialGenRemaining === 9999,
    );
    console.log(
      `✓ Premium users kept unlimited queries: ${correctPremiumUsers ? "PASS" : "FAIL"}`,
    );

    // Clean up test data
    await User.deleteMany({ email: { $in: testUsers.map((u) => u.email) } });
    console.log("\nCleaned up test users");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
    process.exit(0);
  }
}

// Run the test
testMonthlyReset();

