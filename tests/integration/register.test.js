import request from "supertest";
import app from "../helpers/testApp";
import { begin, rollback } from "../helpers/db";

beforeEach(async () => {
  await begin();
});

describe("POST /auth/register", () => {
  it("creates a user with member role", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
    });

    expect(res.status).toBe(201);
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
    });

    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already exists");
  });

  it("rejects invalid role", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "randomRole",
    });

    expect(res.status).toBe(400);
  });

  it("rejects invalid request", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test",
      password: "",
    });
    expect(res.status).toBe(400);
  });
});

afterEach(async () => {
  await rollback();
});
