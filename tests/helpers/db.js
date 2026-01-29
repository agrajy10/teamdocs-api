import db from "../../db/index.js";

export async function begin() {
  await db.query("BEGIN");
}

export async function rollback() {
  await db.query("ROLLBACK");
}
