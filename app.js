import e from "express";
const app = e();
const port = 3000;
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";

app.use(e.json());
app.use(cookieParser());
app.set("trust proxy", true);
app.use("/auth", authRoutes);

if (process.env.NODE_ENV === "TEST") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config();
}

app.listen(port, () => {
  console.log(`App is running on port : ${port}`);
});
