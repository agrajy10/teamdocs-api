/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("roles", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "text", notNull: true },
    description: { type: "text" },
  });

  pgm.createTable("permissions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "text", notNull: true },
    description: { type: "text" },
  });
  pgm.addConstraint("permissions", "permissions_name_unique", {
    unique: "name",
  });

  pgm.createTable("role_permissions", {
    role_id: { type: "uuid", notNull: true },
    permission_id: { type: "uuid", notNull: true },
  });
  pgm.addConstraint("role_permissions", "role_permissions_pkey", {
    primaryKey: ["role_id", "permission_id"],
  });
  pgm.addConstraint("role_permissions", "role_permissions_role_id_fkey", {
    foreignKeys: [
      { columns: "role_id", references: "roles(id)", onDelete: "CASCADE" },
    ],
  });
  pgm.addConstraint("role_permissions", "role_permissions_permission_id_fkey", {
    foreignKeys: [
      {
        columns: "permission_id",
        references: "permissions(id)",
        onDelete: "CASCADE",
      },
    ],
  });

  pgm.createTable("teams", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "text", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("teams", "teams_name_unique", { unique: "name" });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: { type: "text", notNull: true },
    password_hash: { type: "text", notNull: true },
    is_active: { type: "boolean", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
    role_id: { type: "uuid", notNull: true },
    team_id: { type: "uuid" },
    is_superadmin: { type: "boolean", notNull: true, default: false },
  });
  pgm.addConstraint("users", "user_role", {
    foreignKeys: [{ columns: "role_id", references: "roles(id)" }],
  });
  pgm.addConstraint("users", "user_team", {
    foreignKeys: [{ columns: "team_id", references: "teams(id)" }],
  });
  pgm.addConstraint("users", "users_team_superadmin_check", {
    check:
      "((is_superadmin = true AND team_id IS NULL) OR (is_superadmin = false AND team_id IS NOT NULL))",
  });

  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: { type: "uuid", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    expires_at: { type: "timestamptz", notNull: true },
    user_agent: { type: "text" },
    ip_address: { type: "text" },
  });
  pgm.addConstraint("sessions", "user_session", {
    foreignKeys: [
      { columns: "user_id", references: "users(id)", onDelete: "CASCADE" },
    ],
  });

  pgm.createTable("documents", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: { type: "text", notNull: true },
    content: { type: "text", notNull: true },
    owner_id: { type: "uuid", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
    team_id: { type: "uuid" },
  });
  pgm.addConstraint("documents", "documents_owner_id_fkey", {
    foreignKeys: [
      {
        columns: "owner_id",
        references: "users(id)",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    ],
  });
  pgm.addConstraint("documents", "document_team_id", {
    foreignKeys: [{ columns: "team_id", references: "teams(id)" }],
  });

  pgm.createTable("audit_logs", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    actor_id: { type: "uuid" },
    action: { type: "text", notNull: true },
    target_type: { type: "text" },
    target_id: { type: "uuid" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("audit_logs", "audit_logs_actor_id_fkey", {
    foreignKeys: [{ columns: "actor_id", references: "users(id)" }],
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("audit_logs");
  pgm.dropTable("documents");
  pgm.dropTable("sessions");
  pgm.dropTable("users");
  pgm.dropTable("teams");
  pgm.dropTable("role_permissions");
  pgm.dropTable("permissions");
  pgm.dropTable("roles");
  pgm.dropExtension("pgcrypto");
};
