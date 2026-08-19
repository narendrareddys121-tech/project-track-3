# Low-Level Design (LLD)
# TaskAI — AI-Powered Task Management Platform

**Version:** 1.0.0  
**Date:** August 2026

---

## 1. Database Schemas

### 1.1 PostgreSQL Schemas (via Prisma)

#### Table: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique user ID |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| password | VARCHAR(255) | NULLABLE | bcrypt hash (null for OAuth users) |
| role | ENUM(ADMIN,MEMBER) | DEFAULT MEMBER | User role |
| googleId | VARCHAR(255) | UNIQUE, NULLABLE | Google OAuth ID |
| avatar | TEXT | NULLABLE | Profile picture URL |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | Auto-updated | Last update timestamp |

#### Table: `projects`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Unique project ID |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULLABLE | Project description |
| ownerId | UUID | FK → users.id, CASCADE | Project creator |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | Auto-updated | Last update timestamp |

#### Table: `project_members`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Member record ID |
| projectId | UUID | FK → projects.id, CASCADE | Project reference |
| userId | UUID | FK → users.id, CASCADE | User reference |
| role | ENUM(ADMIN,MEMBER) | DEFAULT MEMBER | Member role |
| joinedAt | TIMESTAMP | DEFAULT now() | Join timestamp |
| | | UNIQUE(projectId, userId) | No duplicate members |

---

### 1.2 MongoDB Schemas (via Mongoose)

#### Collection: `tasks`
```javascript
{
  _id: ObjectId,           // Auto-generated MongoDB ID
  title: String,           // Required, max 200 chars
  description: String,     // Optional, max 2000 chars
  status: String,          // Enum: 'todo' | 'in_progress' | 'done'
  priority: String,        // Enum: 'low' | 'medium' | 'high'
  projectId: String,       // UUID string → PostgreSQL projects.id
  assignedTo: String,      // UUID string → PostgreSQL users.id
  createdBy: String,       // UUID string → PostgreSQL users.id (required)
  dueDate: Date,           // Optional deadline
  tags: [String],          // Array of tag strings
  aiSuggestion: String,    // AI-generated improvement tip
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-updated
}

Indexes:
  { createdBy: 1, status: 1 }   — for user task listing with status filter
  { projectId: 1 }              — for project task listing
```

#### Collection: `activitylogs`
```javascript
{
  _id: ObjectId,
  userId: String,          // UUID string → PostgreSQL users.id (required)
  action: String,          // e.g. 'created_task', 'deleted_project'
  resourceType: String,    // Enum: 'task' | 'project' | 'user'
  resourceId: String,      // ID of affected resource
  details: Mixed,          // Arbitrary details object
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { userId: 1, createdAt: -1 }       — user activity feed
  { resourceType: 1, resourceId: 1 } — resource audit trail
```

---

## 2. API Endpoint Specifications

### 2.1 Authentication Endpoints

#### `POST /api/auth/register`
**Request Body:**
```json
{
  "name": "string (min 2, max 100)",
  "email": "string (valid email)",
  "password": "string (min 6)"
}
```
**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "uuid", "name": "...", "email": "...", "role": "MEMBER", "createdAt": "..." }
}
```
**Error Responses:** 400 (validation), 409 (duplicate email)

---

#### `POST /api/auth/login`
**Request Body:**
```json
{ "email": "string", "password": "string" }
```
**Success Response (200):**
```json
{ "success": true, "token": "eyJhbGci...", "user": { ... } }
```
**Error Responses:** 400 (validation), 401 (wrong credentials)

---

#### `GET /api/auth/me`
**Headers:** `Authorization: Bearer <token>`  
**Success Response (200):**
```json
{ "success": true, "user": { "id": "...", "name": "...", "email": "...", "role": "..." } }
```

---

### 2.2 Task Endpoints (all require JWT)

#### `GET /api/tasks`
**Query Params:** `status`, `priority`, `projectId`, `page` (default 1), `limit` (default 20)  
**Success Response (200):**
```json
{
  "success": true,
  "tasks": [ { "_id": "...", "title": "...", "status": "todo", ... } ],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

---

#### `POST /api/tasks`
**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "projectId": "uuid string (optional)",
  "dueDate": "ISO date string (optional)",
  "tags": ["string array (optional)"]
}
```
**Success Response (201):**
```json
{ "success": true, "task": { "_id": "...", "title": "...", ... } }
```

---

#### `PUT /api/tasks/:id`
**Request Body:** Any subset of task fields  
**Success Response (200):** `{ "success": true, "task": { ... } }`  
**Error:** 404 if not found or not owned by user

---

#### `DELETE /api/tasks/:id`
**Success Response (200):** `{ "success": true, "message": "Task deleted" }`

---

#### `POST /api/tasks/:id/ai-suggest`
**Success Response (200):**
```json
{ "success": true, "suggestion": "string", "task": { ... } }
```

---

### 2.3 Project Endpoints (all require JWT)

#### `GET /api/projects`
Returns projects owned by or shared with the user. Includes `_count.members`.

#### `POST /api/projects`
**Request Body:** `{ "name": "string", "description": "string (optional)" }`

#### `POST /api/projects/:id/members`
**Request Body:** `{ "userId": "uuid", "role": "MEMBER | ADMIN" }`

---

### 2.4 AI Endpoints (all require JWT)

#### `POST /api/ai/suggest-tasks`
**Request Body:** `{ "context": "string describing the project" }`  
**Response:** `{ "success": true, "suggestions": "formatted string with 5 tasks" }`

#### `POST /api/ai/summarize`
**Request Body:** `{ "tasks": [{ "title": "...", "status": "...", "priority": "..." }] }`  
**Response:** `{ "success": true, "summary": "AI summary string" }`

#### `POST /api/ai/generate-description`
**Request Body:** `{ "title": "string" }`  
**Response:** `{ "success": true, "description": "generated description string" }`

---

## 3. Middleware Implementation Details

### 3.1 `verifyToken` Middleware
```
1. Extract Authorization header
2. Check format: "Bearer <token>"
3. If missing → 401 "Access token required"
4. jwt.verify(token, JWT_SECRET)
5. If expired → 401 "Token expired"
6. If invalid → 401 "Invalid token"
7. Set req.user = decoded payload
8. Call next()
```

### 3.2 `rateLimiter` Middleware
```
General: 100 requests per 15 minutes per IP
Auth:    10 requests per 15 minutes per IP
Store:   Memory (MemoryStore — swap for Redis in production)
Response on limit: 429 with JSON error message
```

### 3.3 `errorHandler` Middleware
```
Signature: (err, req, res, next)
Handles:
  - Prisma P2002 → 409 Conflict
  - Prisma P2025 → 404 Not Found
  - Mongoose ValidationError → 400 Bad Request
  - Mongoose CastError → 400 Invalid ID
  - JsonWebTokenError → 401 Unauthorized
  - TokenExpiredError → 401 Unauthorized
  - ZodError → 400 Validation Error
  - Default → 500 Internal Server Error
  Development: includes stack trace in response
```

---

## 4. Authentication Flow (JWT Lifecycle)

```
Registration:
  1. Client: POST /api/auth/register { name, email, password }
  2. Server: Validate with Zod → Hash password (bcrypt, 12 rounds)
  3. Server: INSERT user into PostgreSQL
  4. Server: jwt.sign({ id, email, name, role }, JWT_SECRET, { expiresIn: "7d" })
  5. Server: Return { token, user }
  6. Client: Store token in localStorage as "taskai_token"

Subsequent Requests:
  1. Client: Axios interceptor reads "taskai_token" from localStorage
  2. Client: Adds "Authorization: Bearer <token>" header
  3. Server: verifyToken middleware decodes and attaches req.user

Token Expiry:
  1. Server returns 401 on expired token
  2. Client Axios interceptor detects 401
  3. Client clears localStorage, redirects to /login

Logout:
  1. Client: POST /api/auth/logout (stateless — server returns 200)
  2. Client: Removes token from localStorage, navigate to /login
```

---

## 5. AI Integration Flow

```
OpenAI Service (src/services/openai.service.js):
  
  getClient():
    → Check OPENAI_API_KEY env var
    → If set: return singleton OpenAI client
    → If not set: return null

  chatCompletion(messages, model):
    → client = getClient()
    → If client is null: return getMockResponse(messages)
    → Else: call client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    → Return response.choices[0].message.content

Mock Fallback (getMockResponse):
  → Inspects last message content
  → Returns context-appropriate static response
  → Enables development/testing without API key
```

---

## 6. Redis Caching Strategy

```
Pattern: Cache-Aside

READ:
  1. Compute cache key: "tasks:<userId>:<serialized query params>"
  2. cacheGet(key) → if hit, return cached data
  3. If miss: query MongoDB, cacheSet(key, data, TTL=60s)

WRITE (create/update/delete):
  1. Execute DB write operation
  2. cacheDel("tasks:<userId>:*") — invalidate all user task caches

Graceful Degradation:
  - If Redis unavailable: skip cache, always query DB
  - No error thrown to user
```

---

## 7. Real-Time (Socket.io) Design

```
Server:
  io.on('connection', (socket) => {
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`)
    })
  })

  // Emitted in task controller:
  io.to(`project:${projectId}`).emit('task:created', taskData)
  io.to(`project:${projectId}`).emit('task:updated', taskData)

Client (future implementation):
  socket.emit('join-project', projectId)
  socket.on('task:created', (task) => queryClient.invalidateQueries(['tasks']))
  socket.on('task:updated', (task) => queryClient.invalidateQueries(['tasks']))
```

---

## 8. Error Handling Strategy

| Layer | Strategy |
|---|---|
| Frontend | Axios interceptors catch errors, toast notifications shown |
| Route Handler | Try/catch with `next(err)` for async errors |
| Middleware | Central `errorHandler` maps error types to HTTP codes |
| Database | Prisma/Mongoose errors caught and mapped to user-friendly messages |
| AI Service | Fallback to mock responses; no crash on missing API key |
| Redis | Non-fatal — gracefully disables caching |

---

## 9. Test Plan

### Unit / Integration Tests (Jest + Supertest)

#### auth.test.js
| Test | Expected |
|---|---|
| POST /register — valid data | 201, token returned |
| POST /register — duplicate email | 409 |
| POST /register — invalid email | 400 |
| POST /register — short password | 400 |
| POST /login — correct credentials | 200, token |
| POST /login — wrong password | 401 |
| GET /me — with token | 200, user object |
| GET /me — no token | 401 |

#### task.test.js
| Test | Expected |
|---|---|
| GET /tasks — no auth | 401 |
| GET /tasks — with auth | 200, tasks array |
| POST /tasks — valid | 201, task object |
| POST /tasks — no title | 400 |
| GET /tasks/:id — valid id | 200 |
| GET /tasks/:id — not found | 404 |
| PUT /tasks/:id | 200, updated task |
| DELETE /tasks/:id | 200 |
| DELETE /tasks/:id — already deleted | 404 |

### Commands
```bash
cd backend
npm test
npm test -- --coverage
```
