# Phased Build Plan — Student, Group & Assignment Management System

This file breaks the project into sequential phases with Bun & TypeScript.

---

## Phase 0 — Initial State `[COMPLETED ✅]`

```
student-group-assignment-system/
└── plan.md
```

---

## Phase 1 — Repo Scaffolding + Database Schema `[COMPLETED ✅]`

**Status:** Completed and verified against PostgreSQL 16 in Docker.
- Initialized git repository on branch `main`.
- Created backend and frontend folder structure.
- Added `.gitignore` ignoring `.env`, `node_modules`, `plan.md`, `phases.md`, and build artifacts.
- Created `backend/migrations/001_init.sql` containing all 6 tables with proper constraints.
- Created `docker-compose.yml` for PostgreSQL 16.

---

## Phase 2 — Backend: Auth (Register/Login/JWT) `[COMPLETED ✅]`

**Status:** Completed and verified in TypeScript + Bun.
- Dependencies installed via `bun install`.
- `backend/src/config/db.ts` — PostgreSQL connection pool.
- `backend/src/server.ts` — Express app listening on port 5001.
- `backend/src/controllers/authController.ts` — `register`, `login`, `me` handlers with `bcrypt` & `jsonwebtoken`.
- `backend/src/middleware/auth.ts` — JWT Bearer authentication.
- `backend/src/middleware/roles.ts` — `requireRole` RBAC middleware.
- `backend/src/routes/authRoutes.ts` mounted at `/api/auth`.

---

## Phase 3 — Backend: Groups `[COMPLETED ✅]`

**Status:** Completed and verified in TypeScript + Bun.
- `backend/src/controllers/groupController.ts`:
  - `createGroup` — student creates group, auto-added as member.
  - `addMember` — student adds member by email, duplicate prevention.
  - `getMyGroups` — returns groups the student belongs to with members.
  - `getGroupById` — group detail with members and computed progress ratio.
  - `getAllGroups` — admin overview of all groups.
- `backend/src/routes/groupRoutes.ts` mounted at `/api/groups`.

---

## Phase 4 — Backend: Assignments `[COMPLETED ✅]`

**Status:** Completed and verified in TypeScript + Bun.
- `backend/src/controllers/assignmentController.ts`:
  - `createAssignment` — admin creates assignments (`all` or `group` targeted).
  - `updateAssignment` — admin creator updates assignment details.
  - `listAssignments` — role-aware listing (students only see applicable assignments).
  - `getAssignmentById` — detail view with targeted groups.
- URL and date format validation included.
- `backend/src/routes/assignmentRoutes.ts` mounted at `/api/assignments`.

---

## Phase 5 — Backend: Submissions (Two-Step Confirmation) `[COMPLETED ✅]`

**Status:** Completed and verified in TypeScript + Bun.
- `backend/src/controllers/submissionController.ts`:
  - `stepOne` — `POST /api/submissions/:assignmentId/step1` sets status to `pending_confirmation`.
  - `stepTwo` — `POST /api/submissions/:assignmentId/step2` validates step 1 and sets status to `confirmed`.
  - `getStatusForAssignment` — `GET /api/submissions/assignment/:id` admin tracking across all groups.
  - `getStatusForGroup` — `GET /api/submissions/group/:id` group submission progress.
- `backend/src/routes/submissionRoutes.ts` mounted at `/api/submissions`.

---

## Phase 6 — Backend: Analytics `[COMPLETED ✅]`

**Status:** Completed and verified in TypeScript + Bun.
- `backend/src/controllers/analyticsController.ts`:
  - `overview` — `GET /api/analytics/overview` returns `totalAssignments`, `totalGroups`, `totalStudents`, `overallCompletionRate`, `perAssignment`, and `perGroup` using efficient SQL aggregates.
- Protected by `requireRole('admin')`.
- `backend/src/routes/analyticsRoutes.ts` mounted at `/api/analytics`.

---

## Phase 7 — Frontend: Setup + Auth Pages `[DONE ✅]`

**Completed:**
- React + TypeScript + Vite configured with Bun.
- Tailwind CSS v4 `@theme` with Stitch *Academic Precision* design system tokens (Inter font, indigo primary palette, container surfaces, border radii).
- API Client in `frontend/src/api/client.ts` with `/api` base URL, JWT Bearer interceptor, and 401 redirect handler.
- Typed `AuthContext` with `login`, `register`, `logout`, session hydration via `GET /api/auth/me`.
- Role-based route guard in `frontend/src/components/ProtectedRoute.tsx`.
- Academic Precision styled `Login.tsx` and student-only `Register.tsx`.
- System Admin Security Hardening: Public registration locked to `student` role only; dedicated System Admin account seeded securely from environment variables (`backend/.env` + `seedAdmin.ts`).
- Routing in `App.tsx` and `main.tsx` for `/login`, `/register`, `/student/dashboard`, `/admin/dashboard`.

---

## Phase 8 — Frontend: Student Flow `[COMPLETED ✅]`

**Status:** Completed and verified — 0 TypeScript errors, clean production build.
- `StudentDashboard.tsx` — Live stats (active groups, pending assignments, completed count, progress %), active group summary card with member avatars, recent assignment feed with deadline badges.
- `pages/student/GroupManagement.tsx` — Lists all student groups with expandable member rosters, "Create Group" modal (`POST /api/groups`), "Add Member" modal (`POST /api/groups/:id/members`).
- `pages/student/AssignmentList.tsx` — Full assignment list with Upcoming / Due Soon / Overdue deadline badges, submission progress bars, status chips, filter tabs, and OneDrive quick-link button.
- `pages/student/AssignmentDetail.tsx` — Full detail view with due date, description, OneDrive open button, group submission status tracker, and submission modal trigger.
- `components/student/SubmissionModal.tsx` — Two-step animated modal: Step 1 (OneDrive upload checkbox confirmation), Step 2 (3-item final checklist), completion state with ✓ indicator. Wired to `POST /api/submissions/:id/step1` and `step2`.
- `components/Sidebar.tsx` — Shared sticky sidebar with role-aware nav (student/admin), active-link highlighting, user avatar, and sign-out button.
- `App.tsx` — Extended with routes `/student/groups`, `/student/assignments`, `/student/assignments/:id`.

---

## Phase 9 — Frontend: Admin Flow `[COMPLETED ✅]`

**Status:** Completed and verified — 0 TypeScript errors, clean production build.
- `AdminDashboard.tsx` — Live analytics from `GET /api/analytics/overview`: stat cards (Total Students, Groups, Assignments, Completion Rate %), per-assignment completion bars, per-group completion bars, quick-nav cards.
- `pages/admin/ManageAssignments.tsx` — Assignment table with create/edit modal; supports title, description, due date, OneDrive link, `all`/`group` targeting, and multi-select group checkboxes. Wired to `POST /api/assignments` and `PUT /api/assignments/:id`.
- `pages/admin/SubmissionTracker.tsx` — Assignment selector dropdown, live group×assignment status table, status chips (Not Started / Step 1 Done / Confirmed), filter tabs, timestamp and confirmed-by display. Wired to `GET /api/submissions/assignment/:id`.
- `pages/admin/AdminGroups.tsx` — Group directory from `GET /api/groups/all` with expandable rows loading `GET /api/groups/:id` for member list + progress bar.
- `App.tsx` — Extended with routes `/admin/assignments`, `/admin/submissions`, `/admin/groups`.

---

## Phase 10 — Dockerize Everything `[COMPLETED ✅]`

**Status:** Completed and verified — Multi-stage Bun & Nginx Dockerfiles, `docker-compose.yml` with healthchecks, mobile responsiveness (hamburger sidebar drawer), Framer Motion smooth animations, and `useRef` form conversions.
- `backend/Dockerfile` — Multi-stage Bun alpine container running on port 5001 with automated healthcheck.
- `backend/.dockerignore` — Excludes `node_modules`, `.env`, and git history.
- `frontend/Dockerfile` — Multi-stage build (Bun static build -> lightweight `nginx:alpine` runner on port 80).
- `frontend/nginx.conf` — SPA routing fallback, gzip compression, security headers, reverse proxy `/api/` -> `backend:5001`.
- `frontend/.dockerignore` — Excludes `node_modules`, `dist`, and git history.
- `docker-compose.yml` — Automated single-command startup for `sgas_postgres`, `sgas_backend`, and `sgas_frontend` with healthy dependency orchestration.
- **Responsiveness & Motion**: Mobile sidebar drawer with slide animation, Framer Motion page entrance, `AnimatePresence` on modals & accordions, and `useRef`-based form inputs.

---

## Phase 11 — README + ER Diagram + Documentation `[COMPLETED ✅]`

**Status:** Completed and verified — Comprehensive, visually appealing root `README.md` containing:
- Aesthetic badges, quick-links, and feature breakdown tables.
- System Architecture diagram and Entity-Relationship (ER) diagram in Mermaid syntax.
- Full Docker Compose and local Bun quickstart setup instructions.
- Default system credentials table.
- Exhaustive REST API reference table with auth requirements.
- Key architectural & performance decisions (`useRef` form state, Nginx proxy, multi-stage Alpine Docker).
- Complete project directory structure tree.

---

## Phase 12 — (Optional) Deployment `[PENDING]`

**Goal:** Live deployment on free tier cloud providers (e.g. Render / Railway / Neon / Vercel).

---

## Phase 13 — Demo Video & Submission Packaging `[PENDING]`

**Goal:** Record 5-8 min end-to-end walk-through video covering student and admin flows, generate PDF submission document.

---

## Summary Table

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Project Baseline | ✅ Complete |
| 1 | Repo Scaffolding + DB Schema | ✅ Complete |
| 2 | Backend Auth (JWT, Roles, TypeScript) | ✅ Complete |
| 3 | Backend Groups API (TypeScript) | ✅ Complete |
| 4 | Backend Assignments API (TypeScript) | ✅ Complete |
| 5 | Backend Submissions (Two-Step, TypeScript) | ✅ Complete |
| 6 | Backend Analytics Overview (TypeScript) | ✅ Complete |
| 7 | Frontend Setup + Auth Pages (React, TS, Tailwind) | ✅ Complete |
| 8 | Frontend Student Flow | ✅ Complete |
| 9 | Frontend Admin Flow | ✅ Complete |
| 10 | Dockerize Full Stack (Docker Compose) | ✅ Complete |
| 11 | README + Architecture + ER Diagram | ✅ Complete |
| 12 | (Optional) Deployment | ⏳ Pending |
| 13 | Demo Video + Final Submission PDF | ⏳ Pending |