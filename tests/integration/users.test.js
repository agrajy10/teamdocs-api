import request from "supertest";
import { withTestTransaction } from "../helpers/withTestTransaction.js";
import seedUser from "../helpers/seedUser.js";
import seedTeam from "../helpers/seedTeam.js";
import setupAuth from "../helpers/setupAuth.js";

describe("GET /users", () => {
  it.each(["admin"])(
    "returns 200 and lists same-team users, excludes requester (%s)",
    async (role) => {
      await withTestTransaction(async (tx, app) => {
        const teamId = await seedTeam(tx);
        const [actor] = await seedUser(tx, {
          role,
          email: `${role}_users@example.com`,
          teamId,
        });
        const [other] = await seedUser(tx, {
          role: "member",
          email: `other_${role}_users@example.com`,
          teamId,
        });
        const otherTeamId = await seedTeam(tx, "Other Team");
        await seedUser(tx, {
          role: "member",
          email: `cross_team_${role}_users@example.com`,
          teamId: otherTeamId,
        });
        const { sessionId, csrfToken } = await setupAuth(tx, actor);

        const res = await request(app)
          .get("/users")
          .set("Cookie", [
            `session_id=${sessionId}`,
            `csrf_token=${csrfToken}`,
          ]);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
        const emails = res.body.users.map((u) => u.email);
        expect(emails).toContain(other.email);
        expect(emails).not.toContain(actor.email);
        expect(emails).not.toContain(`cross_team_${role}_users@example.com`);
      });
    },
  );

  it("returns 403 for member role", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, {
        role: "member",
        email: "member_users_forbidden@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .get("/users")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app).get("/users");
      expect(res.status).toBe(401);
    });
  });
});

describe("DELETE /users/:id", () => {
  it("returns 200 and deletes target user when admin acts within same team", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_delete@example.com",
        teamId,
      });
      const [target] = await seedUser(tx, {
        role: "member",
        email: "target_delete@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .delete(`/users/${target.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken);
      expect(res.status).toBe(200);
      const found = await tx.oneOrNone("SELECT id FROM users WHERE id = $1", [
        target.id,
      ]);
      expect(found).toBeNull();
    });
  });

  it.each(["member"])("returns 403 when %s attempts delete", async (role) => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [actor] = await seedUser(tx, {
        role,
        email: `${role}_delete_attempt@example.com`,
        teamId,
      });
      const [target] = await seedUser(tx, {
        role: "member",
        email: `target_delete_${role}@example.com`,
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, actor);
      const res = await request(app)
        .delete(`/users/${target.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");
      const found = await tx.oneOrNone("SELECT id FROM users WHERE id = $1", [
        target.id,
      ]);
      expect(found).not.toBeNull();
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (tx, app) => {
      const [target] = await seedUser(tx, {
        role: "member",
        email: "target_delete_unauth@example.com",
        teamId: await seedTeam(tx),
      });
      const res = await request(app).delete(`/users/${target.id}`);
      expect(res.status).toBe(401);
    });
  });

  it("returns 404 when target user does not exist", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_delete_notfound@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .delete("/users/00000000-0000-0000-0000-000000000000")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken);
      expect(res.status).toBe(404);
    });
  });

  it("returns 404 when target user is in a different team", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const otherTeamId = await seedTeam(tx, "Other Team");
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_delete_cross_team@example.com",
        teamId,
      });
      const [target] = await seedUser(tx, {
        role: "member",
        email: "target_cross_team@example.com",
        teamId: otherTeamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .delete(`/users/${target.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken);
      expect(res.status).toBe(404);
    });
  });
});

describe("POST /users/create", () => {
  it("returns 201 for admin; persists user with same team; password hashed", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_create_member@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .post("/users/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ email: "new_member@example.com", password: "StrongPass1!" });
      expect(res.status).toBe(201);
      const created = await tx.one(
        "SELECT team_id, password_hash FROM users WHERE email = $1",
        ["new_member@example.com"],
      );
      expect(created.team_id).toBe(teamId);
      expect(created.password_hash).not.toBe("StrongPass1!");
    });
  });

  it("returns 403 for member (no create permission)", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, {
        role: "member",
        email: "member_cannot_create@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .post("/users/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ email: "blocked@example.com", password: "StrongPass1!" });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app)
        .post("/users/create")
        .send({ email: "unauth@example.com", password: "StrongPass1!" });
      expect(res.status).toBe(401);
    });
  });

  it("returns 401 when CSRF token is missing", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_csrf_missing@example.com",
        teamId,
      });
      const { sessionId } = await setupAuth(tx, admin);
      const res = await request(app)
        .post("/users/create")
        .set("Cookie", [`session_id=${sessionId}`])
        .send({ email: "csrf_missing@example.com", password: "StrongPass1!" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("CSRF token missing");
    });
  });

  it("returns 401 when CSRF token is invalid", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_csrf_invalid@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .post("/users/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", "invalid_token")
        .send({ email: "csrf_invalid@example.com", password: "StrongPass1!" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("Invalid CSRF token");
    });
  });

  it("returns 400 for invalid email format", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_invalid_email@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .post("/users/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ email: "not-an-email", password: "StrongPass1!" });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  it("returns 400 if email already exists (any team)", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const otherTeamId = await seedTeam(tx, "Other Team");
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_dup_email@example.com",
        teamId,
      });
      await seedUser(tx, {
        role: "member",
        email: "dup@example.com",
        teamId: otherTeamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .post("/users/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ email: "dup@example.com", password: "StrongPass1!" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Email already exists");
    });
  });
});
