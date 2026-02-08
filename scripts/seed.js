import { faker } from '@faker-js/faker';
import db from '../db/index.js';
import env from '../constants/env.js';
import hashPassword from '../utils/hashPassword.js';

const PERMISSIONS = [
  { name: 'docs:delete', description: 'Delete documents of the team' },
  { name: 'members:delete', description: 'Delete members from the team' },
  { name: 'docs:update', description: 'Update documents of the team' },
  { name: 'docs:create', description: 'Create documents in the team' },
  { name: 'docs:view', description: 'Read all documents of the team' },
  { name: 'members:view', description: 'View members of the team' },
  { name: 'members:create', description: 'Add new members in the team' },
];

const ROLES = [
  { name: 'admin', description: 'Administrator' },
  { name: 'member', description: 'Team Member' },
];

const ROLE_PERMISSIONS = {
  admin: [
    'docs:delete',
    'members:delete',
    'docs:update',
    'docs:create',
    'docs:view',
    'members:view',
    'members:create',
  ],
  member: [
    'docs:create',
    'docs:view',
  ],
};

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    await db.tx(async (t) => {
      // 1. Clear existing data
      console.log('Cleaning existing data...');
      await t.none('TRUNCATE TABLE role_permissions, permissions, roles, documents, sessions, users, teams CASCADE');

      // 2. Seed Permissions
      console.log('Seeding permissions...');
      const permissionMap = new Map();
      for (const p of PERMISSIONS) {
        const row = await t.one(
          'INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING id, name',
          [p.name, p.description]
        );
        permissionMap.set(row.name, row.id);
      }

      // 3. Seed Roles
      console.log('Seeding roles...');
      const roleMap = new Map();
      for (const r of ROLES) {
        const row = await t.one(
          'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name',
          [r.name, r.description]
        );
        roleMap.set(row.name, row.id);
      }

      // 4. Assign Permissions to Roles
      console.log('Assigning permissions to roles...');
      for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
        const roleId = roleMap.get(roleName);
        for (const permName of perms) {
          const permId = permissionMap.get(permName);
          await t.none(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, permId]
          );
        }
      }

      // 5. Seed Teams
      console.log('Seeding teams...');
      const teamIds = [];
      for (let i = 0; i < 5; i++) {
        const row = await t.one(
          'INSERT INTO teams (name) VALUES ($1) RETURNING id',
          [faker.company.name() + ' ' + faker.string.alphanumeric(3)] // Ensure uniqueness
        );
        teamIds.push(row.id);
      }

      // 6. Seed Users
    console.log('Seeding users...');
    const passwordHash = await hashPassword(env.SEED_PASSWORD);
    const userIds = [];

      // Create a superadmin (no team)
      const adminRoleId = roleMap.get('admin');
      await t.none(
        `INSERT INTO users (email, password_hash, is_active, role_id, team_id, is_superadmin, created_at, updated_at)
         VALUES ($1, $2, true, $3, NULL, true, NOW(), NOW())`,
        ['superadmin@example.com', passwordHash, adminRoleId]
      );

      // Create regular users per team
      for (const teamId of teamIds) {
        // Create 1 admin per team
        await t.none(
          `INSERT INTO users (email, password_hash, is_active, role_id, team_id, is_superadmin, created_at, updated_at)
           VALUES ($1, $2, true, $3, $4, false, NOW(), NOW())`,
          [faker.internet.email(), passwordHash, adminRoleId, teamId]
        );

        // Create 3 members per team
        const memberRoleId = roleMap.get('member');
        for (let j = 0; j < 3; j++) {
          const user = await t.one(
            `INSERT INTO users (email, password_hash, is_active, role_id, team_id, is_superadmin, created_at, updated_at)
             VALUES ($1, $2, true, $3, $4, false, NOW(), NOW()) RETURNING id`,
            [faker.internet.email(), passwordHash, memberRoleId, teamId]
          );
          userIds.push({ id: user.id, teamId: teamId });
        }
      }

      // 7. Seed Documents
      console.log('Seeding documents...');
      for (const user of userIds) {
        const numDocs = faker.number.int({ min: 1, max: 5 });
        for (let k = 0; k < numDocs; k++) {
          await t.none(
            `INSERT INTO documents (title, content, owner_id, team_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [faker.lorem.sentence(), faker.lorem.paragraphs(), user.id, user.teamId]
          );
        }
      }
    });

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
