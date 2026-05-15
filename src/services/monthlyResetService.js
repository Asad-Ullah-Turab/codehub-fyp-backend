import cron from "node-cron";
import User from "../models/User.js";
import { processMonthlyCreatorPayouts } from "./stripeService.js";

/**
 * Monthly query reset service for free tier users
 * Resets chatQueriesRemaining, codeQueriesRemaining, and tutorialGenRemaining to 5
 * for users with subscriptionPlan: "free" on the 1st of every month at 00:00
 */

class MonthlyResetService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the monthly reset cron job
   */
  start() {
    if (this.isRunning) {
      console.log("Monthly reset service is already running");
      return;
    }

    // Run on the 1st of every month at 00:00
    this.cronJob = cron.schedule(
      "0 0 1 * *",
      async () => {
        await this.performMonthlyReset();
      },
      {
        scheduled: false,
        timezone: "UTC",
      },
    );

    this.cronJob.start();
    this.isRunning = true;
    console.log(
      "Monthly reset service started - will reset free user queries on 1st of every month at 00:00 UTC",
    );
  }

  /**
   * Stop the monthly reset cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log("Monthly reset service stopped");
    }
  }

  /**
   * Perform the actual monthly reset of query limits for free users
   */
  async performMonthlyReset() {
    try {
      console.log("Starting monthly query reset for free tier users...");

      const result = await User.updateMany(
        { subscriptionPlan: "free" },
        {
          $set: {
            chatQueriesRemaining: 5,
            codeQueriesRemaining: 5,
            tutorialGenRemaining: 5,
          },
        },
      );

      console.log(
        `Monthly reset completed: Updated ${result.modifiedCount} free tier users`,
      );

      // Log some statistics
      const freeUsersCount = await User.countDocuments({
        subscriptionPlan: "free",
      });
      const premiumUsersCount = await User.countDocuments({
        subscriptionPlan: "premium",
      });

      console.log(
        `Current user statistics: ${freeUsersCount} free users, ${premiumUsersCount} premium users`,
      );
    } catch (error) {
      console.error("Error during monthly query reset:", error);
    }

    // Process creator revenue share payouts
    try {
      await processMonthlyCreatorPayouts();
    } catch (error) {
      console.error("Error during monthly creator payouts:", error);
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerReset() {
    console.log("Manually triggering monthly reset...");
    await this.performMonthlyReset();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? this.cronJob.nextDate() : null,
    };
  }
}

// Create singleton instance
const monthlyResetService = new MonthlyResetService();

export default monthlyResetService;

// Export the performMonthlyReset method for direct access (useful for testing/admin triggers)
export const performMonthlyReset = () =>
  monthlyResetService.performMonthlyReset();

