import request from "supertest";
import seedUser from "../helpers/seedUser.js";
import setupAuth from "../helpers/setupAuth.js";
import seedTeam from "../helpers/seedTeam.js";
import { withTestTransaction } from "../helpers/withTestTransaction.js";

describe("POST /teams/create", () => {
  it("creates team and admin user", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "superadmin_create@example.com",
        teamId,
      });
      await tx.none(
        "UPDATE users SET is_superadmin = true, team_id = NULL WHERE id = $1",
        [admin.id],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, admin);

      const res = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Alpha Team",
          admin: { email: "alpha_admin@example.com", password: "StrongPass1!" },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.team.name).toBe("Alpha Team");
      expect(res.body.admin.email).toBe("alpha_admin@example.com");

      const savedTeam = await tx.oneOrNone(
        "SELECT id FROM teams WHERE name = $1",
        ["Alpha Team"],
      );
      expect(savedTeam).not.toBeNull();
      const savedAdmin = await tx.oneOrNone(
        "SELECT email, team_id, password_hash FROM users WHERE email = $1",
        ["alpha_admin@example.com"],
      );
      expect(savedAdmin).not.toBeNull();
      expect(savedAdmin.team_id).toBe(savedTeam.id);
      expect(savedAdmin.password_hash).not.toBe("StrongPass1!");
    });
  });

  it("returns 401 if not authenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app)
        .post("/teams/create")
        .send({
          name: "NoAuth Team",
          admin: {
            email: "noauth_admin@example.com",
            password: "StrongPass1!",
          },
        });
      expect(res.status).toBe(401);
    });
  });

  it("returns 401 if CSRF token is missing", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "superadmin_csrf_missing@example.com",
        teamId,
      });
      await tx.none(
        "UPDATE users SET is_superadmin = true, team_id = NULL WHERE id = $1",
        [admin.id],
      );
      const { sessionId } = await setupAuth(tx, admin);

      const res = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`])
        .send({
          name: "CSRF Missing Team",
          admin: {
            email: "csrf_missing_admin@example.com",
            password: "StrongPass1!",
          },
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("CSRF token missing");
    });
  });

  it("returns 401 if CSRF token is invalid", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "superadmin_csrf_invalid@example.com",
        teamId,
      });
      await tx.none(
        "UPDATE users SET is_superadmin = true, team_id = NULL WHERE id = $1",
        [admin.id],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, admin);

      const res = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", "invalid_token")
        .send({
          name: "CSRF Invalid Team",
          admin: {
            email: "csrf_invalid_admin@example.com",
            password: "StrongPass1!",
          },
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("Invalid CSRF token");
    });
  });

  it("returns 403 if user is not admin", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, {
        role: "member",
        email: "member_forbidden@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, member);

      const res = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Forbidden Team",
          admin: {
            email: "forbidden_admin@example.com",
            password: "StrongPass1!",
          },
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");
    });
  });

  it("returns 403 if admin is not superadmin", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "admin_not_super@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);

      const res = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "NoSuper Team",
          admin: {
            email: "nosuper_admin@example.com",
            password: "StrongPass1!",
          },
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");
    });
  });

  it("returns 400 for validation errors", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "superadmin_validation@example.com",
        teamId,
      });
      await tx.none(
        "UPDATE users SET is_superadmin = true, team_id = NULL WHERE id = $1",
        [admin.id],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, admin);

      const resMissingName = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          admin: { email: "valid_admin@example.com", password: "StrongPass1!" },
        });
      expect(resMissingName.status).toBe(400);
      expect(resMissingName.body.errors).toBeDefined();

      const resInvalidEmail = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Validation Team",
          admin: { email: "not-an-email", password: "StrongPass1!" },
        });
      expect(resInvalidEmail.status).toBe(400);
      expect(resInvalidEmail.body.errors).toBeDefined();

      const resWeakPassword = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "WeakPwd Team",
          admin: { email: "weakpwd_admin@example.com", password: "weak" },
        });
      expect(resWeakPassword.status).toBe(400);
      expect(resWeakPassword.body.errors).toBeDefined();
    });
  });

  it("returns 400 if team name already exists", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "superadmin_dup_team@example.com",
        teamId,
      });
      await tx.none(
        "UPDATE users SET is_superadmin = true, team_id = NULL WHERE id = $1",
        [admin.id],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      await tx.none("INSERT INTO teams (name) VALUES ($1)", ["Dup Team"]);

      const res = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Dup Team",
          admin: {
            email: "dup_team_admin@example.com",
            password: "StrongPass1!",
          },
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Team name already exists");
    });
  });

  it("returns 400 if admin email already exists", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, {
        role: "admin",
        email: "superadmin_dup_email@example.com",
        teamId,
      });
      await tx.none(
        "UPDATE users SET is_superadmin = true, team_id = NULL WHERE id = $1",
        [admin.id],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      await seedUser(tx, {
        role: "member",
        email: "already@example.com",
        teamId,
      });

      const res = await request(app)
        .post("/teams/create")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "NonDup Team",
          admin: { email: "already@example.com", password: "StrongPass1!" },
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Admin email already exists");
    });
  });
});
