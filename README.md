# TeamDocs API

TeamDocs API is a document management system built with Express.js and PostgreSQL. It features stateful authentication, role-based access control (RBAC), and secure document handling.

## Features

- **User Authentication**: Secure login using sessions and cookies.
- **Role-Based Access Control (RBAC)**: Granular permissions for Admins, Managers, and Members.
- **Document Management**: Create, read, update, and delete documents with ownership and permission checks.
- **Security**: Input validation, HTML sanitization, and CSRF protection.

## Libraries Used

### Dependencies

- **[express](https://expressjs.com/)**: Web framework for Node.js.
- **[pg](https://node-postgres.com/)** & **[pg-promise](https://github.com/vitaly-t/pg-promise)**: PostgreSQL database interface.
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)**: Library for hashing passwords.
- **[cookie-parser](https://github.com/expressjs/cookie-parser)**: Parse Cookie header and populate `req.cookies`.
- **[express-validator](https://express-validator.github.io/)**: Middleware for input validation and sanitization.
- **[sanitize-html](https://github.com/apostrophecms/sanitize-html)**: Library to sanitize HTML input.
- **[dotenv](https://github.com/motdotla/dotenv)**: Loads environment variables from `.env` file.

### Dev Dependencies

- **[jest](https://jestjs.io/)**: JavaScript testing framework.
- **[supertest](https://github.com/ladjs/supertest)**: HTTP assertions for testing Express routes.
- **[cross-env](https://github.com/kentcdodds/cross-env)**: Run scripts that set and use environment variables across platforms.

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint       | Description | Access        |
| :----- | :------------- | :---------- | :------------ |
| `POST` | `/auth/login`  | Login user  | Public        |
| `POST` | `/auth/logout` | Logout user | Authenticated |

### Users (`/users`)

| Method   | Endpoint     | Description   | Access                         |
| :------- | :----------- | :------------ | :----------------------------- |
| `GET`    | `/users`     | Get all users | Authenticated (`users:read`)   |
| `DELETE` | `/users/:id` | Delete a user | Authenticated (`users:delete`) |

### Documents (`/documents`)

| Method   | Endpoint                  | Description                  | Access                              |
| :------- | :------------------------ | :--------------------------- | :---------------------------------- |
| `POST`   | `/documents`              | Create a new document        | Authenticated (`docs:create`)       |
| `GET`    | `/documents`              | Get all documents            | Authenticated (`docs:readAll`)      |
| `GET`    | `/documents/my-documents` | Get current user's documents | Authenticated                       |
| `GET`    | `/documents/:id`          | View a specific document     | Authenticated (Owner or Permission) |
| `PUT`    | `/documents/:id`          | Update a document            | Authenticated (Owner or Permission) |
| `DELETE` | `/documents/:id`          | Delete a document            | Authenticated (Owner or Permission) |
