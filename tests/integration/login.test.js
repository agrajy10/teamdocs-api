import request from "supertest";
import app from "../helpers/testApp";
import { begin, rollback } from "../helpers/db";
import seedUser from "../helpers/seedUser";

beforeEach(async () => {
  await begin();
});

const endpoint = "/auth/login";

describe(`POST ${endpoint}`, () => {
  it("rejects invalid request", async () => {
    const res = await request(app).post(endpoint).send({
      email: "test",
      password: "",
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid credentials", async () => {
    await seedUser();
    const res = await request(app).post(endpoint).send({
      email: "test@example.com",
      password: "WrongPass1!",
    });
    expect(res.status).toBe(401);
  });

  it("starts a session", async () => {
    await seedUser();
    const res = await request(app).post(endpoint).send({
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

afterEach(async () => {
  await rollback();
});
