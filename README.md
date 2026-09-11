<div align="center">

# 🎓 GroupSync
### *Next-Generation Academic Student, Group & Assignment Management System*

[![Bun](https://img.shields.io/badge/Runtime-Bun%20v1.2+-fbf0df?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%206-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Backend-Express%204-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Live Demo](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://student-group-assignment-system.vercel.app)

<p align="center">
  <b>Course-Centric Hierarchy</b> • <b>Group Leader Acknowledgment</b> • <b>Reversible Submissions</b> • <b>Per-Course Analytics</b> • <b>Cloud File Uploads</b>
</p>

[🌐 Live Demo](https://student-group-assignment-system.vercel.app) • [✨ Features](#-feature-breakdown) • [🏛 Architecture](#-system-architecture) • [🗄 Database Schema](#-entity-relationship-er-diagram) • [🚀 Quick Start](#-quick-start-guide) • [📡 API Reference](#-rest-api-reference)

---

</div>

## 🌟 Overview

**GroupSync** is a modern, full-stack academic platform engineered to eliminate group project chaos in universities and educational institutions.

Students organize into collaborative teams, enroll in courses, upload project deliverables, and execute role-verified two-step submissions. Professors and administrators gain per-course analytics, automated assignment distribution, and grading/review workflows with live feedback loops.

---

## ✨ Feature Breakdown

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🧑‍🎓 Student Portal</h3>
      <ul>
        <li>📚 <b>Course Catalog & Enrolled Grid</b>: Browse available courses, self-enroll with one click, and filter assignments by course.</li>
        <li>👥 <b>Team Management & Roster</b>: Create groups, designate a leader, invite classmates by email, and inspect member roles.</li>
        <li>📤 <b>Role-Verified Two-Step Submissions</b>:
          <ul>
            <li><b>Step 1 (Any Member)</b>: Attach files (PDF, DOCX, images, up to 15 MB) or cloud links and confirm upload.</li>
            <li><b>Step 2 (Leader Only)</b>: Review team checklist and execute final confirmation with celebration confetti.</li>
            <li><b>Retract / Unsubmit</b>: Leaders can retract submissions before grading for last-minute revisions.</li>
          </ul>
        </li>
        <li>⚡ <b>Feedback & Revisions</b>: View instructor grade status (Accepted / Rejected) and contextual feedback inline.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Professor & Admin Suite</h3>
      <ul>
        <li>📊 <b>Per-Course Analytics Dashboard</b>: Real-time student count, active groups, completion rates, and submission breakdowns.</li>
        <li>📖 <b>Course & Curriculum Management</b>: Create academic courses, enroll students manually or let them self-enroll.</li>
        <li>📝 <b>Assignment Lifecycle</b>:
          <ul>
            <li>Create course-bound assignments (broadcast to all or targeted to select groups).</li>
            <li>Schedule deadlines and attach OneDrive / Drive resource URLs.</li>
          </ul>
        </li>
        <li>🔍 <b>Submission Tracker & Grading</b>: Review submitted files, mark as <b>Accepted</b> or <b>Rejected</b>, and leave revision notes.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏛 System Architecture

```mermaid
graph TB
    subgraph ClientLayer [" 💻 Presentation Layer "]
        Client["Browser Client (React 19 + TypeScript)"]
        FramerMotion["Framer Motion + GSAP Animations + Confetti"]
        TailwindCSS["Tailwind CSS v4 + Radix UI Primitives"]
    end

    subgraph EdgeLayer [" ⚡ Deployment / Proxy Layer "]
        Vercel["Vercel SPA Hosting (Frontend)"]
        Nginx["Nginx Reverse Proxy (Docker Local)"]
        Vite["Vite Dev Proxy to :5001 (Local Dev)"]
    end

    subgraph AppLayer [" ⚙️ Backend Layer (Bun Runtime) "]
        Express["Express 4 REST API (Port 5001)"]
        AuthMid["JWT Auth Middleware · RBAC (Student / Admin)"]
        Multer["Multer File Upload Engine (15 MB limit)"]
        SeedAdmin["Startup: seedSystemAdmin (idempotent)"]
    end

    subgraph DataLayer [" 🗄 Database Layer "]
        Supabase[("Supabase PostgreSQL — Connection Pooler Port 6543")]
        Pool["pg Connection Pool · SSL Enabled"]
    end

    Client --> Vercel
    Client --> Vite
    Client --> Nginx
    Vercel -->|/api/* Requests| Express
    Vite -->|/api/* Proxy| Express
    Nginx -->|/api/* Proxy| Express
    Express --> AuthMid
    AuthMid --> Multer
    AuthMid --> Pool
    SeedAdmin --> Pool
    Pool --> Supabase
```

---

## 🗄 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ GROUP_MEMBERS : "joins"
    USERS ||--o{ GROUPS : "leads or creates"
    USERS ||--o{ COURSES : "teaches"
    USERS ||--o{ COURSE_ENROLLMENTS : "enrolls"
    USERS ||--o{ ASSIGNMENTS : "creates"
    USERS ||--o{ SUBMISSIONS : "confirms or reviews"

    COURSES ||--o{ COURSE_ENROLLMENTS : "has students"
    COURSES ||--o{ ASSIGNMENTS : "contains"

    GROUPS ||--o{ GROUP_MEMBERS : "contains"
    GROUPS ||--o{ ASSIGNMENT_GROUPS : "assigned to"
    GROUPS ||--o{ SUBMISSIONS : "submits"

    ASSIGNMENTS ||--o{ ASSIGNMENT_GROUPS : "targets"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "receives"

    USERS {
        serial id PK
        varchar name
        varchar email UK
        text password_hash
        varchar role
        timestamptz created_at
    }

    COURSES {
        serial id PK
        varchar title
        text description
        integer professor_id FK
        timestamptz created_at
    }

    COURSE_ENROLLMENTS {
        serial id PK
        integer course_id FK
        integer student_id FK
        timestamptz enrolled_at
    }

    GROUPS {
        serial id PK
        varchar name
        integer leader_id FK
        integer created_by FK
        timestamptz created_at
    }

    GROUP_MEMBERS {
        serial id PK
        integer group_id FK
        integer user_id FK
        timestamptz joined_at
    }

    ASSIGNMENTS {
        serial id PK
        integer course_id FK
        varchar title
        text description
        date due_date
        text onedrive_link
        varchar assigned_to_type
        integer created_by FK
        timestamptz created_at
    }

    ASSIGNMENT_GROUPS {
        serial id PK
        integer assignment_id FK
        integer group_id FK
    }

    SUBMISSIONS {
        serial id PK
        integer assignment_id FK
        integer group_id FK
        varchar status
        text file_url
        varchar review_status
        text review_feedback
        integer confirmed_by FK
        timestamptz confirmed_at
        integer reviewed_by FK
        timestamptz reviewed_at
        timestamptz created_at
    }
```

---

## 🛠 Tech Stack & Tooling

| Domain | Technology | Version |
|---|---|---|
| **Runtime** | [Bun](https://bun.sh) | 1.2+ |
| **Frontend Framework** | [React](https://react.dev) + [Vite](https://vite.dev) | 19.x / 8.x |
| **Language** | [TypeScript](https://www.typescriptlang.org) | 6.x (frontend) / 5.x (backend) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) v4 | 4.x |
| **Animations** | [Framer Motion](https://www.framer.com/motion) + [GSAP](https://gsap.com) | 13.x / 3.x |
| **UI Primitives** | [Radix UI](https://www.radix-ui.com) (Dialog, Select) | 1.x / 2.x |
| **Routing** | [React Router DOM](https://reactrouter.com) | 7.x |
| **HTTP Client** | [Axios](https://axios-http.com) | 1.x |
| **Icons** | [Lucide React](https://lucide.dev) | 1.x |
| **Celebrations** | canvas-confetti | 1.x |
| **Backend API** | [Express](https://expressjs.com) | 4.x |
| **Database Client** | [node-postgres (pg)](https://node-postgres.com) | 8.12+ |
| **Database Host** | [Supabase](https://supabase.com) PostgreSQL | 16 |
| **Auth** | JWT (jsonwebtoken) + bcrypt | 9.x / 5.x |
| **File Uploads** | [Multer](https://github.com/expressjs/multer) | 2.x — 15 MB limit |
| **Containerization** | Docker + Docker Compose | — |
| **Linting** | [oxlint](https://oxc.rs/docs/guide/usage/linter.html) | 1.x |

---

## 🚀 Quick Start Guide

### Option 1: Docker Compose (Self-hosted DB)

Runs the entire stack locally with a containerized PostgreSQL instance:

```bash
git clone https://github.com/Rishu7011/student-group-assignment-system.git
cd student-group-assignment-system
docker-compose up --build -d
```

| Service | URL |
|---|---|
| 🌐 Web App | http://localhost:5173 (or http://localhost) |
| 🔌 API Health | http://localhost:5001/api/health |
| 🗄 PostgreSQL | `localhost:5432` — db `sgas_db` / user `sgas_user` / pass `sgas_pass` |

---

### Option 2: Local Dev with Supabase (Recommended)

> **Important:** Supabase's direct connection host (`db.*.supabase.co:5432`) is **IPv6-only** and unreachable from most local networks. You **must** use the **Connection Pooler** URL (port `6543`) for local development.

#### 1. Get the Supabase Pooler Connection String

1. Open your [Supabase project dashboard](https://supabase.com/dashboard/projects)
2. Go to **Settings → Database → Connection string**
3. Select the **"Transaction"** tab (PgBouncer pooler — port 6543, IPv4 ✅)
4. Copy the URL:
   ```
   postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres
   ```

#### 2. Apply Migrations

Run both SQL files against your Supabase DB via the Supabase SQL Editor or `psql`:

```bash
psql "postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres" \
  -f backend/migrations/001_init.sql \
  -f backend/migrations/002_round2.sql
```

#### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Use the Supabase Connection POOLER URL (port 6543), NOT the direct URL.
# Special characters in passwords must be URL-encoded: @ -> %40  # -> %23  ! -> %21
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres

JWT_SECRET=your_long_random_secret_here
PORT=5001

# System Admin — seeded automatically on every server startup (idempotent)
SYSADMIN_NAME=System Administrator
SYSADMIN_EMAIL=admin@yourdomain.com
SYSADMIN_PASSWORD=YourSecureAdminPassword
```

#### 4. Seed Demo Data (Optional)

```bash
cd backend
bun run seed:demo
```

Populates: 12 demo students, 3 courses, 4 groups with leaders, assignments, and sample submissions.

#### 5. Start Backend

```bash
cd backend && bun install && bun run dev
# Server: http://localhost:5001
```

On every startup the server automatically applies any missing schema columns and upserts the system admin from `SYSADMIN_*` env vars.

#### 6. Start Frontend

```bash
cd frontend && bun install && bun run dev
# App: http://localhost:5173
```

The Vite dev server proxies all `/api/*` and `/uploads/*` requests to `http://localhost:5001`.

---

## 🔐 Default Accounts

### System Admin (auto-seeded from `.env`)

| Field | Value |
|---|---|
| Email | `SYSADMIN_EMAIL` value in `.env` |
| Password | `SYSADMIN_PASSWORD` value in `.env` |
| Fallback (if vars unset) | `sysadmin@groupsync.internal` / `Adm!n@GrpSync#2024` |

### Demo Dataset (after `bun run seed:demo`)

All demo student accounts use password: **`Demo@1234`**

| Role / Status | Name | Email | Group |
|---|---|---|---|
| 👑 Student Leader | Alice Johnson | `alice@groupsync.com` | Nova Squad (Leader) |
| 🧑‍🎓 Student Member | Bob Martinez | `bob@groupsync.com` | Nova Squad |
| 🧑‍🎓 Student Member | Carol Danvers | `carol@groupsync.com` | Nova Squad |
| 👑 Student Leader | David Miller | `david@groupsync.com` | ByteCoders (Leader) |
| 🧑‍🎓 Student Member | Emma Watson | `emma@groupsync.com` | ByteCoders |
| 🧑‍🎓 Student Member | Frank Castle | `frank@groupsync.com` | ByteCoders |
| 👑 Student Leader | Grace Hopper | `grace@groupsync.com` | Quantum Crew (Leader) |
| 🧑‍🎓 Student Member | Henry Cavill | `henry@groupsync.com` | Quantum Crew |
| 🧑‍🎓 Student Member | Isabella Clark | `isabella@groupsync.com` | Quantum Crew |
| 👑 Student Leader | Jack Ryan | `jack@groupsync.com` | CyberKnights (Leader) |
| 🧑‍🎓 Student Member | Katherine Johnson | `katherine@groupsync.com` | CyberKnights |
| 🧑‍🎓 Fresh Student | Leo Messi | `leo@groupsync.com` | *No group (solo / unassigned)* |

> [!NOTE]
> The admin account is synchronized automatically from `SYSADMIN_EMAIL` / `SYSADMIN_PASSWORD` (or `ADMIN_EMAIL` / `ADMIN_PASSWORD`) defined in your `backend/.env`. If unset, it defaults to `sysadmin@groupsync.internal` / `Adm!n@GrpSync#2024`.

---

## 📡 REST API Reference

All protected endpoints require: `Authorization: Bearer <token>`

### 🔑 Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student (role locked to `student`) | Public |
| `POST` | `/api/auth/login` | Authenticate and receive Bearer JWT | Public |
| `GET` | `/api/auth/me` | Fetch current user session profile | JWT |

### 📚 Courses — `/api/courses`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/courses/catalog` | All courses with enrollment status for current user | JWT |
| `GET` | `/api/courses/mine` | Courses the user teaches (admin) or is enrolled in (student) | JWT |
| `GET` | `/api/courses/:id` | Course detail, assignments, and enrolled students | JWT |
| `GET` | `/api/courses/:id/analytics` | Completion rates, group counts, submission breakdown | Admin |
| `POST` | `/api/courses` | Create a new course | Admin |
| `POST` | `/api/courses/:id/enroll` | Admin manually enrolls a student | Admin |
| `POST` | `/api/courses/:id/self-enroll` | Student self-enrolls | JWT |

### 👥 Groups — `/api/groups`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/groups/mine` | Current user's groups with leader indicators | Student |
| `GET` | `/api/groups/all` | All groups with member counts | Admin |
| `GET` | `/api/groups/:id` | Group roster and leader metadata | JWT |
| `POST` | `/api/groups` | Create team (creator becomes default leader) | Student |
| `POST` | `/api/groups/:id/members` | Invite teammate by email | Student |
| `DELETE` | `/api/groups/:id/members/:userId` | Remove member from group | Student |
| `DELETE` | `/api/groups/:id` | Delete entire group | Student |

### 📝 Assignments — `/api/assignments`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/assignments` | List assignments (role-filtered) | JWT |
| `GET` | `/api/assignments/:id` | Assignment specs, deadlines, resource links | JWT |
| `POST` | `/api/assignments` | Create assignment (broadcast or group-targeted) | Admin |
| `PUT` | `/api/assignments/:id` | Update metadata and targeting | Admin |
| `DELETE` | `/api/assignments/:id` | Delete and cascade submissions | Admin |

### 📤 Submissions — `/api/submissions`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/submissions/group/:id` | Submission status for a group | JWT |
| `GET` | `/api/submissions/assignment/:id` | All group submissions for an assignment | Admin |
| `POST` | `/api/submissions/:assignmentId/step1` | Upload file or attach link (any member) | Student |
| `POST` | `/api/submissions/:assignmentId/step2` | Final confirmation | **Leader only** |
| `POST` | `/api/submissions/:assignmentId/unsubmit` | Retract to draft | **Leader only** |
| `PATCH` | `/api/submissions/:assignmentId/groups/:groupId/review` | Grade and leave feedback | Admin |

### 📁 File Upload — `/api/upload`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/upload` | Upload file (PDF, DOCX, PNG, JPG — max 15 MB) | JWT |

Uploaded files are stored in `backend/uploads/` and served at `/uploads/<filename>`.

### 📊 Analytics — `/api/analytics`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/analytics/overview` | Platform-wide stats (users, groups, submissions, courses) | Admin |

### 🏥 Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ status: "ok", timestamp }` — no auth required |

---

## 📂 Project Structure

```text
student-group-assignment-system/
├── backend/
│   ├── .env.example                # Environment variable template
│   ├── Dockerfile                  # Multi-stage Bun container image
│   ├── migrations/
│   │   ├── 001_init.sql            # Base schema: users, groups, assignments, submissions
│   │   └── 002_round2.sql          # Additive: courses, enrollments, groups.leader_id
│   ├── src/
│   │   ├── config/db.ts            # pg Pool — SSL + Supabase pooler compatible
│   │   ├── controllers/
│   │   │   ├── authController.ts        # register / login / me
│   │   │   ├── courseController.ts      # CRUD + catalog + self-enroll
│   │   │   ├── groupController.ts       # Create / manage / roster
│   │   │   ├── assignmentController.ts  # CRUD + group targeting
│   │   │   ├── submissionController.ts  # Two-step + unsubmit + review
│   │   │   ├── analyticsController.ts   # Overview + per-course stats
│   │   │   └── uploadController.ts      # Multer single-file handler
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT Bearer verification → req.user
│   │   │   └── roles.ts            # requireRole(...roles) RBAC guard
│   │   ├── routes/                 # One file per resource domain
│   │   ├── scripts/
│   │   │   ├── seedAdmin.ts        # Auto-runs on startup: upsert system admin
│   │   │   └── seedDemo.ts         # Manual: 12-student full demo dataset
│   │   ├── types/express.d.ts      # Augments Express Request with req.user
│   │   └── server.ts               # App bootstrap, routes, IPv4 DNS fix
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── Dockerfile                  # Vite build → Nginx static server
│   ├── nginx.conf                  # SPA router + /api proxy
│   ├── vite.config.ts              # Dev proxy: /api, /uploads → :5001
│   ├── src/
│   │   ├── api/client.ts           # Axios: JWT interceptor + 401 auto-logout
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx       # Role-gated route wrapper
│   │   │   ├── Sidebar.tsx              # Navigation sidebar for both roles
│   │   │   ├── student/
│   │   │   │   └── SubmissionModal.tsx  # Two-step stepper + confetti
│   │   │   └── ui/
│   │   │       ├── field.tsx            # Form field wrapper
│   │   │       ├── select.tsx           # Radix UI select wrapper
│   │   │       └── sheet.tsx            # Slide-over panel
│   │   ├── context/AuthContext.tsx # User session: login / register / logout
│   │   ├── pages/
│   │   │   ├── Login.tsx, Register.tsx, NotFound.tsx
│   │   │   ├── CoursePage.tsx           # Course detail + assignments + analytics
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── admin/
│   │   │   │   ├── ManageAssignments.tsx
│   │   │   │   ├── SubmissionTracker.tsx
│   │   │   │   └── AdminGroups.tsx
│   │   │   └── student/
│   │   │       ├── GroupManagement.tsx
│   │   │       ├── AssignmentList.tsx
│   │   │       └── AssignmentDetail.tsx
│   │   ├── utils/animations.ts     # GSAP: staggerIn, scaleIn, progressBar
│   │   ├── App.tsx                 # Declarative routing (React Router v7)
│   │   ├── main.tsx
│   │   └── index.css               # Tailwind v4 + custom design tokens
│   └── package.json
├── docker-compose.yml              # Frontend + Backend + PostgreSQL containers
├── vercel.json                     # Vercel SPA + API rewrite rules
└── README.md
```

---

## 🔧 Troubleshooting

### `ECONNREFUSED` on IPv6 address (Supabase)

The direct Supabase host (`db.*.supabase.co:5432`) publishes an **IPv6-only DNS record**. Connecting from most local machines (especially macOS) will fail with:

```
error: connect ECONNREFUSED 2406:...:5432
```

**Fix:** Use the **Connection Pooler** URL from Supabase dashboard (**Settings → Database → "Transaction" tab**, port `6543`). This resolves to an IPv4 address and works everywhere.

---

### `Failed to start server. Is port 5001 in use?`

A stale backend process is holding the port. Kill it:

```bash
kill $(lsof -ti :5001)
```

---

### Password contains special characters (`@`, `#`, `!`, etc.)

URL-encode special characters in `DATABASE_URL`:

| Character | Encoded |
|---|---|
| `@` | `%40` |
| `#` | `%23` |
| `!` | `%21` |
| `$` | `%24` |
| `%` | `%25` |

Example: password `@Pass#1` → `%40Pass%231` in the URL.

---

### `.env` changes not taking effect

`bun --hot` does not re-execute the module graph on `.env` changes. Do a full restart:

```bash
# Ctrl+C the running process, then:
bun run dev
```

---

## 📄 License

This project is licensed under the **MIT License**.

<div align="center">
  <sub>Built with ❤️ for academic collaboration using Bun, React 19, TypeScript, PostgreSQL (Supabase), and Docker.</sub>
</div>
