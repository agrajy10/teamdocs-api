import request from "supertest";
import app from "../helpers/testApp";
import { begin, rollback } from "../helpers/db";

beforeEach(async () => {
  await begin();
});

describe("POST /auth/register", () => {
  it("creates a user with member role", async () => {
    console.log("proccss", process.env.DB_PASSWORD);
    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
    });

    expect(res.status).toBe(201);
  });
});

afterEach(async () => {
  await rollback();
});
