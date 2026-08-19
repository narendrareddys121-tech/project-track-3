# 🤖 TaskAI - Comprehensive AI Audit Document

**Purpose:** This document is designed to give any AI system (or human developer) a complete, A-to-Z understanding of the `TaskAI` project. It covers the architecture, technology stack, directory structure, data models, API endpoints, and core functionality.

---

## 1. Project Overview
TaskAI is a full-stack, AI-powered task and project management application. It was built to satisfy complex engineering requirements, utilizing a hybrid database approach (SQL + NoSQL), real-time capabilities via WebSockets, and AI integration for productivity enhancements.

## 2. Technology Stack

### 2.1 Frontend
*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Routing:** React Router v6
*   **Styling:** Tailwind CSS (utility-first)
*   **State Management / Data Fetching:** React Query (@tanstack/react-query)
*   **HTTP Client:** Axios (configured with interceptors for JWT)
*   **Icons:** Lucide React
*   **Notifications:** React Hot Toast

### 2.2 Backend
*   **Runtime:** Node.js 20
*   **Framework:** Express.js 4
*   **Real-time:** Socket.io 4 (WebSocket)
*   **Authentication:** JWT (jsonwebtoken) + bcryptjs + Google OAuth 2.0 (passport)
*   **Validation:** Zod
*   **Logging:** Morgan
*   **Security:** Helmet.js, Express Rate Limit, CORS

### 2.3 Databases & Infrastructure
*   **Relational Database (SQL):** PostgreSQL 15
*   **SQL ORM:** Prisma
*   **Document Database (NoSQL):** MongoDB 7
*   **NoSQL ODM:** Mongoose
*   **Caching / Session:** Redis 7
*   **AI Integration:** OpenAI API (GPT-3.5-turbo / GPT-4)
*   **Containerization:** Docker & Docker Compose

---

## 3. Architecture & Data Flow

TaskAI uses a modern separation of concerns:
1.  **Frontend SPA:** Communicates with the backend exclusively via REST APIs and WebSocket events.
2.  **Hybrid Persistence Layer:**
    *   **PostgreSQL** handles strictly relational data requiring ACID compliance (Users, Projects, Memberships).
    *   **MongoDB** handles document-heavy, flexible schema data (Tasks, Tags, AI Suggestions, Activity Logs).
3.  **Caching Layer:** Redis is used for API response caching (specifically for task list fetching) and rate-limiting to prevent abuse.
4.  **AI Layer:** An external call to OpenAI generates suggestions, summaries, and descriptions based on user context.

---

## 4. Directory Structure

```text
project-track-3/
├── PRD.md                 # Product Requirements
├── HLD.md                 # High-Level Architecture
├── LLD.md                 # Low-Level Design (Schemas/Endpoints)
├── README.md              # Project instructions
├── docker-compose.yml     # Multi-container orchestration
├── backend/               # ------------------ BACKEND ------------------
│   ├── prisma/
│   │   └── schema.prisma  # PostgreSQL schema (User, Project, ProjectMember)
│   ├── src/
│   │   ├── config/        # DB Connections (db.js for Mongo, prisma.js for PG, redis.js)
│   ├── controllers/   # Business logic (ai, auth, project, task)
│   │   ├── middleware/    # auth.js (JWT), errorHandler.js, rateLimiter.js
│   │   ├── models/        # Mongoose schemas (Task.js, ActivityLog.js)
│   │   ├── routes/        # Express route definitions
│   │   ├── services/      # openai.service.js (AI integrations)
│   │   ├── tests/         # Jest/Supertest test suites
│   │   └── index.js       # Express entry point & Socket.io setup
│   ├── Dockerfile         # Multi-stage Docker build for backend
│   └── package.json       
└── frontend/              # ------------------ FRONTEND -----------------
    ├── src/
    │   ├── components/    # Reusable UI (Navbar, TaskCard, AIAssistant, ProtectedRoute)
    │   ├── context/       # AuthContext.jsx (JWT persistence)
    │   ├── hooks/         # useAuth.js, useTasks.js (React Query hooks)
    │   ├── pages/         # Dashboard, Login, Projects, Register, Tasks
    │   ├── services/      # api.js (Axios instance and endpoint definitions)
    │   ├── App.jsx        # Route definitions
    │   ├── main.jsx       # React DOM mount & Context Providers
    │   └── index.css      # Tailwind directives
    ├── Dockerfile         # Vite build + Nginx serve
    ├── tailwind.config.js 
    ├── vite.config.js     
    └── package.json       
```

---

## 5. Database Schemas

### 5.1 PostgreSQL (Prisma)
*   **User:** `id` (UUID), `name`, `email`, `password`, `role` (ADMIN/MEMBER), `googleId`, `avatar`.
*   **Project:** `id` (UUID), `name`, `description`, `ownerId` (relates to User).
*   **ProjectMember:** `id` (UUID), `projectId`, `userId`, `role`.

### 5.2 MongoDB (Mongoose)
*   **Task:** `_id` (ObjectId), `title`, `description`, `status` (todo/in_progress/done), `priority` (low/medium/high), `projectId` (String/UUID matching PG), `assignedTo` (String/UUID matching PG), `createdBy`, `dueDate`, `tags` (Array), `aiSuggestion`.
*   **ActivityLog:** `_id`, `userId`, `action`, `resourceType`, `resourceId`, `details`.

---

## 6. Core Functionalities & Workflows

### 6.1 Authentication (JWT Lifecycle)
1.  User registers/logs in via `POST /api/auth/*`.
2.  Backend validates via Zod, verifies against PostgreSQL (bcrypt).
3.  Backend issues a JWT signed with `JWT_SECRET`.
4.  Frontend stores token in `localStorage`.
5.  Axios interceptor attaches `Authorization: Bearer <token>` to all outgoing requests.
6.  Backend `verifyToken` middleware decodes JWT and appends `req.user`.

### 6.2 Task Management (CRUD + Caching)
1.  **Read:** `GET /api/tasks` checks Redis first. If cache miss, queries MongoDB, then sets Redis cache (TTL 60s).
2.  **Create/Update/Delete:** Modifies MongoDB, immediately invalidates (deletes) the specific user's Redis cache keys (`tasks:userId:*`), and creates an `ActivityLog` entry.
3.  **Real-time:** Updates trigger Socket.io events (`task:created`, `task:updated`) emitted to specific `project:<id>` rooms.

### 6.3 AI Features (OpenAI)
*   **Suggest Tasks (`POST /api/ai/suggest-tasks`):** Takes a project context string, prompts GPT to generate 5 actionable tasks.
*   **Summarize Tasks (`POST /api/ai/summarize`):** Takes an array of current tasks, prompts GPT to generate a status report and next-step recommendations.
*   **Generate Description (`POST /api/ai/generate-description`):** Takes a task title and expands it into a detailed description with success criteria.
*   *Fallback Mechanism:* If `OPENAI_API_KEY` is missing or invalid, `openai.service.js` gracefully falls back to mock responses.

---

## 7. Security & Engineering Practices
*   **Rate Limiting:** Prevents brute force (10 req/15 min for auth, 100 req/15 min for API).
*   **Error Handling:** Centralized Express error handler catches Prisma exceptions (`P2002`), Mongoose validations, Zod validations, and JWT errors, returning standard JSON.
*   **Testing:** Automated tests written with Jest and Supertest (`backend/src/tests/`).
*   **Environment Variables:** Strictly managed (`.env.example` provided).

## 8. How to Spin Up the Project
For any AI or developer looking to run this:
1. Ensure Docker Desktop is running.
2. Run `docker-compose up -d` in the root. This spins up Postgres, MongoDB, Redis, the Node backend, and the Vite frontend.
3. Connect to the backend container to push the DB schema: `docker-compose exec backend npx prisma db push`.
4. The app is accessible at `http://localhost:3000`.

---
*End of Audit Document.*
