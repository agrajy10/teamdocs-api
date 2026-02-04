import request from "supertest";
import app from "../helpers/testApp";
import { begin, rollback } from "../helpers/db";
import db from "../../db/index.js";

let teamId;

beforeEach(async () => {
  await begin();
  const team = await db.one(
    "INSERT INTO teams (name) VALUES ($1) RETURNING id",
    ["Test Team"],
  );
  teamId = team.id;
});

afterEach(async () => {
  await rollback();
});

describe("POST /auth/register", () => {
  it("creates a user with member role", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
      team_id: teamId,
    });

    expect(res.status).toBe(201);
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
      team_id: teamId,
    });

    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
      team_id: teamId,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already exists");
  });

  it("rejects invalid role", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "randomRole",
      team_id: teamId,
    });

    expect(res.status).toBe(400);
  });

  it("rejects non-existent team", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "StrongPass1!",
      role: "member",
      team_id: "00000000-0000-0000-0000-000000000000",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Team does not exist");
  });

  it("rejects invalid request", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test",
      password: "",
      team_id: teamId,
    });
    expect(res.status).toBe(400);
  });
});
