import request from "supertest";
import app from "../helpers/testApp";
import { begin, rollback } from "../helpers/db";
import seedUser from "../helpers/seedUser.js";
import db from "../../db/index.js";
import setupAuth from "../helpers/setupAuth.js";
import seedTeam from "../helpers/seedTeam.js";

let teamId;

beforeEach(async () => {
  await begin();
  teamId = await seedTeam();
});

afterEach(async () => {
  await rollback();
});

describe("POST /documents", () => {
  it.each(["admin", "manager", "member"])(
    "allows %s to create a document",
    async (role) => {
      const [user] = await seedUser({
        role,
        email: `${role}_create@example.com`,
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(user);

      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          title: `${role} Document`,
          content: `This is a document created by ${role}`,
        });

      expect(res.status).toBe(201);
    },
  );

  it("should return 401 if not authenticated", async () => {
    const res = await request(app).post("/documents").send({
      title: "Test",
      content: "Content",
    });
    expect(res.status).toBe(401);
  });

  it("should return 401 if CSRF token is missing", async () => {
    const [user] = await seedUser({ teamId });
    const { sessionId } = await setupAuth(user);

    const res = await request(app)
      .post("/documents")
      .set("Cookie", [`session_id=${sessionId}`])
      .send({
        title: "Test",
        content: "Content",
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch("CSRF token missing");
  });

  it("should return 401 if CSRF token is invalid", async () => {
    const [user] = await seedUser({ teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    const res = await request(app)
      .post("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", "invalid_token")
      .send({
        title: "Test",
        content: "Content",
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch("Invalid CSRF token");
  });

  it("should return 400 if title is missing", async () => {
    const [user] = await seedUser({ teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    const res = await request(app)
      .post("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        content: "Content",
      });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 400 if content is missing", async () => {
    const [user] = await seedUser({ teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    const res = await request(app)
      .post("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        title: "Test",
      });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 400 if content is not a string", async () => {
    const [user] = await seedUser({ teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    const res = await request(app)
      .post("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        title: "Test",
        content: 123,
      });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 403 if user does not have permission", async () => {
    // Create a role without permissions
    const roleName = "restricted";
    await db.query("INSERT INTO roles (name) VALUES ($1)", [roleName]);
    const { id: roleId } = await db.one(
      "SELECT id FROM roles WHERE name = $1",
      [roleName],
    );

    // Create user with this role
    const email = "restricted@example.com";
    const { id: userId } = await db.one(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at, role_id, team_id)
         VALUES ($1, 'hash', true, NOW(), NOW(), $2, $3) RETURNING id`,
      [email, roleId, teamId],
    );

    const { sessionId, csrfToken } = await setupAuth({ id: userId });

    const res = await request(app)
      .post("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        title: "Test",
        content: "Content",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Access denied");
  });
});

describe("GET /documents/:id", () => {
  it("allows owner to view their own document", async () => {
    const [user] = await seedUser({ email: "owner_view@example.com", teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id, title",
      ["My View Doc", "Content", user.id, teamId],
    );

    const res = await request(app)
      .get(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe("My View Doc");
  });

  it("allows admin to view other user's document", async () => {
    const [admin] = await seedUser({
      email: "admin_view@example.com",
      role: "admin",
      teamId,
    });
    const [other] = await seedUser({
      email: "other_admin_view_target@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(admin);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id, title",
      ["Target View Doc", "Content", other.id, teamId],
    );

    const res = await request(app)
      .get(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe("Target View Doc");
  });

  it("allows manager to view other user's document", async () => {
    const [manager] = await seedUser({
      email: "manager_view@example.com",
      role: "manager",
      teamId,
    });
    const [other] = await seedUser({
      email: "other_manager_view_target@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(manager);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id, title",
      ["Target View Doc", "Content", other.id, teamId],
    );

    const res = await request(app)
      .get(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe("Target View Doc");
  });
});

describe("PUT /documents/:id", () => {
  it("allows owner to update their own document", async () => {
    const [user] = await seedUser({
      email: "owner_update@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(user);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Original Title", "Original Content", user.id, teamId],
    );

    const res = await request(app)
      .put(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        title: "Updated Title",
        content: "Updated Content",
      });

    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe("Updated Title");
    expect(res.body.document.content).toBe("Updated Content");

    const updatedDoc = await db.one(
      "SELECT * FROM documents WHERE id = $1 AND team_id = $2",
      [doc.id, teamId],
    );
    expect(updatedDoc.title).toBe("Updated Title");
  });

  it.each(["admin", "manager"])(
    "allows %s to update other user's document",
    async (role) => {
      const [actor] = await seedUser({
        role,
        email: `${role}_update@example.com`,
        teamId,
      });
      const [other] = await seedUser({
        email: `other_${role}_target@example.com`,
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(actor);

      const doc = await db.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Original Title", "Original Content", other.id, teamId],
      );

      const res = await request(app)
        .put(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          title: "Force Updated",
          content: "Content",
        });

      expect(res.status).toBe(200);
      expect(res.body.document.title).toBe("Force Updated");
    },
  );

  it("prevents member from updating other user's document", async () => {
    const [member] = await seedUser({
      email: "member_update@example.com",
      teamId,
    });
    const [other] = await seedUser({
      email: "other_update_target@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(member);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Original Title", "Content", other.id, teamId],
    );

    const res = await request(app)
      .put(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        title: "Hacked Title",
        content: "Content",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Permission denied");
  });

  it("returns 400 if title is missing", async () => {
    const [user] = await seedUser({ teamId });
    const { sessionId, csrfToken } = await setupAuth(user);
    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Title", "Content", user.id, teamId],
    );

    const res = await request(app)
      .put(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        content: "Updated Content",
      });

    expect(res.status).toBe(400);
  });

  it("returns 404 if document does not exist", async () => {
    const [user] = await seedUser({ teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    const res = await request(app)
      .put("/documents/550e8400-e29b-41d4-a716-446655440000") // Assuming this ID doesn't exist
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken)
      .send({
        title: "Title",
        content: "Content",
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Document not found");
  });
});

describe("DELETE /documents/:id", () => {
  it("allows member to delete their own document", async () => {
    const [user] = await seedUser({ email: "member1@example.com", teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["My Doc", "Content", user.id, teamId],
    );

    const res = await request(app)
      .delete(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken);

    expect(res.status).toBe(200);

    const found = await db.oneOrNone("SELECT id FROM documents WHERE id = $1", [
      doc.id,
    ]);
    expect(found).toBeNull();
  });

  it("prevents member from deleting other user's document", async () => {
    const [member] = await seedUser({ email: "member2@example.com", teamId });
    const [other] = await seedUser({ email: "other@example.com", teamId });
    const { sessionId, csrfToken } = await setupAuth(member);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Other Doc", "Content", other.id, teamId],
    );

    const res = await request(app)
      .delete(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Permission denied");

    const found = await db.oneOrNone(
      "SELECT id FROM documents WHERE id = $1 AND team_id = $2",
      [doc.id, teamId],
    );
    expect(found).not.toBeNull();
  });

  it("allows admin to delete other user's document", async () => {
    const [admin] = await seedUser({
      email: "admin@example.com",
      role: "admin",
      teamId,
    });
    const [other] = await seedUser({
      email: "other_admin_target@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(admin);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Target Doc", "Content", other.id, teamId],
    );

    const res = await request(app)
      .delete(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken);

    expect(res.status).toBe(200);

    const found = await db.oneOrNone("SELECT id FROM documents WHERE id = $1", [
      doc.id,
    ]);
    expect(found).toBeNull();
  });

  it("allows manager to delete other user's document", async () => {
    const [manager] = await seedUser({
      email: "manager@example.com",
      role: "manager",
      teamId,
    });
    const [other] = await seedUser({
      email: "other_manager_target@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(manager);

    const doc = await db.one(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Target Doc", "Content", other.id, teamId],
    );

    const res = await request(app)
      .delete(`/documents/${doc.id}`)
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken);

    expect(res.status).toBe(200);

    const found = await db.oneOrNone("SELECT id FROM documents WHERE id = $1", [
      doc.id,
    ]);
    expect(found).toBeNull();
  });
});

describe("GET /documents", () => {
  it("allows admin to view all documents", async () => {
    const [admin] = await seedUser({
      role: "admin",
      email: "admin_list@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(admin);

    await db.none(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
      ["Doc 1", "Content", admin.id, teamId],
    );

    const res = await request(app)
      .get("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.documents.length).toBeGreaterThanOrEqual(1);
  });

  it("allows manager to view all documents", async () => {
    const [manager] = await seedUser({
      role: "manager",
      email: "manager_list@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(manager);

    await db.none(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
      ["Doc 1", "Content", manager.id, teamId],
    );

    const res = await request(app)
      .get("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.documents.length).toBeGreaterThanOrEqual(1);
  });

  it("prevents member from viewing all documents", async () => {
    const [member] = await seedUser({
      role: "member",
      email: "member_list@example.com",
      teamId,
    });
    const { sessionId, csrfToken } = await setupAuth(member);

    const res = await request(app)
      .get("/documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Access denied");
  });
});

describe("GET /documents/my-documents", () => {
  it("returns only user's documents", async () => {
    const [user] = await seedUser({
      role: "member",
      email: "my_docs@example.com",
      teamId,
    });
    const [other] = await seedUser({ email: "other_docs@example.com", teamId });
    const { sessionId, csrfToken } = await setupAuth(user);

    await db.none(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
      ["My Doc", "Content", user.id, teamId],
    );
    await db.none(
      "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
      ["Other Doc", "Content", other.id, teamId],
    );

    const res = await request(app)
      .get("/documents/my-documents")
      .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.documents).toHaveLength(1);
    expect(res.body.documents[0].title).toBe("My Doc");
  });
});
