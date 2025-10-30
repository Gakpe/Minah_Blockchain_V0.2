import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec, swaggerUiOptions } from "./config/swagger";
import investorRoutes from "./routes/investor.routes";
import vaultRoutes from "./routes/vault.routes";
import investmentStateRoutes from "./routes/investment-state.routes";
import helloRoutes from "./routes/hello.routes";
import chronometerRoutes from "./routes/chronometer.routes";
import releaseRoutes from "./routes/release.routes";
import contractInfoRoutes from "./routes/contract-info.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Stellar Minah Backend is running.",
    documentation: "/api-docs",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/investors", investorRoutes);
app.use("/api/vaults", vaultRoutes);
app.use("/api/investment-state", investmentStateRoutes);
app.use("/api/hello", helloRoutes);
app.use("/api/chronometer", chronometerRoutes);
app.use("/api/release", releaseRoutes);
app.use("/api/contract-info", contractInfoRoutes);

export default app;
