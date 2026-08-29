import express from "express";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    express.json({
      limit: "1mb",
    }),
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "hotel-booking-backend",
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};