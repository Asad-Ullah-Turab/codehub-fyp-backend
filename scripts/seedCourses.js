import seedCourses from "../utils/courseSeedData.js";

// Script to seed courses
const runSeed = async () => {
  try {
    await seedCourses();
    console.log("✨ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();
