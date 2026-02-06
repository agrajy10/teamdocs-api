import { getDb } from "../../db/index.js";

export async function begin() {
  await getDb().query("BEGIN");
}

export async function rollback() {
  await getDb().query("ROLLBACK");
}
