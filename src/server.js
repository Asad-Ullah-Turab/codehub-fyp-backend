import http from "http";
import app from "../src/app.js";
import containerManager from "../src/services/containerManager.js";
import codeExecutorWSService from "../src/services/codeExecutorWSService.js";
import monthlyResetService from "../src/services/monthlyResetService.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Start containers before starting the server
async function startServer() {
  try {
    await containerManager.startAllContainers();
    
    // Start monthly reset service for free tier users
    monthlyResetService.start();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
let isShuttingDown = false;
async function shutdown() {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) return;
  isShuttingDown = true;

  // Close WebSocket connections
  codeExecutorWSService.closeAllConnections();

  // Stop monthly reset service
  monthlyResetService.stop();

  // Stop all containers
  await containerManager.stopAllContainers();

  // Close HTTP server
  server.close(() => {
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.on("error", (error) => {
  console.error("Server error:", error);
});

// Start the server
startServer();
