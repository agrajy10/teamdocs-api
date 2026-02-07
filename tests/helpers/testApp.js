import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "../../routes/auth.js";
import userRoutes from "../../routes/users.js";
import documentRoutes from "../../routes/documents.js";
import teamsRoutes from "../../routes/teams.js";

function createTestApp(tx) {
  const app = express();

  app.use(express.json());
  app.use(express.json());
  app.use(cookieParser());
  app.set("trust proxy", true);

  // 👇 OVERRIDE db context
  app.use((req, res, next) => {
    req.db = tx; // same transaction for entire request
    next();
  });

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/documents", documentRoutes);
  app.use("/teams", teamsRoutes);

  return app;
}

export default createTestApp;
