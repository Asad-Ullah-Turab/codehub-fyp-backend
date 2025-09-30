import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import loggerConfig from "./config/logger.js";
import codeExecutionRoutes from "./routes/codeExecutionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/database.js";
import passport from "./config/passport.js";

// Connect to MongoDB
connectDB();

const app = express();

const environment = process.env.NODE_ENV || "development";
const logger = loggerConfig[environment];

if (Array.isArray(logger)) {
  logger.forEach((loggerMiddleware) => app.use(loggerMiddleware));
} else {
  app.use(logger);
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Session configuration for OAuth
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "your-session-secret-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("CodeHub Backend API 🚀");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/code", codeExecutionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error"
  });
});

export default app;
