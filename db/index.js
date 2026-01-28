import pgPromise from "pg-promise";

const isDev = process.env.NODE_ENV === "DEV";
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
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
};

const db = pgp(dbConfig);

export default db;
