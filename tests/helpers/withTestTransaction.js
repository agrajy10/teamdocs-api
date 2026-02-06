import db from "../../db/index.js";
import createTestApp from "./testApp.js";

export async function withTestTransaction(testFn) {
  await db
    .tx(async (t) => {
      const app = createTestApp(t);
      await testFn(t, app);
      throw new Error("ROLLBACK");
    })
    .catch((err) => {
      if (err.message !== "ROLLBACK") {
        throw err;
      }
    });
}
