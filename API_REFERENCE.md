# API Reference

Complete API documentation for TeamDocs API endpoints, including request/response schemas, validation rules, and access control requirements.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require authentication via session cookies. After successful login, a session cookie is set and must be included in subsequent requests.

---

## Health Check

### `GET /health`

Check application status.

**Access**: Public

**Response** (200):
```json
{
  "status": "ok"
}
```

---

## Authentication Endpoints

### `POST /auth/login`

Authenticate user and create session.

**Access**: Public  
**Rate Limited**: ✅

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation**:
- `email` - Must be valid email format
- `password` - Required, non-empty

**Success Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin",
  "teamId": "team-uuid"
}
```

**Error Responses**:
- `400` - Validation error (invalid email or missing password)
- `401` - Invalid credentials
- `429` - Too many requests (rate limit exceeded)

---

### `POST /auth/logout`

Destroy current session and log out user.

**Access**: Authenticated

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**:
- `403` - Not authenticated

---

## Team Management Endpoints

### `POST /teams/create`

Create new team with admin user.

**Access**: Super Admin only  
**CSRF Protected**: ✅

**Request Body**:
```json
{
  "name": "Engineering Team",
  "admin": {
    "email": "admin@team.com",
    "password": "SecurePass123!"
  }
}
```

**Validation**:
- `name` - Required, non-empty string
- `admin.email` - Must be valid email format
- `admin.password` - Must match password regex:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character

**Success Response** (201):
```json
{
  "teamId": "uuid",
  "adminId": "uuid",
  "message": "Team created successfully"
}
```

**Error Responses**:
- `400` - Validation error
- `403` - Not authorized (not a super admin)
- `409` - Team name already exists

---

## User Management Endpoints

### `GET /users`

Get all users in the authenticated user's team.

**Access**: Admin (`members:view` permission)

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "member",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Responses**:
- `403` - Not authenticated or insufficient permissions

---

### `POST /users/create`

Add new member to the team.

**Access**: Admin (`members:create` permission)  
**CSRF Protected**: ✅

**Request Body**:
```json
{
  "email": "newuser@team.com",
  "password": "SecurePass123!"
}
```

**Validation**:
- `email` - Must be valid email format
- `password` - Must match password regex (min 8 chars, uppercase, lowercase, digit, special char)

**Success Response** (201):
```json
{
  "userId": "uuid",
  "message": "Member created successfully"
}
```

**Error Responses**:
- `400` - Validation error
- `403` - Not authenticated or insufficient permissions
- `409` - Email already exists

---

### `DELETE /users/:id`

Remove user from team.

**Access**: Admin (`members:delete` permission)

**URL Parameters**:
- `id` (uuid) - User ID to delete

**Access Control**: User being deleted must belong to the same team as the admin making the request.

**Success Response** (200):
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses**:
- `403` - Not authenticated, insufficient permissions, or user not in same team
- `404` - User not found

---

## Document Management Endpoints

### `POST /documents`

Create new document in the user's team.

**Access**: Authenticated + `docs:create` permission  
**Rate Limited**: ✅  
**CSRF Protected**: ✅

**Request Body**:
```json
{
  "title": "Project Requirements",
  "content": "Detailed project requirements..."
}
```

**Validation**:
- `title` - Required, non-empty
- `content` - Required, non-empty string

**Success Response** (201):
```json
{
  "id": "uuid",
  "title": "Project Requirements",
  "content": "Detailed project requirements...",
  "ownerId": "uuid",
  "teamId": "uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Error Responses**:
- `400` - Validation error
- `403` - Not authenticated or insufficient permissions
- `429` - Too many requests (rate limit exceeded)

---

### `GET /documents`

Get all documents in the authenticated user's team.

**Access**: Authenticated + `docs:view` permission

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "title": "Project Requirements",
    "content": "Document content...",
    "ownerId": "uuid",
    "ownerEmail": "owner@team.com",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "title": "Meeting Notes",
    "content": "Meeting content...",
    "ownerId": "uuid",
    "ownerEmail": "owner@team.com",
    "createdAt": "2024-01-02T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
]
```

**Error Responses**:
- `403` - Not authenticated or insufficient permissions

---

### `GET /documents/my-documents`

Get only documents created by the authenticated user.

**Access**: Authenticated

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "title": "My Document",
    "content": "Document content...",
    "ownerId": "uuid",
    "ownerEmail": "me@team.com",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error Responses**:
- `403` - Not authenticated

---

### `GET /documents/:id`

View a specific document.

**Access**: Authenticated + (Permission or Ownership)

**URL Parameters**:
- `id` (uuid) - Document ID

**Access Control**: User must either:
- Have `docs:view` permission, OR
- Be the document owner

**Success Response** (200):
```json
{
  "id": "uuid",
  "title": "Project Requirements",
  "content": "Detailed content...",
  "ownerId": "uuid",
  "teamId": "uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Error Responses**:
- `403` - Not authenticated or insufficient permissions
- `404` - Document not found

---

### `PUT /documents/:id`

Update an existing document.

**Access**: Authenticated + (Permission or Ownership)  
**Rate Limited**: ✅  
**CSRF Protected**: ✅

**URL Parameters**:
- `id` (uuid) - Document ID

**Access Control**: User must either:
- Have `docs:update` permission, OR
- Be the document owner

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**Validation**:
- `title` - Required, non-empty
- `content` - Required, non-empty string

**Success Response** (200):
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "content": "Updated content...",
  "updatedAt": "2024-01-01T00:30:00Z"
}
```

**Error Responses**:
- `400` - Validation error
- `403` - Not authenticated or insufficient permissions
- `404` - Document not found
- `429` - Too many requests (rate limit exceeded)

---

### `DELETE /documents/:id`

Delete a document.

**Access**: Authenticated + (Permission or Ownership)

**URL Parameters**:
- `id` (uuid) - Document ID

**Access Control**: User must either:
- Have `docs:delete` permission, OR
- Be the document owner

**Success Response** (200):
```json
{
  "message": "Document deleted successfully"
}
```

**Error Responses**:
- `403` - Not authenticated or insufficient permissions
- `404` - Document not found

---

## Common Error Response Format

All error responses follow this structure:

```json
{
  "error": "Error message description"
}
```

Or for validation errors:

```json
{
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    },
    {
      "field": "password",
      "message": "Password is required"
    }
  ]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
