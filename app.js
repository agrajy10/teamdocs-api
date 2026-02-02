import e from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import userRoutes from "./routes/users.js";

const app = e();
const port = 3000;

app.use(e.json());
app.use(cookieParser());
app.set("trust proxy", true);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/documents", documentRoutes);

if (process.env.NODE_ENV !== "TEST") {
  app.listen(port, () => {
    console.log(`App is running on port : ${port}`);
  });
}

export default app;
