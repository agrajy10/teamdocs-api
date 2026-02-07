import request from "supertest";
import { withTestTransaction } from "../helpers/withTestTransaction.js";
import seedUser from "../helpers/seedUser.js";
import seedTeam from "../helpers/seedTeam.js";

const loginEndpoint = "/auth/login";
const logoutEndpoint = "/auth/logout";

describe(`POST ${loginEndpoint}`, () => {
  it("rejects invalid request", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app).post(loginEndpoint).send({
        email: "test",
        password: "",
      });
      expect(res.status).toBe(400);
    });
  });

  it("rejects invalid credentials", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      await seedUser(tx, { teamId });
      const res = await request(app).post(loginEndpoint).send({
        email: "test@example.com",
        password: "WrongPass1!",
      });
      expect(res.status).toBe(401);
    });
  });

  it("starts a session", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      await seedUser(tx, { teamId });
      const res = await request(app).post(loginEndpoint).send({
        email: "test@example.com",
        password: "StrongPass1!",
      });

      expect(res.status).toBe(200);

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const sessionCookie = cookies.find((c) => c.startsWith("session_id="));

      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain("HttpOnly");
    });
  });
});

describe(`POST ${logoutEndpoint}`, () => {
  it("deletes an existing session", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      await seedUser(tx, { teamId });
      const loginResponse = await request(app).post(loginEndpoint).send({
        email: "test@example.com",
        password: "StrongPass1!",
      });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const res = await request(app)
        .post(logoutEndpoint)
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
    });
  });
});
