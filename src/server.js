import http from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import containerManager from "../src/services/containerManager.js";
import codeExecutorWSService from "../src/services/codeExecutorWSService.js";
import monthlyResetService from "../src/services/monthlyResetService.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// WebSocket server for interactive code execution
const wss = new WebSocketServer({ noServer: true });

const parseCookieToken = (cookieHeader = "") => {
  const match = cookieHeader.match(/(?:^|;\s*)jwt=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

server.on("upgrade", (request, socket, head) => {
  if (!request.url.startsWith("/ws/execute")) {
    socket.destroy();
    return;
  }

  const token = parseCookieToken(request.headers.cookie);
  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws) => {
  let sessionStarted = false;

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "execute" && !sessionStarted) {
        const { code, language } = msg;
        const validLanguages = ["python", "javascript", "cpp"];

        if (!code || !language || !validLanguages.includes(language)) {
          ws.send(JSON.stringify({ type: "error", data: "Invalid code or language" }));
          ws.send(JSON.stringify({ type: "done", exit_code: -1 }));
          return;
        }

        sessionStarted = true;
        await codeExecutorWSService.executeInteractive(code, language, ws);
      }
    } catch (err) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "error", data: err.message }));
      }
    }
  });

  ws.on("error", (err) => console.error("Client WS error:", err.message));
});

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
