import dotenv from "dotenv";

if (process.env.NODE_ENV === "TEST") {
  dotenv.config({ path: "../.env.test" });
} else {
  dotenv.config();
}

const env = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  ENV: process.env.NODE_ENV,
};

export default env;
