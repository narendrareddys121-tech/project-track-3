# TaskAI — AI-Powered Task Management Platform

![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)
![License](https://img.shields.io/badge/license-MIT-green)

A full-stack **AI-powered task and project management** platform built with React, Node.js, PostgreSQL, MongoDB, and Redis — integrated with OpenAI for intelligent task suggestions.

---

## ✨ Features

- 🔐 **Secure Authentication** — JWT + bcrypt + Google OAuth
- ✅ **Task Management** — Create, filter, search, and track tasks with statuses and priorities
- 📁 **Project Organisation** — Group tasks into projects, invite team members
- 🤖 **AI Assistant** — GPT-powered task suggestions, summaries, and descriptions
- ⚡ **Real-Time Updates** — Socket.io WebSocket for live task collaboration
- 🗄️ **Hybrid Database** — PostgreSQL for users/projects, MongoDB for tasks/logs
- 💾 **Redis Caching** — API response caching for performance
- 📊 **Dashboard** — Progress overview with stats and recent activity
- 🐳 **Docker Ready** — One-command local setup with Docker Compose

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, React Query |
| Backend | Node.js 20, Express.js, Socket.io |
| SQL Database | PostgreSQL 15 with Prisma ORM |
| NoSQL Database | MongoDB 7 with Mongoose |
| Cache | Redis 7 |
| Authentication | JWT, bcrypt, Google OAuth 2.0 |
| AI | OpenAI GPT-3.5/GPT-4 |
| Testing | Jest, Supertest |
| DevOps | Docker, Docker Compose |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [npm](https://npmjs.com/) 10+
- [Docker](https://docker.com/) & Docker Compose (for databases)
- (Optional) [OpenAI API Key](https://platform.openai.com/)

---

## 🚀 Quick Start

### Option A: Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/<your-username>/taskai.git
cd taskai

# Copy env and configure
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Start everything
docker-compose up -d

# Run DB migrations
docker-compose exec backend npm run db:push
```

App will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/health

---

### Option B: Manual Setup

#### 1. Start Databases

```bash
# PostgreSQL
docker run -d --name pg -e POSTGRES_USER=taskai_user -e POSTGRES_PASSWORD=taskai_pass -e POSTGRES_DB=taskai_db -p 5432:5432 postgres:15-alpine

# MongoDB
docker run -d --name mongo -p 27017:27017 mongo:7

# Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

#### 2. Setup Backend

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your database URLs and secrets

# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Start dev server
npm run dev
```

#### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://...` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your_secret_here` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

> **Note:** If `OPENAI_API_KEY` is not set, the AI features return intelligent mock responses for development.

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run a specific test file
npm test -- auth.test.js
```

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, receive JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/google` | ❌ | Google OAuth redirect |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | ✅ | List tasks (paginated, filterable) |
| POST | `/api/tasks` | ✅ | Create task |
| GET | `/api/tasks/:id` | ✅ | Get task by ID |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |
| POST | `/api/tasks/:id/ai-suggest` | ✅ | Get AI suggestion for task |

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | ✅ | List user's projects |
| POST | `/api/projects` | ✅ | Create project |
| GET | `/api/projects/:id` | ✅ | Get project with members |
| PUT | `/api/projects/:id` | ✅ | Update project |
| DELETE | `/api/projects/:id` | ✅ | Delete project |
| POST | `/api/projects/:id/members` | ✅ | Add member to project |

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/suggest-tasks` | ✅ | Get 5 AI task suggestions |
| POST | `/api/ai/summarize` | ✅ | Summarize tasks with AI |
| POST | `/api/ai/generate-description` | ✅ | Generate task description |

---

## 📁 Project Structure

```
project-track-3/
├── PRD.md              # Product Requirements Document
├── HLD.md              # High-Level Design
├── LLD.md              # Low-Level Design
├── README.md           # This file
├── docker-compose.yml  # Full stack local setup
├── .gitignore
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── config/           # DB connections
│   │   ├── middleware/        # Auth, rate limit, error handler
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routers
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # OpenAI service
│   │   └── tests/            # Jest tests
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/            # Login, Register, Dashboard, Tasks, Projects
    │   ├── components/       # Navbar, TaskCard, AIAssistant, ProtectedRoute
    │   ├── hooks/            # useAuth, useTasks
    │   ├── context/          # AuthContext
    │   └── services/         # Axios API client
    └── index.html
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow the existing code style (ESLint is configured).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
