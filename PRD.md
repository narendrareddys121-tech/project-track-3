# Product Requirements Document (PRD)
# TaskAI — AI-Powered Task Management Platform

**Version:** 1.0.0  
**Date:** August 2026  
**Author:** Development Team  
**Status:** Active

---

## 1. Executive Summary

TaskAI is a full-stack AI-powered task and project management web application that enables individuals and teams to organise work more efficiently. By integrating OpenAI's GPT models, the platform provides intelligent task suggestions, automated descriptions, and progress summarisation — reducing the cognitive overhead of project planning.

---

## 2. Problem Statement

Modern software teams struggle with:
- **Context switching** between task management, documentation, and communication tools.
- **Manual task planning** that is time-consuming and often incomplete.
- **Lack of intelligence** in existing tools — they store tasks but do not help prioritise or suggest next steps.
- **Data fragmentation** between relational and document-oriented data needs.

TaskAI addresses these pain points through a unified, AI-augmented platform.

---

## 3. Goals & Success Metrics

### Goals
- Provide a fast, intuitive task management experience.
- Reduce task planning time by 40% using AI suggestions.
- Support both individual users and small teams.
- Demonstrate best engineering practices across the full stack.

### Success Metrics
| Metric | Target |
|---|---|
| User registration → first task created | < 2 minutes |
| AI suggestion response time | < 5 seconds |
| API response time (p95) | < 200ms |
| Test coverage | ≥ 80% |
| Uptime | 99.5% |

---

## 4. User Personas

### Persona 1: Student Developer (Primary)
- **Name:** Arjun, 21, CS student
- **Goals:** Track personal coding projects, get AI help planning tasks
- **Frustrations:** Existing tools are too heavyweight for personal use
- **Tech savvy:** High

### Persona 2: Team Lead
- **Name:** Priya, 28, startup founder
- **Goals:** Manage team projects, see progress at a glance
- **Frustrations:** Context switching between tools, manual reporting
- **Tech savvy:** Medium-High

### Persona 3: Admin
- **Name:** Rahul, 35, CTO
- **Goals:** Oversee all projects, manage user roles
- **Frustrations:** Lack of visibility and control across teams
- **Tech savvy:** High

---

## 5. Functional Requirements

### 5.1 Authentication & Security
- FR-01: Users can register with name, email, and password (min 6 chars)
- FR-02: Passwords are hashed with bcrypt (cost factor ≥ 12)
- FR-03: JWT tokens issued on login (7-day expiry)
- FR-04: Google OAuth 2.0 sign-in supported
- FR-05: All API endpoints (except auth) require valid JWT
- FR-06: Role-based access: ADMIN and MEMBER roles
- FR-07: Rate limiting: 10 requests/15 min on auth endpoints, 100/15 min elsewhere

### 5.2 Task Management
- FR-08: Users can create tasks with title, description, status, priority, due date, tags
- FR-09: Task statuses: `todo`, `in_progress`, `done`
- FR-10: Task priorities: `low`, `medium`, `high`
- FR-11: Users can filter tasks by status and priority
- FR-12: Users can search tasks by title
- FR-13: Tasks are paginated (20 per page)
- FR-14: Users can only access their own tasks (ownership check)

### 5.3 AI Features
- FR-15: AI suggests 5 tasks given a project description
- FR-16: AI summarises current task list with recommendations
- FR-17: AI generates task descriptions from a title
- FR-18: AI generates improvement suggestions for individual tasks
- FR-19: Falls back to mock responses when API key is not set

### 5.4 Project Management
- FR-20: Users can create, read, update, delete projects
- FR-21: Projects stored in PostgreSQL with owner relationship
- FR-22: Project members can be added with ADMIN or MEMBER role
- FR-23: Users see projects they own or are a member of

### 5.5 Activity Logging
- FR-24: All create, update, delete actions logged to MongoDB ActivityLog
- FR-25: Logs include: userId, action, resourceType, resourceId, details, timestamp

### 5.6 Real-Time
- FR-26: Task create/update events broadcast via Socket.io to project room
- FR-27: Clients can join a project room to receive live updates

---

## 6. Non-Functional Requirements

### 6.1 Performance
- API response time p95 < 200ms (with Redis caching)
- Frontend initial load < 3 seconds
- Support up to 100 concurrent users

### 6.2 Security
- HTTPS in production (handled by reverse proxy)
- Helmet.js security headers on all responses
- CORS restricted to frontend URL
- Passwords never stored in plaintext
- JWT secrets rotatable via environment variable

### 6.3 Scalability
- Stateless backend — horizontally scalable
- Redis for shared session/cache state
- MongoDB handles high-volume document writes (task CRUD, logs)
- PostgreSQL handles relational data (users, projects)

### 6.4 Maintainability
- ESLint enforced code style
- Jest test coverage ≥ 80%
- Prisma migrations for schema changes
- Docker Compose for reproducible local development

---

## 7. User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | New user | Register with my email and password | I can create an account |
| US-02 | Returning user | Log in with my credentials | I can access my tasks |
| US-03 | User | Log in with Google | I don't need to remember a password |
| US-04 | User | Create a task with a title and description | I can track my work |
| US-05 | User | Set priority and due date on tasks | I can manage urgency |
| US-06 | User | Filter tasks by status | I can focus on what's relevant |
| US-07 | User | Search tasks by keyword | I can quickly find specific tasks |
| US-08 | User | Get AI task suggestions for my project | I save planning time |
| US-09 | User | Get an AI summary of my tasks | I understand my progress |
| US-10 | User | Get AI to generate a task description | I save writing time |
| US-11 | User | Create a project | I can organise tasks by project |
| US-12 | Team Lead | Add members to a project | My team can collaborate |
| US-13 | User | See a dashboard with stats | I have an overview of my work |
| US-14 | User | See real-time task updates | I know when teammates make changes |
| US-15 | Admin | Assign ADMIN or MEMBER roles | I can control access levels |

---

## 8. Out of Scope (v1.0)

- Mobile native apps (iOS/Android)
- Email notifications
- File attachments on tasks
- Time tracking
- Billing / subscription management
- Advanced analytics / reporting dashboard

---

## 9. Timeline

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 1: Foundation | Week 1 | Project setup, DB schemas, auth API |
| Phase 2: Core Features | Week 2 | Task CRUD, project CRUD, frontend pages |
| Phase 3: AI Integration | Week 3 | OpenAI service, AI routes, AI UI |
| Phase 4: Polish | Week 4 | Tests, Docker, documentation, deployment |

---

## 10. Dependencies & Assumptions

- OpenAI API access (GPT-3.5 or GPT-4)
- PostgreSQL 15+ and MongoDB 7+
- Redis 7+ for caching
- Node.js 20+ runtime
- Modern browser with ES2020 support
