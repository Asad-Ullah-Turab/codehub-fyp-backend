import express from "express";
import cors from "cors";
import loggerConfig from "./config/logger.js";
import codeExecutionRoutes from "./routes/codeExecutionRoutes.js";

const app = express();

const environment = process.env.NODE_ENV || "development";
const logger = loggerConfig[environment];

if (Array.isArray(logger)) {
  logger.forEach((loggerMiddleware) => app.use(loggerMiddleware));
} else {
  app.use(logger);
}

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("CodeHub Backend API 🚀");
});

app.use('/api/code', codeExecutionRoutes);

export default app;
