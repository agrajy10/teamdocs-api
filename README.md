# TeamDocs API

TeamDocs API is a multi-tenant document management system built with Express.js and PostgreSQL. It features stateful session-based authentication, role-based access control (RBAC), team isolation, and secure document handling with granular permissions.

## Overview

This application serves as a collaborative document management platform where:
- Organizations are organized into **teams**
- Each team has its own isolated workspace
- Users have specific **roles** (Admin or Member) within their team
- A special **Super Admin** exists outside teams to manage the entire system
- Documents belong to teams and can be accessed based on user permissions
- All actions are secured with authentication, authorization, CSRF protection, and rate limiting

**Entry Point**: [app.js](app.js) - Express application running on port 3000

## Key Features

- ✅ **Stateful Session Authentication**: Secure cookie-based sessions with expiration tracking
- ✅ **Multi-Tenant Architecture**: Complete data isolation between teams
- ✅ **Role-Based Access Control (RBAC)**: Fine-grained permissions system
- ✅ **Document Management**: Full CRUD operations with ownership and permission checks
- ✅ **Security First**: CSRF protection, rate limiting, input validation, HTML sanitization, password hashing
- ✅ **Health Check Endpoint**: Monitor application status

## Database Schema

The application uses PostgreSQL with the following tables:
- `teams` - Organization units
- `roles` - User role definitions (Admin, Member)
- `permissions` - Individual permission definitions
- `role_permissions` - Maps roles to their permissions
- `users` - User accounts with team associations
- `sessions` - Active user sessions
- `documents` - Team documents

For detailed schema information, see [ERD.md](ERD.md).

## User Roles and Permissions

### Super Admin
- **Description**: System-level administrator with no team association
- **Capabilities**:
  - Create new teams with admin users
  - Full system access across all teams
  - Not bound by team-specific permissions
- **Identification**: `is_superadmin = true` and `team_id IS NULL`

### Admin (Team Administrator)
- **Description**: Team-level administrator with full team management capabilities
- **Permissions**:
  - `docs:create` - Create new documents in the team
  - `docs:view` - View all documents in the team
  - `docs:update` - Update any document in the team
  - `docs:delete` - Delete any document in the team
  - `members:view` - View all team members
  - `members:create` - Add new members to the team
  - `members:delete` - Remove members from the team
- **Use Case**: Team leaders who manage both content and team membership

### Member
- **Description**: Regular team member with basic document access
- **Permissions**:
  - `docs:create` - Create new documents in their team
  - `docs:view` - View all documents in their team
  - Can update/delete **only their own documents**
- **Use Case**: Regular contributors who create and manage their own content

### Permission Enforcement

Permissions are enforced through middleware that:
1. Checks if user is authenticated
2. Verifies user has the required permission for their role
3. Ensures user belongs to the correct team (team isolation)
4. For document operations: validates ownership or permission level

Document owners (creators) can always update/delete their own documents regardless of their role's base permissions.

## API Endpoints

The API provides endpoints for authentication, team management, user management, and document operations.

### Endpoint Summary

| Category       | Method   | Endpoint                  | Description                      | Access                                  |
| :------------- | :------- | :------------------------ | :------------------------------- | :-------------------------------------- |
| **Health**     | `GET`    | `/health`                 | Check application status         | Public                                  |
| **Auth**       | `POST`   | `/auth/login`             | User login                       | Public                                  |
| **Auth**       | `POST`   | `/auth/logout`            | User logout                      | Authenticated                           |
| **Teams**      | `POST`   | `/teams/create`           | Create team with admin           | Super Admin                             |
| **Users**      | `GET`    | `/users`                  | Get all team members             | Admin (`members:view`)                  |
| **Users**      | `POST`   | `/users/create`           | Add member to team               | Admin (`members:create`)                |
| **Users**      | `DELETE` | `/users/:id`              | Remove member from team          | Admin (`members:delete`)                |
| **Documents**  | `POST`   | `/documents`              | Create document                  | Authenticated + `docs:create`           |
| **Documents**  | `GET`    | `/documents`              | Get all team documents           | Authenticated + `docs:view`             |
| **Documents**  | `GET`    | `/documents/my-documents` | Get user's own documents         | Authenticated                           |
| **Documents**  | `GET`    | `/documents/:id`          | View specific document           | Authenticated + Permission/Ownership    |
| **Documents**  | `PUT`    | `/documents/:id`          | Update document                  | Authenticated + Permission/Ownership    |
| **Documents**  | `DELETE` | `/documents/:id`          | Delete document                  | Authenticated + Permission/Ownership    |

### Security Features

- 🔒 **CSRF Protection**: State-changing operations (POST, PUT, DELETE with body) require CSRF tokens
- ⏱️ **Rate Limiting**: Login and document creation/update endpoints are rate-limited
- ✅ **Input Validation**: All inputs validated with express-validator
- 🔐 **Password Requirements**: Min 8 chars, mixed case, numbers, special characters

For detailed API documentation including request/response schemas, validation rules, and examples, see **[API_REFERENCE.md](API_REFERENCE.md)**.

## Libraries Used

### Core Dependencies

- **[express](https://expressjs.com/)** (v5.2.1) - Web framework for Node.js
- **[pg](https://node-postgres.com/)** (v8.16.3) & **[pg-promise](https://github.com/vitaly-t/pg-promise)** (v12.3.0) - PostgreSQL database interface
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** (v6.0.0) - Password hashing with salt rounds
- **[cookie-parser](https://github.com/expressjs/cookie-parser)** (v1.4.7) - Parse cookies from request headers
- **[express-validator](https://express-validator.github.io/)** (v7.3.1) - Input validation and sanitization middleware
- **[sanitize-html](https://github.com/apostrophecms/sanitize-html)** (v2.17.0) - HTML sanitization to prevent XSS
- **[express-rate-limit](https://www.npmjs.com/package/express-rate-limit)** (v8.2.1) - Rate limiting for API endpoints
- **[dotenv](https://github.com/motdotla/dotenv)** (v17.2.3) - Environment variable management
- **[@faker-js/faker](https://fakerjs.dev/)** (v9.9.0) - Generate fake data for seeding
- **[node-pg-migrate](https://salsita.github.io/node-pg-migrate/)** (v8.0.4) - Database migration tool

### Dev Dependencies

- **[jest](https://jestjs.io/)** (v30.2.0) - JavaScript testing framework
- **[supertest](https://github.com/ladjs/supertest)** (v7.2.2) - HTTP assertions for testing Express routes
- **[cross-env](https://github.com/kentcdodds/cross-env)** (v10.1.0) - Cross-platform environment variable setting

## Setup and Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- npm or yarn

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd teamdocs-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=teamdocs
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   SESSION_SECRET=your_session_secret
   SEED_PASSWORD=TestPassword123!
   ```

4. **Set up the database**:
   ```bash
   # Create database
   createdb teamdocs
   
   # Run migrations
   npm run migrate up
   ```

5. **Seed the database** (optional):
   ```bash
   npm run seed
   ```
   This creates:
   - 2 roles (admin, member)
   - 7 permissions
   - 5 teams with 1 admin and 3 members each
   - 1 super admin (`superadmin@example.com`)
   - Sample documents for each member

6. **Start the application**:
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3000`

### Docker Setup

The application includes Docker support:

```bash
# Build image
docker build -t teamdocs-api .

# Run container
docker run -d \
  --name teamdocs-api \
  --env-file .env \
  -p 3000:3000 \
  teamdocs-api
```

## Available Scripts

- `npm start` - Start the application with auto-reload on file changes
- `npm run migrate up` - Run database migrations
- `npm run migrate down` - Rollback database migrations
- `npm run seed` - Seed database with sample data
- `npm test` - Run test suite

## Environment Variables

| Variable          | Description                              | Required | Default      |
| :---------------- | :--------------------------------------- | :------- | :----------- |
| `NODE_ENV`        | Environment (development/production/TEST)| Yes      | -            |
| `DB_HOST`         | PostgreSQL host                          | Yes      | -            |
| `DB_PORT`         | PostgreSQL port                          | Yes      | 5432         |
| `DB_NAME`         | Database name                            | Yes      | -            |
| `DB_USERNAME`     | Database user                            | Yes      | -            |
| `DB_PASSWORD`     | Database password                        | Yes      | -            |
| `SESSION_SECRET`  | Secret for session signing               | Yes      | -            |
| `SEED_PASSWORD`   | Default password for seeded users        | No       | -            |

## Security Features

### Authentication
- **Session-based authentication** with secure cookie storage
- **Password hashing** using bcrypt with 10 salt rounds
- **Session expiration** tracking with automatic cleanup
- **IP address and user agent** logging for sessions

### Authorization
- **Role-based access control** with permission checking
- **Team isolation** - users can only access their team's data
- **Document ownership** - creators have special privileges
- **Super admin** privilege separation

### Protection Mechanisms
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Prevents brute force attacks on login and document endpoints
- **Input Validation** - Server-side validation using express-validator
- **HTML Sanitization** - Prevents XSS attacks on document content
- **SQL Injection Prevention** - Parameterized queries via pg-promise
- **Password Complexity** - Enforced regex pattern (min 8 chars, mixed case, numbers, special chars)

## Testing

The application includes comprehensive integration and unit tests:

```bash
# Run all tests
npm test

# Test files location
tests/
  ├── integration/
  │   ├── auth.test.js        # Authentication flow tests
  │   ├── documents.test.js   # Document CRUD tests
  │   ├── teams.test.js       # Team management tests
  │   └── users.test.js       # User management tests
  └── unit/
      ├── comparePassword.test.js  # Password comparison tests
      └── hashPassword.test.js     # Password hashing tests
```

Tests use:
- **Jest** for test framework
- **Supertest** for HTTP endpoint testing
- **Test database** with transaction rollback for isolation
- **Helper utilities** for common setup tasks

## Infrastructure

This project includes AWS CDK infrastructure code for cloud deployment. See [infra/README.md](infra/README.md) for details on:
- VPC, EC2, and RDS setup
- ECR repository for Docker images
- Security groups and IAM roles
- Automated deployment with UserData scripts

## Project Structure

```
teamdocs-api/
├── app.js                 # Express application entry point
├── auth/                  # Authentication handlers
│   ├── login.js
│   └── logout.js
├── constants/             # Application constants and config
│   ├── constants.js
│   └── env.js
├── db/                    # Database connection
│   └── index.js
├── middleware/            # Express middleware
│   ├── authenticateSession.js
│   ├── authorize.js
│   ├── canDeleteDocument.js
│   ├── canUpdateDocument.js
│   ├── canViewDocument.js
│   ├── checkDocumentExists.js
│   ├── checkUserInTeam.js
│   ├── csrf.middleware.js
│   ├── injectDb.js
│   ├── isSuperAdmin.js
│   ├── rateLimiter.js
│   └── validation.middleware.js
├── migrations/            # Database migrations
│   └── 1770465156063_first-migration.js
├── routes/                # API route definitions
│   ├── auth.js
│   ├── documents.js
│   ├── teams.js
│   └── users.js
├── scripts/               # Utility scripts
│   └── seed.js
├── services/              # Business logic
│   ├── documentExists.js
│   ├── documents.js
│   ├── hasPermission.js
│   ├── isDocumentOwner.js
│   ├── teams.js
│   └── users.js
├── tests/                 # Test suites
├── utils/                 # Utility functions
│   ├── comparePassword.js
│   └── hashPassword.js
├── infra/                 # AWS CDK infrastructure code
├── docker-compose.yml     # Docker compose configuration
├── Dockerfile            # Container image definition
├── ERD.md                # Database schema diagram
└── package.json          # Dependencies and scripts
```

## License

ISC

## Author

Built with ❤️ for collaborative document management
