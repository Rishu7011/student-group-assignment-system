# Project Plan — Student, Group & Assignment Management System

**Task:** Joineazy Full Stack Internship — Task 1
**Deadline:** Tuesday, 25 Aug 2026, 11:30 AM

---

## 1. Goal (one line)

A role-based web app where **students** form groups and confirm assignment
submissions, and **admins (professors)** post assignments and track
group/student progress.

---

## 2. Stack

| Layer      | Tech                                  |
|------------|----------------------------------------|
| Frontend   | React.js + Tailwind CSS                |
| Backend    | Node.js + Express                      |
| Database   | PostgreSQL                             |
| Auth       | JWT (role claim: `student` / `admin`)  |
| Containers | Docker + docker-compose                |

---

## 3. Data Model

```
users
  id, name, email (unique), password_hash, role (student|admin), created_at

groups
  id, name, created_by (fk -> users.id, the student who created it), created_at

group_members
  id, group_id (fk), user_id (fk), joined_at
  -- unique(group_id, user_id)

assignments
  id, title, description, due_date, onedrive_link,
  created_by (fk -> users.id, admin), assigned_to_type (all|group),
  created_at

assignment_groups            -- only used when assigned_to_type = 'group'
  id, assignment_id (fk), group_id (fk)

submissions
  id, assignment_id (fk), group_id (fk),
  status (pending|confirmed), confirmed_by (fk -> users.id),
  confirmed_at, created_at
  -- unique(assignment_id, group_id)
```

**Relationships**
- User (student) 1—N Group (as creator)
- Group N—N User via `group_members`
- Assignment N—N Group via `assignment_groups` (or "all groups" if type=all)
- Assignment 1—N Submission, Group 1—N Submission

ER diagram will be drawn in Mermaid syntax and embedded in the README.

---

## 4. API Endpoints (draft)

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

**Groups (student)**
- `POST /api/groups` — create group
- `POST /api/groups/:id/members` — add member by email/ID
- `GET /api/groups/mine` — my group(s)
- `GET /api/groups/:id` — group detail + members + progress

**Assignments**
- `POST /api/assignments` — admin creates
- `PUT /api/assignments/:id` — admin edits
- `GET /api/assignments` — list (role-aware: student sees relevant ones)
- `GET /api/assignments/:id`

**Submissions**
- `POST /api/submissions/:assignmentId/step1` — "Yes, I have submitted"
- `POST /api/submissions/:assignmentId/step2` — final confirm
- `GET /api/submissions/assignment/:id` — admin: all groups' status
- `GET /api/submissions/group/:id` — group's own status across assignments

**Analytics (admin)**
- `GET /api/analytics/overview` — completion counts, per-assignment %, per-group %

All non-auth routes protected by JWT middleware; role-checked with a
`requireRole('admin' | 'student')` middleware.

---

## 5. Frontend Pages

**Shared**
- Login
- Register

**Student**
- Dashboard (my group, progress badge)
- Create/Manage Group (add members)
- Assignments List (with OneDrive link)
- Assignment Detail → two-step confirm submission UI

**Admin**
- Dashboard (analytics: completion %, charts/counts)
- Assignments List/Create/Edit
- Group & Student Submission Tracker (table, filter by assignment/group)

Routing: React Router, with role-based route guards. Tailwind for styling
(clean, minimal — cards, badges, progress bars).

---

## 6. Folder Structure

```
student-group-assignment-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/            (SQL or query modules)
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/ (auth.js, roles.js)
│   │   └── server.js
│   ├── migrations/ (SQL schema)
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/ (AuthContext)
│   │   ├── api/ (axios client)
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── plan.md
└── README.md
```

---

## 7. Build Order (prioritized so something demo-able exists at every stage)

1. **Repo + scaffolding** — folder structure, git init, README skeleton
2. **DB schema** — write SQL migration, spin up Postgres via docker-compose
3. **Backend: Auth** — register/login, JWT middleware, role guard
4. **Backend: Groups** — create group, add members
5. **Backend: Assignments** — CRUD (admin)
6. **Backend: Submissions** — two-step confirm + status queries
7. **Backend: Analytics** — summary counts
8. **Frontend: Auth pages** — login/register, store JWT, AuthContext
9. **Frontend: Student flow** — group creation, assignment list, confirm-submission UI, progress bar
10. **Frontend: Admin flow** — assignment CRUD, tracker table, analytics view
11. **Dockerize** — Dockerfiles for both services + docker-compose wiring all three
12. **README** — architecture overview, ER diagram, setup steps, API docs, design decisions
13. **Record demo video** — student flow end-to-end, then admin flow end-to-end
14. **(Optional) Deploy** — frontend on Vercel/Netlify, backend on Render/Railway, DB on Neon
15. **Package submission** — PDF with repo link + video link (+ platform link), correctly named

---

## 8. Time Budget (rough, ~2 days)

| Block | Time |
|---|---|
| Schema + backend core (auth, groups, assignments, submissions) | ~5–6 hrs |
| Frontend core pages (student + admin flows) | ~5–6 hrs |
| Docker + README + ER diagram | ~2 hrs |
| Testing end-to-end + polish | ~2 hrs |
| Demo recording + PDF packaging | ~1 hr |

Cut first if time runs short: analytics charts (fall back to plain counts),
deployment (optional anyway), styling polish. Never cut: auth, core CRUD,
two-step confirmation, README, demo video.

---

## 9. Definition of Done (matches grading criteria)

- [ ] Student can register/login
- [ ] Student can create a group and add members
- [ ] Student can view assignments + OneDrive links
- [ ] Two-step submission confirmation works
- [ ] Group progress shown visually
- [ ] Admin can create/edit assignments, assign to all/specific groups
- [ ] Admin can see group/student-wise submission status
- [ ] Admin sees basic analytics/summary counts
- [ ] Clean git history, frontend/backend separated
- [ ] README: overview, setup, API docs, ER diagram, architecture, design decisions
- [ ] Docker Compose runs the whole stack with one command
- [ ] Demo video recorded covering both roles