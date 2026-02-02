import env from "../constants/env.js";
import pgPromise from "pg-promise";

const isDev = env.ENV === "DEV";
const initOptions = {
  query(e) {
    if (isDev) {
      console.info("QUERY:", e.query);
      if (e.params) {
        console.info("PARAMS:", e.params);
      }
    }
  },
};

const pgp = pgPromise(initOptions);

const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  allowExitOnIdle: true,
  options: "-c search_path=public",
};

const db = pgp(dbConfig);

export default db;
