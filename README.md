<div align="center">

# 🎓 GroupSync
### *Next-Generation Academic Student, Group & Assignment Management System*

[![Bun](https://img.shields.io/badge/Runtime-Bun%20v1.2+-fbf0df?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Backend-Express%204-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Live Demo](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://student-group-assignment-system.vercel.app)

<p align="center">
  <b>Course-Centric Hierarchy</b> • <b>Group Leader Acknowledgment</b> • <b>Reversible Submissions</b> • <b>Per-Course Analytics</b> • <b>In-App & Cloud Sync</b>
</p>

[🌐 Live Deployment](https://student-group-assignment-system.vercel.app) • [✨ Round 2 Features](#-round-2-enhancements) • [🏛 Architecture](#-system-architecture) • [🗄 Database Schema](#-entity-relationship-er-diagram) • [🚀 Quick Start](#-quick-start-guide) • [📡 API Reference](#-rest-api-reference)

---

</div>

## 🌟 Overview

**GroupSync** is a modern, full-stack academic platform engineered to eliminate group project chaos in universities and educational institutions.

It allows students to organize into collaborative teams, enroll in courses, upload project deliverables, and execute role-verified two-step submissions. Professors and administrators gain deep per-course analytics, automated assignment distribution, and grading/review workflows with live feedback loops.



## ✨ Feature Breakdown

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🧑‍🎓 Student Portal</h3>
      <ul>
        <li>📚 <b>Course Catalog & Enrolled Grid</b>: Browse available courses, self-enroll with 1-click, and filter assignments by course.</li>
        <li>👥 <b>Team Management & Roster</b>: Create groups, designate leaders, invite classmates by email, and inspect member roles.</li>
        <li>📤 <b>Role-Verified Two-Step Submissions</b>:
          <ul>
            <li><b>Step 1 (Any Member)</b>: Attach files (PDF, DOCX, images) or cloud links & confirm upload.</li>
            <li><b>Step 2 (Leader Only)</b>: Review team checklist and execute final confirmation with celebration confetti.</li>
            <li><b>Retract / Unsubmit</b>: Leaders can retract submissions anytime prior to grading for last-minute revisions.</li>
          </ul>
        </li>
        <li>⚡ <b>Feedback & Revisions</b>: View instructor grade status (Accepted/Rejected) and read contextual feedback.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Professor & Admin Suite</h3>
      <ul>
        <li>📊 <b>Per-Course Analytics Dashboard</b>: Real-time student count, active groups, completion rates, and submission breakdowns.</li>
        <li>📖 <b>Course & Curriculum Management</b>: Create academic courses, manage student enrollments, and assign course materials.</li>
        <li>📝 <b>Assignment Lifecycle</b>:
          <ul>
            <li>Create course-bound assignments (Broadcast to all or targeted to select teams).</li>
            <li>Schedule deadlines and attach OneDrive/Drive resource URLs.</li>
          </ul>
        </li>
        <li>🔍 <b>Submission Tracker & Grading</b>: Review submitted files, mark submissions as <b>Accepted</b> or <b>Rejected</b>, and leave revision feedback.</li>
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
        FramerMotion["Framer Motion Transitions + Confetti"]
        TailwindCSS["Tailwind CSS v4 + Design Tokens"]
    end

    subgraph EdgeLayer [" ⚡ Deployment / Proxy Layer "]
        Vercel["Vercel SPA Hosting (Frontend)"]
        Nginx["Nginx Reverse Proxy (Docker Local)"]
    end

    subgraph AppLayer [" ⚙️ Backend Layer (Node.js / Bun Runtime) "]
        Express["Express 4 REST API (Port 5001)"]
        AuthMid["JWT Auth Middleware & RBAC (Student / Admin)"]
        Multer["Multer File Upload Engine"]
        LeaderAuth["Group Leader Verification Controller"]
    end

    subgraph DataLayer [" 🗄 Database Layer "]
        Postgres[("PostgreSQL 16 Engine\n(Local / Neon / Supabase)")]
        Pool["pg Connection Pool with Additive Migrations"]
    end

    Client --> Vercel
    Client --> Nginx
    Vercel -->|/api/* Requests| Express
    Nginx -->|/api/* Proxy| Express
    Express --> AuthMid
    AuthMid --> LeaderAuth
    Express --> Multer
    LeaderAuth --> Pool
    Pool --> Postgres
```

---

## 🗄 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ GROUP_MEMBERS : "joins"
    USERS ||--o{ GROUPS : "leads (leader_id) / creates"
    USERS ||--o{ COURSES : "teaches (professor_id)"
    USERS ||--o{ COURSE_ENROLLMENTS : "enrolls"
    USERS ||--o{ ASSIGNMENTS : "creates (admin)"
    USERS ||--o{ SUBMISSIONS : "confirms / reviews"

    COURSES ||--o{ COURSE_ENROLLMENTS : "has students"
    COURSES ||--o{ ASSIGNMENTS : "contains"

    GROUPS ||--o{ GROUP_MEMBERS : "contains"
    GROUPS ||--o{ ASSIGNMENT_GROUPS : "assigned to"
    GROUPS ||--o{ SUBMISSIONS : "submits"

    ASSIGNMENTS ||--o{ ASSIGNMENT_GROUPS : "targets"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "receives"

    USERS {
        serial id PK "Primary Key"
        varchar name "Full Name"
        varchar email UK "Unique Email"
        varchar password_hash "Bcrypt Hash"
        varchar role "student | admin"
        timestamp created_at "Created Timestamp"
    }

    COURSES {
        serial id PK "Primary Key"
        varchar title "Course Title"
        text description "Course Details"
        integer professor_id FK "Users Ref"
        timestamp created_at "Created Timestamp"
    }

    COURSE_ENROLLMENTS {
        serial id PK "Primary Key"
        integer course_id FK "Courses Ref"
        integer student_id FK "Users Ref"
        timestamp enrolled_at "Enrollment Timestamp"
    }

    GROUPS {
        serial id PK "Primary Key"
        varchar name "Team Name"
        integer leader_id FK "Group Leader User ID"
        integer created_by FK "Creator User ID"
        timestamp created_at "Created Timestamp"
    }

    GROUP_MEMBERS {
        serial id PK "Primary Key"
        integer group_id FK "Group Ref"
        integer user_id FK "User Ref"
        timestamp joined_at "Joined Timestamp"
    }

    ASSIGNMENTS {
        serial id PK "Primary Key"
        integer course_id FK "Courses Ref (Nullable)"
        varchar title "Assignment Title"
        text description "Details / Requirements"
        timestamp due_date "Deadline"
        varchar onedrive_link "Resource URL"
        varchar assigned_to_type "all | group"
        integer created_by FK "Admin User ID"
        timestamp created_at "Created Timestamp"
    }

    ASSIGNMENT_GROUPS {
        serial id PK "Primary Key"
        integer assignment_id FK "Assignment Ref"
        integer group_id FK "Group Ref"
    }

    SUBMISSIONS {
        serial id PK "Primary Key"
        integer assignment_id FK "Assignment Ref"
        integer group_id FK "Group Ref"
        varchar status "pending | pending_confirmation | confirmed"
        text file_url "Uploaded File URL / Path"
        varchar review_status "pending | accepted | rejected"
        text review_feedback "Professor Notes"
        integer confirmed_by FK "Leader User ID"
        timestamp confirmed_at "Confirmation Timestamp"
        integer reviewed_by FK "Professor User ID"
        timestamp reviewed_at "Review Timestamp"
    }
```

---

## 🛠 Tech Stack & Tooling

| Domain | Technology | Description |
|---|---|---|
| **Runtime & Toolchain** | ![Bun](https://img.shields.io/badge/Bun-1.2+-black?logo=bun) / Node.js | Fast JavaScript/TypeScript execution runtime |
| **Frontend Framework** | ![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react) + Vite | Declarative, component-driven SPA interface |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript) | Full-stack strict type safety |
| **Styling & Design** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss) | Utility CSS with custom academic design tokens |
| **Animations** | ![Framer](https://img.shields.io/badge/Framer_Motion-13.1-0055FF?logo=framer) + GSAP | Smooth layout transitions, toasts, and confetti effects |
| **Backend API** | ![Express](https://img.shields.io/badge/Express-4.22-black?logo=express) | RESTful API server with route modularization |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql) | Relational database with indexes & aggregate queries |
| **Security & Auth** | ![JWT](https://img.shields.io/badge/JWT-Bearer_Auth-black?logo=jsonwebtokens) | Role-based token authentication & BCrypt password hashing |
| **Containerization** | ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker) | Multi-container setup for local development |

---

## 🚀 Quick Start Guide

### 📦 Option 1: Docker Compose (Single Command)

Run the entire platform locally with zero prerequisites other than Docker:

```bash
# 1. Clone the repository
git clone https://github.com/Rishu7011/student-group-assignment-system.git
cd student-group-assignment-system

# 2. Build and launch all containers
docker-compose up --build -d
```

🎉 **Access Points:**
- 🌐 **Web App**: [http://localhost:5173](http://localhost:5173) (or [http://localhost](http://localhost))
- 🔌 **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
- 🗄 **PostgreSQL**: `localhost:5432` (`sgas_db` / `sgas_user` / `sgas_pass`)

---

### 💻 Option 2: Local Development Setup

#### 1. Database Setup
Ensure PostgreSQL is running, then apply migrations:
```bash
psql -U postgres -c "CREATE DATABASE sgas_db;"
psql -U postgres -d sgas_db -f backend/migrations/001_init.sql
psql -U postgres -d sgas_db -f backend/migrations/002_round2.sql
```

#### 2. Seed Realistic Demo Data (Recommended)
Populate the database with 12 demo students, 3 courses, 4 active groups with designated leaders, assignments, and sample submissions:
```bash
cd backend
bun run seed:demo
# or with npm: npx ts-node src/scripts/seedDemo.ts
```

#### 3. Start Backend
```bash
cd backend
bun install
bun run dev
```
*Backend runs on `http://localhost:5001` with automated admin seeding.*

#### 4. Start Frontend
```bash
cd ../frontend
bun install
bun run dev
```
*Frontend runs on `http://localhost:5173` with instant Vite HMR.*

---

## 🔐 Default Demo Accounts

All demo accounts created by `seed:demo` share the unified password: **`Demo@1234`**

| Role | Name | Email | Password | Scope / Group |
|---|---|---|---|---|
| 👑 **System Admin** | System Administrator | `sysadmin@groupsync.internal` | `Adm!n@GrpSync#2024` | Global platform administration & analytics |
| 🧑‍🏫 **Professor** | Prof. Alan Turing | `prof.turing@university.edu` | `Demo@1234` | CS301, CS402, CS204 Course Management |
| 👑 **Student (Leader)** | Alex Rivera | `alex.rivera@university.edu` | `Demo@1234` | Leader of **Group Alpha** (CS301 & CS402) |
| 🧑‍🎓 **Student (Member)** | Sam Taylor | `sam.taylor@university.edu` | `Demo@1234` | Member of **Group Alpha** |
| 👑 **Student (Leader)** | Maya Lin | `maya.lin@university.edu` | `Demo@1234` | Leader of **Group Beta** |
| 🧑‍🎓 **Student (Solo)** | Liam Vance | `liam.vance@university.edu` | `Demo@1234` | Unassigned / Independent Student |

---

## 📡 REST API Reference

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student profile | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain Bearer JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user session profile | Bearer JWT |

### 📚 Course Operations (`/api/courses`)
| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `GET` | `/api/courses/mine` | List courses the user is enrolled in (or teaches) | Authenticated |
| `GET` | `/api/courses/all` | List all available academic courses | Authenticated |
| `GET` | `/api/courses/:id` | Get course details, assignments & enrolled students | Authenticated |
| `POST` | `/api/courses` | Create a new course | Admin / Professor |
| `POST` | `/api/courses/:id/enroll` | Self-enroll into a course | Student |
| `GET` | `/api/courses/:id/analytics` | Real-time completion rates & submission breakdowns | Admin / Professor |

### 👥 Group Operations (`/api/groups`)
| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `GET` | `/api/groups/mine` | List user's active groups with leader indicators | Student |
| `GET` | `/api/groups/all` | List all groups with roster counts | Admin |
| `GET` | `/api/groups/:id` | Fetch group roster, leader metadata, and members | Authenticated |
| `POST` | `/api/groups` | Create team (creator is set as default leader) | Student |
| `POST` | `/api/groups/:id/members` | Invite teammate by email address | Team Member |
| `DELETE` | `/api/groups/:groupId/members/:userId` | Remove member from group | Group Leader / Creator |
| `DELETE` | `/api/groups/:id` | Delete entire student group | Group Leader / Creator |

### 📝 Assignment Management (`/api/assignments`)
| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `GET` | `/api/assignments` | List assignments (filtered by course / group) | Authenticated |
| `GET` | `/api/assignments/:id` | Fetch assignment specs, cloud links & deadlines | Authenticated |
| `POST` | `/api/assignments` | Create course assignment (Broadcast / Targeted) | Admin |
| `PUT` | `/api/assignments/:id` | Update assignment metadata & group targeting | Admin |
| `DELETE` | `/api/assignments/:id` | Delete assignment & cascade submission records | Admin |

### 📤 Submissions Flow (`/api/submissions`)
| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `GET` | `/api/submissions/group/:id` | Retrieve assignment submission status for a group | Group Member / Admin |
| `GET` | `/api/submissions/assignment/:id` | Matrix view of all group submissions for an assignment | Admin |
| `POST` | `/api/submissions/:assignmentId/step1` | Step 1: Upload file / attach link & verify readiness | Team Member |
| `POST` | `/api/submissions/:assignmentId/step2` | Step 2: Final submission confirmation | **Group Leader Only** |
| `POST` | `/api/submissions/:assignmentId/unsubmit` | Retract submission to draft state for revision | **Group Leader Only** |
| `PATCH` | `/api/submissions/:assignmentId/groups/:groupId/review` | Grade submission (`accepted`/`rejected`) & leave feedback | Admin / Professor |

### 📁 File Uploads (`/api/upload`)
| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `POST` | `/api/upload` | Upload assignment deliverable (PDF, DOCX, PNG, etc.) | Authenticated |

---

## 📂 Project Directory Structure

```text
student-group-assignment-system/
├── backend/
│   ├── Dockerfile                  # Multi-stage Bun/Node container image
│   ├── migrations/
│   │   ├── 001_init.sql            # Base schema (users, groups, assignments)
│   │   └── 002_round2.sql          # Round 2 migration (courses, enrollments, leader_id)
│   ├── src/
│   │   ├── config/db.ts            # pg connection pool & auto-migrations
│   │   ├── controllers/            # Auth, Courses, Groups, Assignments, Submissions, Analytics
│   │   ├── middleware/             # JWT verification & RBAC authorization
│   │   ├── routes/                 # Modular Express route definitions
│   │   ├── scripts/
│   │   │   ├── seedAdmin.ts        # Bootstrap system administrator
│   │   │   └── seedDemo.ts         # Comprehensive 12-student demo dataset
│   │   └── server.ts               # Server bootstrap & upload static serving
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── Dockerfile                  # Production Vite build -> Nginx runner
│   ├── nginx.conf                  # Single Page Application router & proxy
│   ├── public/
│   │   └── favicon.svg             # Custom GroupSync academic graduation emblem
│   ├── src/
│   │   ├── api/client.ts           # Axios instance with JWT interceptors
│   │   ├── components/             # Sidebar, Modals, Steppers, Protection Guards
│   │   ├── context/AuthContext.tsx # User session & role state provider
│   │   ├── pages/                  # CoursePage, StudentDashboard, AdminDashboard, Auth
│   │   ├── index.css               # Material tokens, Tailwind v4 & smooth keyframes
│   │   └── App.tsx                 # Declarative application routing
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml              # Multi-container orchestration specification
└── README.md                       # Comprehensive documentation & architecture guide
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ for academic collaboration using Bun, React 19, TypeScript, PostgreSQL, and Docker.</sub>
</div>
