# High-Level Design (HLD)
# TaskAI — AI-Powered Task Management Platform

**Version:** 1.0.0  
**Date:** August 2026

---

## 1. System Overview

TaskAI is a three-tier web application consisting of a React single-page application (SPA) frontend, a Node.js/Express REST API backend, and a polyglot persistence layer using PostgreSQL, MongoDB, and Redis.

The system integrates the OpenAI API for intelligent task management features and uses Socket.io for real-time collaboration.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │          React SPA (Vite + Tailwind CSS)              │    │
│   │   Login │ Register │ Dashboard │ Tasks │ Projects     │    │
│   │              React Router + React Query               │    │
│   └──────────────────────┬────────────────────────────────┘    │
│                          │ HTTP/WebSocket                        │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    API LAYER (Port 5000)                         │
│                                                                  │
│   ┌──────────────────────▼───────────────────────────────┐     │
│   │              Express.js REST API                      │     │
│   │                                                       │     │
│   │  Middleware Stack:                                    │     │
│   │  helmet → cors → morgan → json → rateLimiter          │     │
│   │                                                       │     │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │     │
│   │  │  /auth   │ │ /tasks   │ │/projects │ │  /ai   │  │     │
│   │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │     │
│   │         │           │           │            │         │     │
│   │  ┌──────▼───────────▼───────────▼────────────▼──────┐│     │
│   │  │              JWT Auth Middleware                  ││     │
│   │  └──────────────────────────────────────────────────┘│     │
│   │                                                       │     │
│   │  Socket.io Server (real-time task events)            │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    DATA LAYER                                     │
│                                                                  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│   │ PostgreSQL │  │  MongoDB   │  │   Redis    │  │ OpenAI   │ │
│   │  (Prisma)  │  │ (Mongoose) │  │  (Cache)   │  │   API    │ │
│   │            │  │            │  │            │  │          │ │
│   │  - Users   │  │  - Tasks   │  │ - Sessions │  │ - GPT    │ │
│   │  - Projects│  │  - Activity│  │ - API cache│  │          │ │
│   │  - Members │  │    Logs    │  │            │  │          │ │
│   └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Descriptions

### 3.1 Frontend (React SPA)
- **Technology:** React 18, Vite, Tailwind CSS, React Router v6
- **State Management:** React Query (server state) + Context API (auth state)
- **HTTP Client:** Axios with interceptors for JWT attachment and 401 handling
- **Pages:** Login, Register, Dashboard, Tasks, Projects
- **Key Components:** Navbar, TaskCard, AIAssistant, ProtectedRoute
- **Port:** 3000 (dev), served via Nginx or CDN in production

### 3.2 Backend API (Node.js/Express)
- **Technology:** Node.js 20, Express.js 4, Socket.io 4
- **Architecture:** Controller → Service → Repository pattern
- **Auth:** JWT (jsonwebtoken) + bcrypt password hashing
- **Validation:** Zod schema validation on inputs
- **Logging:** Morgan HTTP logger + ActivityLog MongoDB model
- **Security:** Helmet.js headers, CORS, rate limiting
- **Port:** 5000

### 3.3 PostgreSQL (via Prisma ORM)
- **Purpose:** Relational data — users, projects, memberships
- **Why:** Strong consistency, ACID transactions, foreign key integrity for user/project relationships
- **ORM:** Prisma with typed client and migration support
- **Port:** 5432

### 3.4 MongoDB (via Mongoose)
- **Purpose:** Document data — tasks, activity logs
- **Why:** Flexible schema for task metadata (tags, AI suggestions, custom fields), high write throughput for activity logs
- **Port:** 27017

### 3.5 Redis
- **Purpose:** API response caching, rate limiter storage
- **Cache Strategy:** Cache-aside pattern with 60-second TTL on task list queries
- **Graceful Degradation:** App functions without Redis — caching is disabled
- **Port:** 6379

### 3.6 OpenAI API (External Service)
- **Purpose:** AI task suggestions, summarisation, description generation
- **Integration:** REST API via `openai` npm package
- **Fallback:** Mock responses returned when API key is absent (development mode)
- **Rate Limiting:** Requests throttled by express-rate-limit to avoid quota exhaustion

---

## 4. Data Flow Diagrams

### 4.1 Authentication Flow
```
Client → POST /api/auth/register
  → Zod validate input
  → Check duplicate email in PostgreSQL
  → bcrypt.hash(password, 12)
  → prisma.user.create()
  → jwt.sign({id, email, role})
  → Return {token, user}

Client → POST /api/auth/login
  → Zod validate input
  → prisma.user.findUnique(email)
  → bcrypt.compare(password, hash)
  → jwt.sign(payload)
  → Return {token, user}
```

### 4.2 Task Creation Flow
```
Client → POST /api/tasks [Authorization: Bearer <token>]
  → verifyToken middleware
    → jwt.verify(token)
    → req.user = decoded payload
  → task.controller.createTask()
    → Validate title required
    → Task.create() in MongoDB
    → cacheDel(tasks:userId:*) in Redis
    → ActivityLog.create() in MongoDB
    → io.emit('task:created') via Socket.io
  → Return 201 {task}
```

### 4.3 AI Suggestion Flow
```
Client → POST /api/ai/suggest-tasks [Authorization: Bearer <token>]
  → verifyToken middleware
  → ai.controller.suggestTasks()
    → Validate context string
    → openai.service.chatCompletion(messages)
      → If OPENAI_API_KEY set: call GPT API
      → Else: return mock response
    → Return {suggestions}
```

---

## 5. Technology Stack Summary

| Layer | Technology | Justification |
|---|---|---|
| Frontend Framework | React 18 | Industry standard, component model |
| Build Tool | Vite | Fast HMR, optimised builds |
| Styling | Tailwind CSS | Utility-first, rapid UI development |
| State (server) | React Query | Caching, invalidation, loading states |
| HTTP Client | Axios | Interceptors, timeout, error handling |
| Backend | Node.js + Express | High concurrency, npm ecosystem |
| SQL Database | PostgreSQL | ACID, relational integrity |
| ORM | Prisma | Type-safe, migration support |
| NoSQL Database | MongoDB | Flexible schema, high write throughput |
| ODM | Mongoose | Schema validation, indexes |
| Cache | Redis | Fast in-memory caching, rate limiting |
| Auth | JWT + bcrypt | Stateless, secure |
| Real-time | Socket.io | WebSocket with fallbacks |
| AI | OpenAI GPT | State-of-the-art language model |
| Testing | Jest + Supertest | Standard Node.js testing |
| Containerisation | Docker + Compose | Reproducible environments |

---

## 6. Security Architecture

```
┌─────────────────────────────────────┐
│           Security Layers           │
├─────────────────────────────────────┤
│ 1. HTTPS (TLS termination at proxy) │
│ 2. Helmet.js security headers       │
│ 3. CORS whitelist (frontend URL)    │
│ 4. Rate limiting (auth: 10/15min)   │
│ 5. Zod input validation             │
│ 6. JWT verification on all routes   │
│ 7. bcrypt password hashing (12 rds) │
│ 8. Ownership checks in controllers  │
│ 9. Prisma parameterised queries     │
│ 10. Environment variable secrets    │
└─────────────────────────────────────┘
```

---

## 7. Scalability Considerations

- **Horizontal Scaling:** Stateless API (JWT) — add instances behind a load balancer
- **Database Scaling:** PostgreSQL read replicas; MongoDB replica sets
- **Cache Scaling:** Redis Cluster for distributed caching
- **CDN:** Frontend static assets served from CDN (Vercel/Cloudflare)
- **Message Queue:** Future: Bull/BullMQ for async AI job processing

---

## 8. Deployment Strategy

```
Development:  docker-compose up (local all-in-one)
Staging:      Render.com / Railway (backend) + Vercel (frontend)
Production:   AWS ECS / GCP Cloud Run + RDS + MongoDB Atlas + ElastiCache
```

---

## 9. API Design Overview

| Prefix | Description | Auth |
|---|---|---|
| `POST /api/auth/register` | Register new user | No |
| `POST /api/auth/login` | Login, get JWT | No |
| `GET /api/auth/me` | Get current user | Yes |
| `GET /api/tasks` | List tasks (paginated, filtered) | Yes |
| `POST /api/tasks` | Create task | Yes |
| `PUT /api/tasks/:id` | Update task | Yes |
| `DELETE /api/tasks/:id` | Delete task | Yes |
| `POST /api/tasks/:id/ai-suggest` | AI suggestion for task | Yes |
| `GET /api/projects` | List projects | Yes |
| `POST /api/projects` | Create project | Yes |
| `POST /api/ai/suggest-tasks` | AI suggest tasks | Yes |
| `POST /api/ai/summarize` | AI summarize tasks | Yes |
| `POST /api/ai/generate-description` | AI generate description | Yes |
