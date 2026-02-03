import request from "supertest";
import app from "../helpers/testApp";
import { begin, rollback } from "../helpers/db";
import seedUser from "../helpers/seedUser.js";
import db from "../../db/index.js";
import setupAuth from "../helpers/setupAuth.js";

beforeEach(async () => {
  await begin();
});

afterEach(async () => {
  await rollback();
});

describe("GET /users", () => {
  it.each(["admin", "manager"])("allows %s to view all users", async (role) => {
    const [user] = await seedUser({
      role,
      email: `${role}_users@example.com`,
    });
    const { sessionId, csrfToken } = await setupAuth(user);

    const res = await request(app)
      .get("/users")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(Array.isArray(res.body.users)).toBe(true);
    // Should verify at least the user is in the list
    const userInList = res.body.users.find(
      (u) => u.email === `${role}_users@example.com`,
    );
    expect(userInList).toBeDefined();
  });

  it("prevents member from viewing all users", async () => {
    const [member] = await seedUser({
      role: "member",
      email: "member_users@example.com",
    });
    const { sessionId, csrfToken } = await setupAuth(member);

    const res = await request(app)
      .get("/users")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Access denied");
  });

  it("returns 401 if not authenticated", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
  });
});

describe("DELETE /users/:id", () => {
  it("allows admin to delete a user", async () => {
    const [admin] = await seedUser({
      role: "admin",
      email: "admin_delete@example.com",
    });
    const [targetUser] = await seedUser({
      role: "member",
      email: "target_delete@example.com",
    });
    const { sessionId, csrfToken } = await setupAuth(admin);

    const res = await request(app)
      .delete(`/users/${targetUser.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deletedUser = await db.oneOrNone(
      "SELECT * FROM users WHERE id = $1",
      [targetUser.id],
    );
    expect(deletedUser).toBeNull();
  });

  it.each(["member", "manager"])(
    "prevents %s from deleting a user",
    async (role) => {
      const [actor] = await seedUser({
        role,
        email: `${role}_delete@example.com`,
      });
      const [targetUser] = await seedUser({
        role: "member",
        email: `target_delete_${role}@example.com`,
      });
      const { sessionId, csrfToken } = await setupAuth(actor);

      const res = await request(app)
        .delete(`/users/${targetUser.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");

      const notDeletedUser = await db.oneOrNone(
        "SELECT * FROM users WHERE id = $1",
        [targetUser.id],
      );
      expect(notDeletedUser).not.toBeNull();
    },
  );

  it("returns 401 if not authenticated", async () => {
    const [targetUser] = await seedUser({
      role: "member",
      email: "target_delete3@example.com",
    });
    const res = await request(app).delete(`/users/${targetUser.id}`);
    expect(res.status).toBe(401);
  });
});
