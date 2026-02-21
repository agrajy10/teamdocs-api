import e from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import userRoutes from "./routes/users.js";
import injectDb from "./middleware/injectDb.js";
import teamsRoutes from "./routes/teams.js";

const app = e();
const port = 3000;

app.use(e.json());
app.use(cookieParser());
app.use(injectDb);
app.set("trust proxy", true);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/documents", documentRoutes);
app.use("/teams", teamsRoutes);

if (process.env.NODE_ENV !== "TEST") {
  app.listen(port, () => {
    console.log(`App is running on port : ${port}`);
  }, '0.0.0.0');
}

export default app;
