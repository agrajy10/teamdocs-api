import db from "../db/index.js";

const injectDb = (req, res, next) => {
  req.db = db;
  next();
};

export default injectDb;
