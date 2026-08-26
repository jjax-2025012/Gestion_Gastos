import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

// Solo se permite que el frontend de Angular (en local) consuma la API.
app.use(
  cors({
    origin: env.corsOrigin,
  })
);

app.use(express.json());

// Endpoint simple para comprobar que el servidor está vivo.
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);
