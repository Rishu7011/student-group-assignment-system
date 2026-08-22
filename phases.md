# Phased Build Plan — Student, Group & Assignment Management System

This file breaks the project into sequential phases. Each phase has:
- **Current state** — what already exists before this phase starts
- **Goal** — what this phase delivers
- **Prompt** — a complete, self-contained instruction block you can hand to
  Claude (or follow yourself) to build that phase, without needing to repeat
  earlier context manually — just say "do Phase N" and paste the prompt.

Work through phases in order. Each one leaves the project in a runnable,
demo-able state.

---

## Phase 0 — Current State

```
student-group-assignment-system/
└── plan.md
```

Nothing else exists yet. No repo initialized, no code, no folders.

---

## Phase 1 — Repo Scaffolding + Database Schema

**Current state:** Only `plan.md` exists.

**Goal:** Git repo initialized, full folder structure created, PostgreSQL
schema written as a migration file, docker-compose set up to run Postgres
alone (so the schema can be tested before any backend code exists).

**Prompt:**
```
Set up the initial project scaffolding for the Student, Group & Assignment
Management System described in plan.md.

Do the following:
1. Initialize a git repository at the project root.
2. Create the folder structure:
   backend/src/{config,models,routes,controllers,middleware}
   backend/migrations
   frontend/src/{pages,components,context,api}
3. Add a root .gitignore (node_modules, .env, dist, build, .DS_Store).
4. Write backend/migrations/001_init.sql implementing this schema exactly:
   users, groups, group_members, assignments, assignment_groups, submissions
   (see plan.md section 3 for fields and relationships). Use proper foreign
   keys, NOT NULL constraints, UNIQUE constraints (e.g. users.email,
   group_members(group_id,user_id), submissions(assignment_id,group_id)),
   and sensible defaults (created_at timestamps, status default 'pending').
5. Create a docker-compose.yml with just a `postgres` service (image
   postgres:16, env vars for db name/user/password, a named volume for
   persistence, and a volume mount that runs the migration SQL on first
   boot via /docker-entrypoint-initdb.d).
6. Create backend/package.json and frontend/package.json with placeholder
   name/version/scripts (dependencies added in later phases).
7. Make an initial commit: "chore: project scaffolding and DB schema".

Do not write any application logic yet — this phase is structure and schema
only. Confirm the Postgres container boots and the schema applies cleanly.
```

---

## Phase 2 — Backend: Auth (Register/Login/JWT)

**Current state:** Folder structure + DB schema + Postgres container exist.
No backend code yet.

**Goal:** Express server boots, connects to Postgres, and exposes working
register/login/me endpoints with JWT-based auth and role support.

**Prompt:**
```
Build the authentication layer of the backend, using the schema already
defined in backend/migrations/001_init.sql (users table has role
'student'|'admin').

Do the following:
1. Add dependencies to backend/package.json: express, pg, bcrypt,
   jsonwebtoken, dotenv, cors, nodemon (dev).
2. backend/src/config/db.js — a pg Pool connected via env vars
   (DATABASE_URL or discrete host/user/pass/db/port).
3. backend/src/server.js — Express app, cors, json body parsing, mounts
   /api/auth routes, a health check at GET /api/health, listens on
   process.env.PORT || 5000.
4. backend/src/controllers/authController.js:
   - register(req,res): validate name/email/password/role, hash password
     with bcrypt, insert user, return JWT + user (no password hash).
   - login(req,res): verify email+password, return JWT + user.
   - me(req,res): return the authenticated user from req.user.
5. backend/src/middleware/auth.js — verifies JWT from Authorization:
   Bearer header, attaches decoded { id, role } to req.user, 401 on
   missing/invalid token.
6. backend/src/middleware/roles.js — requireRole(...roles) middleware that
   403s if req.user.role isn't in the allowed list.
7. backend/src/routes/authRoutes.js — POST /register, POST /login,
   GET /me (protected).
8. backend/.env.example with DATABASE_URL, JWT_SECRET, PORT.
9. Add backend/README-dev-notes.md (temporary, will merge into main README
   later) noting how to run: npm install && npm run dev, with Postgres
   already running via docker-compose.

Test manually: register a student, register an admin, login as each, hit
/api/auth/me with the token. Commit as "feat(backend): auth with JWT and
role support".
```

---

## Phase 3 — Backend: Groups

**Current state:** Auth working (register/login/JWT/roles). DB schema in
place. No group logic yet.

**Goal:** Students can create a group, add members by email, and fetch
their group with member list.

**Prompt:**
```
Build the Groups API on top of the existing auth system (JWT middleware
and requireRole are already in backend/src/middleware/).

Do the following:
1. backend/src/controllers/groupController.js:
   - createGroup(req,res): student-only. Creates a group with
     created_by = req.user.id, automatically adds the creator as a
     group_member.
   - addMember(req,res): student-only, must be a member of the group
     being modified. Accepts an email, looks up the user, inserts into
     group_members (handle "already a member" and "user not found"
     gracefully with clear error messages).
   - getMyGroups(req,res): returns all groups the logged-in student
     belongs to, with member list.
   - getGroupById(req,res): returns group detail + members + (later,
     once submissions exist) progress; for now just members.
2. backend/src/routes/groupRoutes.js, all protected by auth middleware:
   POST /api/groups
   POST /api/groups/:id/members
   GET  /api/groups/mine
   GET  /api/groups/:id
3. Mount groupRoutes in server.js under /api/groups.
4. Enforce authorization: only members of a group can view/modify it
   (check group_members before allowing addMember/getGroupById).

Test manually: student A creates a group, adds student B by email, GET
/mine shows the group for both A and B. Commit as "feat(backend): group
creation and membership management".
```

---

## Phase 4 — Backend: Assignments

**Current state:** Auth + Groups working.

**Goal:** Admins can create/edit assignments and assign them to all groups
or specific groups; students can list assignments relevant to them.

**Prompt:**
```
Build the Assignments API using the existing auth/role middleware and the
groups already implemented.

Do the following:
1. backend/src/controllers/assignmentController.js:
   - createAssignment(req,res): admin-only. Fields: title, description,
     due_date, onedrive_link, assigned_to_type ('all'|'group'). If
     assigned_to_type is 'group', accept an array of group_ids and insert
     rows into assignment_groups.
   - updateAssignment(req,res): admin-only, admin must be the creator.
   - listAssignments(req,res): role-aware —
       admin: all assignments they created.
       student: assignments where assigned_to_type='all' OR where one of
       the student's groups appears in assignment_groups.
   - getAssignmentById(req,res): detail view, same access rule as list.
2. backend/src/routes/assignmentRoutes.js:
   POST /api/assignments        (admin)
   PUT  /api/assignments/:id    (admin)
   GET  /api/assignments        (any authenticated user, filtered by role)
   GET  /api/assignments/:id
3. Mount in server.js under /api/assignments.
4. Validate due_date is a real date and onedrive_link looks like a URL
   (simple regex is fine, don't overengineer).

Test manually: admin creates an assignment assigned to "all", another
assigned to a specific group; confirm students see the right subset via
GET /api/assignments. Commit as "feat(backend): assignment CRUD with
group targeting".
```

---

## Phase 5 — Backend: Submissions (Two-Step Confirmation)

**Current state:** Auth + Groups + Assignments working.

**Goal:** Students confirm submission per group per assignment via a
two-step flow; admins can view submission status across groups.

**Prompt:**
```
Build the Submissions API, tying together groups and assignments already
implemented.

Do the following:
1. backend/src/controllers/submissionController.js:
   - stepOne(req,res): student-only, must belong to the group. Creates or
     updates a submissions row for (assignment_id, group_id) with
     status='pending_confirmation' (a transient pre-confirm state — add
     this as an allowed status value alongside 'pending'/'confirmed').
     This represents "Yes, I have submitted" (step 1 of 2).
   - stepTwo(req,res): student-only, same group membership check. Requires
     an existing stepOne record for that assignment+group. Sets
     status='confirmed', confirmed_by=req.user.id, confirmed_at=now().
     This is the final "confirm" (step 2 of 2). Reject if step 1 wasn't
     done first (clear error message).
   - getStatusForAssignment(req,res): admin-only. Returns every group's
     submission status for a given assignment (for the tracker table).
   - getStatusForGroup(req,res): student-only (own group) or admin.
     Returns the group's status across all its assignments (for the
     progress bar).
2. backend/src/routes/submissionRoutes.js:
   POST /api/submissions/:assignmentId/step1   (student)
   POST /api/submissions/:assignmentId/step2   (student)
   GET  /api/submissions/assignment/:id        (admin)
   GET  /api/submissions/group/:id             (student/admin)
3. Mount in server.js under /api/submissions.
4. Update backend/src/controllers/groupController.js getGroupById to
   include a computed progress field: confirmed_count / total_assignments
   assigned to that group.

Test manually: full flow — student does step1, tries step2 without step1
on a different assignment (should fail), does step1 then step2
successfully; admin GET status shows it as confirmed. Commit as
"feat(backend): two-step submission confirmation and status tracking".
```

---

## Phase 6 — Backend: Analytics

**Current state:** Full backend CRUD + submission flow working.

**Goal:** Admin analytics endpoint summarizing completion rates.

**Prompt:**
```
Build a lightweight analytics endpoint for the admin dashboard, using data
already available from assignments/groups/submissions.

Do the following:
1. backend/src/controllers/analyticsController.js:
   - overview(req,res): admin-only. Returns:
     { totalAssignments, totalGroups, totalStudents,
       overallCompletionRate,
       perAssignment: [{ assignmentId, title, totalGroups,
                          confirmedGroups, completionRate }],
       perGroup: [{ groupId, name, totalAssignments,
                     confirmedAssignments, completionRate }] }
   Use SQL aggregate queries (COUNT/GROUP BY), not N+1 loops in JS.
2. backend/src/routes/analyticsRoutes.js: GET /api/analytics/overview
   (admin only).
3. Mount in server.js under /api/analytics.

Test manually: seed a few assignments/groups/submissions in mixed states,
confirm the numbers returned are correct. Commit as "feat(backend):
analytics overview endpoint".

This completes the backend. Backend build order (phases 2-6) is done.
```

---

## Phase 7 — Frontend: Setup + Auth Pages

**Current state:** Full backend API working (auth, groups, assignments,
submissions, analytics). Frontend folder structure exists but is empty
beyond package.json placeholder.

**Goal:** React app boots with Tailwind, routing, an Axios API client, an
AuthContext, and working Login/Register pages that store the JWT and
redirect based on role.

**Prompt:**
```
Set up the React frontend and build authentication pages, wired to the
backend auth endpoints already built at /api/auth/*.

Do the following:
1. Add dependencies to frontend/package.json: react, react-dom,
   react-router-dom, axios, tailwindcss (+ postcss/autoprefixer), and a
   build tool (Vite recommended: vite, @vitejs/plugin-react).
2. Configure Tailwind (tailwind.config.js, index.css with @tailwind
   directives) and Vite (vite.config.js, proxy /api to backend port 5000
   in dev).
3. frontend/src/api/client.js — Axios instance with baseURL '/api',
   request interceptor attaching the JWT from localStorage, response
   interceptor handling 401 by clearing token and redirecting to /login.
4. frontend/src/context/AuthContext.jsx — holds { user, token }, exposes
   login(email,password), register(data), logout(), loading state;
   persists token to localStorage; on app load, calls GET /api/auth/me if
   a token exists to restore session.
5. frontend/src/pages/Login.jsx and Register.jsx — simple Tailwind-styled
   forms (email/password for login; name/email/password/role selector for
   register), calling AuthContext methods, showing validation/error
   states, redirecting to /student/dashboard or /admin/dashboard based on
   returned role.
6. frontend/src/App.jsx — React Router setup with a PrivateRoute /
   RoleRoute wrapper component that checks AuthContext and redirects
   unauthenticated or wrong-role users appropriately. Route stubs for
   /student/dashboard and /admin/dashboard (placeholder pages, filled in
   next phases).
7. frontend/src/main.jsx — mounts App wrapped in AuthProvider and
   BrowserRouter.

Test manually: npm run dev, register a student and an admin through the
UI, confirm login persists across refresh and routes to the correct
dashboard stub. Commit as "feat(frontend): app scaffolding, Tailwind,
routing, and auth pages".
```

---

## Phase 8 — Frontend: Student Flow

**Current state:** Auth pages + routing + AuthContext working. Backend
fully built. Admin/student dashboards are still placeholder stubs.

**Goal:** Full student experience — group creation/management, assignment
list, two-step submission confirmation, visual progress.

**Prompt:**
```
Build the student-facing pages, consuming the existing backend endpoints
for groups, assignments, and submissions (all under /api/groups,
/api/assignments, /api/submissions).

Do the following:
1. frontend/src/pages/StudentDashboard.jsx:
   - Shows the student's group (via GET /api/groups/mine) with a
     Tailwind progress bar / completion badge (confirmed_count /
     total_assignments from the group detail endpoint).
   - If no group exists yet, shows a "Create Group" form (calls
     POST /api/groups).
   - Shows an "Add Member" form (email input) if the student is in a
     group (calls POST /api/groups/:id/members), with success/error
     feedback (e.g. "user not found", "already a member").
2. frontend/src/pages/AssignmentsList.jsx (student view):
   - GET /api/assignments, rendered as cards: title, due date, OneDrive
     link (opens in new tab), and a status badge (not started / step 1
     done / confirmed) sourced from the group's submission status.
3. frontend/src/pages/AssignmentDetail.jsx:
   - Shows full assignment info.
   - Two-step confirm UI: a "Yes, I have submitted" button (calls
     POST /api/submissions/:id/step1) that reveals a second "Confirm
     Submission" button (calls step2) only after step1 succeeds. Disable
     step2 until step1 is done. Show a success state once confirmed
     (non-reversible in UI — just show "Confirmed on <date>").
4. frontend/src/components/: ProgressBar.jsx, StatusBadge.jsx,
   GroupCard.jsx, AssignmentCard.jsx — small reusable Tailwind components
   used by the pages above.
5. Wire these into App.jsx routes: /student/dashboard,
   /student/assignments, /student/assignments/:id (all RoleRoute
   'student').

Test manually: as a student, create a group, add a member, view
assignments, do step1 then step2 on one, confirm the dashboard progress
bar updates. Commit as "feat(frontend): student group, assignment, and
submission flow".
```

---

## Phase 9 — Frontend: Admin Flow

**Current state:** Student flow fully working. Backend analytics endpoint
ready. Admin dashboard is still a placeholder stub.

**Goal:** Full admin experience — assignment CRUD, group/student-wise
tracker table, basic analytics view.

**Prompt:**
```
Build the admin-facing pages, consuming /api/assignments (admin routes),
/api/submissions/assignment/:id, and /api/analytics/overview.

Do the following:
1. frontend/src/pages/AdminDashboard.jsx:
   - GET /api/analytics/overview, render as summary stat cards (total
     assignments, total groups, total students, overall completion %)
     plus a simple bar chart or horizontal progress list for
     perAssignment and perGroup completion rates. Use a lightweight chart
     approach (plain Tailwind-styled bars are fine — no heavy charting
     library required unless you want to add recharts).
2. frontend/src/pages/AssignmentManage.jsx:
   - List of assignments the admin created, with Create and Edit forms
     (title, description, due_date, onedrive_link, assigned_to_type
     'all'/'group', and a multi-select of groups when type='group' —
     fetch group list via a new lightweight GET /api/groups/all admin
     endpoint if one doesn't exist yet; add it to the backend if missing).
3. frontend/src/pages/SubmissionTracker.jsx:
   - Select an assignment, then GET /api/submissions/assignment/:id,
     render a table: group name | members | status
     (pending/pending_confirmation/confirmed) | confirmed date. Add a
     simple client-side filter by status.
4. Wire into App.jsx routes: /admin/dashboard, /admin/assignments,
   /admin/tracker (all RoleRoute 'admin').
5. Add a shared NavBar component (frontend/src/components/NavBar.jsx)
   showing role-appropriate links and a logout button, used by both
   student and admin layouts.

Note: if GET /api/groups/all doesn't exist on the backend yet, add it now
(admin-only, returns all groups with member counts) — this is a small
backend addition needed for the assignment-to-group assignment UI.

Test manually: as admin, create an assignment for "all", another for a
specific group, view the tracker table update as students confirm, check
the dashboard analytics numbers match. Commit as "feat(frontend): admin
assignment management, submission tracker, and analytics dashboard".
```

---

## Phase 10 — Dockerize Everything

**Current state:** Full frontend + backend working locally (run
separately with npm). docker-compose currently only runs Postgres.

**Goal:** `docker-compose up` boots Postgres + backend + frontend
together with one command.

**Prompt:**
```
Containerize the full stack so the whole app runs with one command,
building on the existing docker-compose.yml (currently Postgres-only).

Do the following:
1. backend/Dockerfile — multi-stage or simple node:20-alpine image,
   installs deps, copies source, exposes the backend port, runs
   node src/server.js (or npm start).
2. frontend/Dockerfile — multi-stage: build stage (node:20-alpine, npm
   run build), serve stage (nginx:alpine serving the built static files,
   or vite preview if simpler). Expose port 80 (or your chosen port) and
   include a minimal nginx.conf if using nginx, with a fallback to
   index.html for client-side routing.
3. Update docker-compose.yml to add:
   - backend service: builds from ./backend, depends_on postgres
     (with a healthcheck so it waits for DB readiness), env vars
     (DATABASE_URL pointing at the postgres service name, JWT_SECRET),
     port mapping.
   - frontend service: builds from ./frontend, depends_on backend,
     port mapping (e.g. 3000:80).
   - Ensure the frontend's API base URL works inside Docker (use an
     env var or nginx reverse-proxy /api to the backend service name
     rather than hardcoding localhost).
4. Add backend/.dockerignore and frontend/.dockerignore (node_modules,
   .env, dist, .git).
5. Verify: docker-compose up --build brings up all three services and the
   app is fully usable end-to-end (register, login, create group, create
   assignment, confirm submission) through the frontend port only.

Commit as "chore: dockerize frontend, backend, and database with
docker-compose".
```

---

## Phase 11 — README + ER Diagram + Documentation

**Current state:** Full working app, fully dockerized.

**Goal:** A polished README.md that satisfies every deliverable
requirement (overview, setup, API docs, ER diagram, architecture, design
decisions).

**Prompt:**
```
Write the final README.md for the project root, replacing/merging content
from backend/README-dev-notes.md (delete that temp file after merging).

Include these sections, in order:
1. Project Overview — what it does, who it's for (students/admins),
   2-3 sentences per role's capabilities.
2. Tech Stack — table of frontend/backend/db/auth/containerization.
3. Architecture Overview — a short written description of the
   request flow (React -> Axios -> Express API -> PostgreSQL, JWT
   attached on every request, role middleware gating routes) plus a
   simple Mermaid flowchart diagram of that flow.
4. ER Diagram — Mermaid erDiagram block covering users, groups,
   group_members, assignments, assignment_groups, submissions with
   their relationships (reuse plan.md section 3 as the source of truth).
5. Setup & Run Instructions — two paths:
   a) Docker (recommended): git clone, docker-compose up --build,
      list the URLs/ports for frontend/backend once up.
   b) Manual/local dev: Postgres setup, backend npm install + .env from
      .env.example + npm run dev, frontend npm install + npm run dev.
6. API Endpoint Reference — a table per resource (Auth, Groups,
   Assignments, Submissions, Analytics) listing method, path, auth
   requirement, and one-line description. Pull this directly from the
   routes files built in phases 2-6.
7. Key Design Decisions — short bullet list explaining: why JWT over
   sessions, why two-step confirmation is modeled as a status enum
   rather than two booleans, why assignment-to-group targeting uses a
   join table instead of a JSON array, any trade-offs made for time.
8. Deployment Notes — if deployed (Phase 12 optional), list the live
   URLs and platforms used; if not deployed, state that clearly and
   note it runs fully via Docker Compose.
9. Folder Structure — the tree from plan.md section 6, updated to match
   what was actually built.

Keep it clean and skimmable — headings, tables, and diagrams over dense
paragraphs. Commit as "docs: complete README with architecture, ER
diagram, and API reference".
```

---

## Phase 12 — (Optional) Deployment

**Current state:** Fully working, documented, dockerized app.

**Goal:** A live, publicly accessible instance (optional per submission
instructions, but strengthens the submission).

**Prompt:**
```
Deploy the application so it's reachable via a public URL.

Do the following:
1. Database: create a free Postgres instance (e.g. Neon, Supabase, or
   Render Postgres). Run migrations/001_init.sql against it.
2. Backend: deploy to Render or Railway from the backend/ folder (or
   backend/Dockerfile). Set env vars DATABASE_URL and JWT_SECRET to
   match the hosted DB and a strong secret.
3. Frontend: deploy to Vercel or Netlify from the frontend/ folder,
   with the API base URL env var pointed at the deployed backend URL.
   Ensure CORS on the backend allows the deployed frontend origin.
4. Smoke test the full flow against the live URLs: register, login,
   create group, create assignment, confirm submission, check analytics.
5. Update README.md's Deployment Notes section with the live URLs and
   platforms used.

Commit as "chore: deploy frontend and backend to production".
```

---

## Phase 13 — Demo Video + Final Submission Packaging

**Current state:** App complete, documented, (optionally) deployed.

**Goal:** Recorded demo and the final submission PDF.

**Prompt:**
```
Prepare the final submission artifacts (no code changes in this phase).

Do the following:
1. Record a screen-capture demo video (5-8 min) covering:
   - Quick architecture recap (10-15 sec, optional voiceover over README
     diagram).
   - Student flow: register, login, create group, add a member, view
     assignments, open one, do step1 then step2 confirmation, show
     progress bar update on dashboard.
   - Admin flow: login, create an assignment (targeted at a specific
     group), view the submission tracker table, view the analytics
     dashboard.
   Upload to YouTube (unlisted) or Loom; copy the shareable link.
2. Note the GitHub repository URL (must be public or shared with the
   reviewers).
3. If deployed (Phase 12), note the live platform URL.
4. Create a one-page PDF named FullName-Task1.pdf containing exactly:
   - GitHub repository link
   - Working demo video link
   - Platform link (if deployed; otherwise omit this line)
5. Submit the PDF via the Google Form:
   https://forms.gle/3DHWzyk4LkPdfGJR9
6. Reply to the recruiter's email confirming submission is complete.
```

---

## Summary Table

| Phase | Deliverable |
|---|---|
| 1 | Repo scaffolding + DB schema |
| 2 | Backend auth (JWT, roles) |
| 3 | Backend groups |
| 4 | Backend assignments |
| 5 | Backend submissions (two-step) |
| 6 | Backend analytics |
| 7 | Frontend setup + auth pages |
| 8 | Frontend student flow |
| 9 | Frontend admin flow |
| 10 | Dockerize full stack |
| 11 | README + ER diagram |
| 12 | (Optional) Deployment |
| 13 | Demo video + submission packaging |

Each phase's prompt is self-contained — you can hand any single phase
prompt to Claude on its own and it has enough context (via "current state")
to know what already exists and what to build next.