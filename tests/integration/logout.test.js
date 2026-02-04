import request from "supertest";
import app from "../helpers/testApp";
import { begin, rollback } from "../helpers/db";
import seedUser from "../helpers/seedUser";
import seedTeam from "../helpers/seedTeam";

let teamId;
beforeEach(async () => {
  await begin();
  teamId = await seedTeam();
});

const endpoint = "/auth/logout";
describe(`POST ${endpoint}`, () => {
  it("deletes an existing session", async () => {
    await seedUser({ teamId });
    const loginResponse = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "StrongPass1!",
    });

    expect(loginResponse.status).toBe(200);

    const cookies = loginResponse.get("Set-Cookie");

    const res = await request(app).post(endpoint).set("Cookie", cookies);

    expect(res.status).toBe(200);
  });
});

afterEach(async () => {
  await rollback();
});
