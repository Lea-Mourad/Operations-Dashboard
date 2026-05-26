const cors = require("cors");
const express = require("express");

const auditRoutes = require("./routes/audit.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const eventsRoutes = require("./routes/events.routes");
const reviewsRoutes = require("./routes/reviews.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json());

app.use("/api", eventsRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", reviewsRoutes);
app.use("/api", auditRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use(errorHandler);

module.exports = {
  app,
};
