import request from "supertest";
import seedUser from "../helpers/seedUser.js";
import setupAuth from "../helpers/setupAuth.js";
import seedTeam from "../helpers/seedTeam.js";
import { withTestTransaction } from "../helpers/withTestTransaction.js";

describe("POST /documents (member role)", () => {
  it("creates a document with valid input and CSRF; returns 201", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, {
        role: "member",
        email: "member_create@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({
          title: "Member Doc",
          content: "Content by member",
        });
      expect(res.status).toBe(201);
    });
  });

  it("returns 400 when title missing", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ content: "Content" });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  it("returns 400 when content missing", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Title" });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  it("returns 400 when content is not a string", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Title", content: 123 });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app)
        .post("/documents")
        .send({ title: "Title", content: "Content" });
      expect(res.status).toBe(401);
    });
  });

  it("returns 401 when CSRF token is missing", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId } = await setupAuth(tx, member);
      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`])
        .send({ title: "Title", content: "Content" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("CSRF token missing");
    });
  });

  it("returns 401 when CSRF token is invalid", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", "invalid_token")
        .send({ title: "Title", content: "Content" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("Invalid CSRF token");
    });
  });
});

describe("GET /documents (member role)", () => {
  it("returns 200 member can list all team documents", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      await tx.none(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
        ["Doc 1", "Content", member.id, teamId],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .get("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.documents)).toBe(true);
      expect(res.body.documents.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app).get("/documents");
      expect(res.status).toBe(401);
    });
  });
});

describe("GET /documents/my-documents (member role)", () => {
  it("returns 200 with only the member’s own documents", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, {
        role: "member",
        email: "member_my_docs@example.com",
        teamId,
      });
      const [other] = await seedUser(tx, {
        role: "member",
        email: "other_my_docs@example.com",
        teamId,
      });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      await tx.none(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
        ["My Doc", "Content", member.id, teamId],
      );
      await tx.none(
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
});

describe("GET /documents/:id (member role)", () => {
  it("returns 200 when member is the owner", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Owned Doc", "Content", member.id, teamId],
      );
      const res = await request(app)
        .get(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
    });
  });

  it("returns 200 if some other member of the same team is accessing the document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const [other] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Other Doc", "Content", other.id, teamId],
      );
      const res = await request(app)
        .get(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
    });
  });

  it("returns 404 when document belongs to a different team", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx, "Team A");
      const otherTeamId = await seedTeam(tx, "Team B");
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Cross Team Doc", "Content", member.id, otherTeamId],
      );
      const res = await request(app)
        .get(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(404);
    });
  });

  it("returns 404 when document does not exist", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app).get(
        "/documents/00000000-0000-0000-0000-000000000000",
      );
      expect(res.status).toBe(401);
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app).get(
        "/documents/00000000-0000-0000-0000-000000000000",
      );
      expect(res.status).toBe(401);
    });
  });
});

describe("PUT /documents/:id (member role)", () => {
  it("returns 200 when member (owner) updates own document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Original", "Content", member.id, teamId],
      );
      const res = await request(app)
        .put(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Updated", content: "Updated Content" });
      expect(res.status).toBe(200);
    });
  });

  it("returns 403 when member tries to update another user’s document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const [other] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Other", "Content", other.id, teamId],
      );
      const res = await request(app)
        .put(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Hacked", content: "Content" });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Permission denied");
    });
  });

  it("returns 400 when title is missing", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Title", "Content", member.id, teamId],
      );
      const res = await request(app)
        .put(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ content: "Updated Content" });
      expect(res.status).toBe(400);
    });
  });

  it("returns 404 when document does not exist", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .put("/documents/00000000-0000-0000-0000-000000000000")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "T", content: "C" });
      expect(res.status).toBe(404);
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app)
        .put("/documents/00000000-0000-0000-0000-000000000000")
        .send({ title: "T", content: "C" });
      expect(res.status).toBe(401);
    });
  });

  it("returns 401 when CSRF token is missing", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Title", "Content", member.id, teamId],
      );
      const res = await request(app)
        .put(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`])
        .send({ title: "Updated", content: "Updated Content" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("CSRF token missing");
    });
  });

  it("returns 401 when CSRF token is invalid", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Title", "Content", member.id, teamId],
      );
      const res = await request(app)
        .put(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", "invalid_token")
        .send({ title: "Updated", content: "Updated Content" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch("Invalid CSRF token");
    });
  });
});

describe("DELETE /documents/:id (member role)", () => {
  it("returns 200 when member (owner) deletes own document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Mine", "Content", member.id, teamId],
      );
      const res = await request(app)
        .delete(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
      const found = await tx.oneOrNone(
        "SELECT id FROM documents WHERE id = $1",
        [doc.id],
      );
      expect(found).toBeNull();
    });
  });

  it("returns 403 when member tries to delete another user’s document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const [other] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Other", "Content", other.id, teamId],
      );
      const res = await request(app)
        .delete(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Permission denied");
      const found = await tx.oneOrNone(
        "SELECT id FROM documents WHERE id = $1 AND team_id = $2",
        [doc.id, teamId],
      );
      expect(found).not.toBeNull();
    });
  });

  it("returns 404 when document does not exist", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, member);
      const res = await request(app)
        .delete("/documents/00000000-0000-0000-0000-000000000000")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(404);
    });
  });

  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app).delete(
        "/documents/00000000-0000-0000-0000-000000000000",
      );
      expect(res.status).toBe(401);
    });
  });
});

describe("POST /documents (admin role)", () => {
  it("returns 201 for valid input with CSRF", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .post("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Admin Doc", content: "Admin Content" });
      expect(res.status).toBe(201);
    });
  });
});

describe("GET /documents (admin role)", () => {
  it("returns 200 and lists all team documents", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      await tx.none(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
        ["Doc A", "Content", admin.id, teamId],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .get("/documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.documents)).toBe(true);
      expect(res.body.documents.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("GET /documents/my-documents (admin role)", () => {
  it("returns 200 with only admin’s own documents", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const [other] = await seedUser(tx, { role: "member", teamId });
      await tx.none(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
        ["Admin Doc", "Content", admin.id, teamId],
      );
      await tx.none(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4)",
        ["Other Doc", "Content", other.id, teamId],
      );
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .get("/documents/my-documents")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
      expect(res.body.documents).toHaveLength(1);
      expect(res.body.documents[0].title).toBe("Admin Doc");
    });
  });
});

describe("GET /documents/my-documents (unauthenticated)", () => {
  it("returns 401 when unauthenticated", async () => {
    await withTestTransaction(async (_tx, app) => {
      const res = await request(app).get("/documents/my-documents");
      expect(res.status).toBe(401);
    });
  });
});

describe("GET /documents/:id (admin role)", () => {
  it("returns 200 when admin views own document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Admin Owned", "Content", admin.id, teamId],
      );
      const res = await request(app)
        .get(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
    });
  });

  it("returns 200 when admin views another team member’s document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Member Doc", "Content", member.id, teamId],
      );
      const res = await request(app)
        .get(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
    });
  });

  it("returns 404 when document belongs to a different team", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamA = await seedTeam(tx, "Team A Admin");
      const teamB = await seedTeam(tx, "Team B Admin");
      const [admin] = await seedUser(tx, { role: "admin", teamId: teamA });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Cross Team", "Content", admin.id, teamB],
      );
      const res = await request(app)
        .get(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(404);
    });
  });
});

describe("PUT /documents/:id (admin role)", () => {
  it("returns 200 when admin updates another user’s document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Original", "Content", member.id, teamId],
      );
      const res = await request(app)
        .put(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Updated", content: "Updated Content" });
      expect(res.status).toBe(200);
    });
  });

  it("returns 404 when document does not exist", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .put("/documents/00000000-0000-0000-0000-000000000000")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`])
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "T", content: "C" });
      expect(res.status).toBe(404);
    });
  });
});

describe("DELETE /documents/:id (admin role)", () => {
  it("returns 200 when admin deletes another user’s document", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const [member] = await seedUser(tx, { role: "member", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Victim", "Content", member.id, teamId],
      );
      const res = await request(app)
        .delete(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(200);
      const found = await tx.oneOrNone(
        "SELECT id FROM documents WHERE id = $1",
        [doc.id],
      );
      expect(found).toBeNull();
    });
  });

  it("returns 404 when document does not exist", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamId = await seedTeam(tx);
      const [admin] = await seedUser(tx, { role: "admin", teamId });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const res = await request(app)
        .delete("/documents/00000000-0000-0000-0000-000000000000")
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(404);
    });
  });

  it("returns 404 when document belongs to a different team", async () => {
    await withTestTransaction(async (tx, app) => {
      const teamA = await seedTeam(tx, "Admin Team A");
      const teamB = await seedTeam(tx, "Admin Team B");
      const [admin] = await seedUser(tx, { role: "admin", teamId: teamA });
      const { sessionId, csrfToken } = await setupAuth(tx, admin);
      const doc = await tx.one(
        "INSERT INTO documents (title, content, owner_id, team_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Cross Team Doc", "Content", admin.id, teamB],
      );
      const res = await request(app)
        .delete(`/documents/${doc.id}`)
        .set("Cookie", [`session_id=${sessionId}`, `csrf_token=${csrfToken}`]);
      expect(res.status).toBe(404);
    });
  });
});
