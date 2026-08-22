# Backend Dev Notes

## Stack
- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** PostgreSQL 16 (via `pg` Pool)
- **Auth:** JWT (`jsonwebtoken`) + bcrypt password hashing

## Prerequisites
- Docker + Docker Compose (for Postgres)
- Node.js 20+

## Running locally

### 1. Start Postgres
```bash
# From the project root
docker-compose up -d postgres
```

### 2. Set up environment
```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults match docker-compose.yml)
```

### 3. Install dependencies & start
```bash
npm install
npm run dev   # nodemon watches for changes
```

Server starts at: `http://localhost:5000`

## Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register user (student or admin) |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Returns current user |
| GET | `/api/health` | None | Health check |

## JWT Structure
```json
{ "id": 1, "role": "student" }
```
Token lifetime: 7 days. Attach as `Authorization: Bearer <token>`.

## Roles
- `student` — can create groups, view/confirm assignments
- `admin` — can create/edit assignments, view analytics

---
*This file will be merged into the root README.md in Phase 11.*
