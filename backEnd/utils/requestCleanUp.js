const cron = require("node-cron");
const ServiceRequest = require("../models/serviceRequestModel");

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Delete Completed requests older than 7 days
    const deletedCompleted = await ServiceRequest.deleteMany({
      status: "Completed" || "Pending",
      completedAt: { $lt: sevenDaysAgo },
    });

    console.log(
      `🧼 Cleanup complete: ${deletedPending.deletedCount} pending and ${deletedCompleted.deletedCount} completed requests deleted.`
    );
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  }
});
