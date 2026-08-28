/**
 * seedDemo.ts
 *
 * Seeds a rich, realistic academic environment for GroupSync:
 * - 12 Students with unified credentials (Demo@1234)
 * - 3 Academic Courses (CS301, CS402, CS204)
 * - Course enrollments for all students
 * - 4 Active Groups with designated Group Leaders + 1 Solo Student
 * - 6 Assignments across courses (with varied deadlines)
 * - Diverse Submission States (Accepted with grades, Rejected with feedback, Pending Confirmation, Confirmed awaiting review, Not started)
 *
 * Safe to re-run — fully idempotent.
 */

import bcrypt from 'bcrypt';
import 'dotenv/config';
import pool from '../config/db';

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'Demo@1234';

// ── 12 Demo Students ─────────────────────────────────────────────────────────
const STUDENTS = [
  { name: 'Alice Johnson',     email: 'alice@groupsync.com' },       // Leader: Nova Squad
  { name: 'Bob Martinez',      email: 'bob@groupsync.com' },         // Member: Nova Squad
  { name: 'Carol Danvers',     email: 'carol@groupsync.com' },       // Member: Nova Squad
  { name: 'David Miller',      email: 'david@groupsync.com' },       // Leader: ByteCoders
  { name: 'Emma Watson',       email: 'emma@groupsync.com' },        // Member: ByteCoders
  { name: 'Frank Castle',      email: 'frank@groupsync.com' },       // Member: ByteCoders
  { name: 'Grace Hopper',      email: 'grace@groupsync.com' },       // Leader: Quantum Crew
  { name: 'Henry Cavill',      email: 'henry@groupsync.com' },       // Member: Quantum Crew
  { name: 'Isabella Clark',    email: 'isabella@groupsync.com' },    // Member: Quantum Crew
  { name: 'Jack Ryan',         email: 'jack@groupsync.com' },        // Leader: CyberKnights
  { name: 'Katherine Johnson', email: 'katherine@groupsync.com' },   // Member: CyberKnights
  { name: 'Leo Messi',         email: 'leo@groupsync.com' },         // Fresh Student (No group yet)
];

// ── 3 Academic Courses ───────────────────────────────────────────────────────
const COURSES = [
  {
    title: 'CS301: Distributed Systems',
    description: 'Advanced consensus algorithms, Raft protocol, distributed key-value storage, and fault-tolerant architecture.',
  },
  {
    title: 'CS402: Modern Web Engineering',
    description: 'Full-stack distributed web applications, microservices, containerization, and real-time collaboration engines.',
  },
  {
    title: 'CS204: Database Management Systems',
    description: 'Relational database internals, B-Tree indexing, query optimization, ACID transactions, and concurrency control.',
  },
];

// ── 6 Assignments Across Courses ─────────────────────────────────────────────
const ASSIGNMENTS_DATA = [
  {
    courseIndex: 0, // CS301
    title: 'Milestone 1: RPC & Raft Consensus Engine',
    description: 'Implement a replicated state machine using the Raft consensus algorithm with leader election and log replication.',
    due_date: '2026-02-15',
    onedrive_link: 'https://onedrive.live.com/cs301-milestone-1-raft',
    assigned_to_type: 'all',
  },
  {
    courseIndex: 0, // CS301
    title: 'Milestone 2: Distributed Key-Value Store',
    description: 'Build a sharded, highly available distributed key-value storage service with linearizable read/write semantics.',
    due_date: '2026-09-30',
    onedrive_link: 'https://onedrive.live.com/cs301-milestone-2-kv',
    assigned_to_type: 'all',
  },
  {
    courseIndex: 1, // CS402
    title: 'Project A: Microservices & Event-Driven API',
    description: 'Design and deploy an event-driven architecture using Docker containers, message queues, and API gateways.',
    due_date: '2026-02-28',
    onedrive_link: 'https://onedrive.live.com/cs402-project-a-microservices',
    assigned_to_type: 'all',
  },
  {
    courseIndex: 1, // CS402
    title: 'Project B: Real-Time Collaborative Canvas',
    description: 'Create a multi-user collaborative workspace using WebSockets, conflict-free replicated data types (CRDTs), and GSAP.',
    due_date: '2026-10-15',
    onedrive_link: 'https://onedrive.live.com/cs402-project-b-canvas',
    assigned_to_type: 'all',
  },
  {
    courseIndex: 2, // CS204
    title: 'Lab 1: Query Optimization & B-Tree Indexing',
    description: 'Analyze PostgreSQL execution plans, optimize complex multi-table joins, and benchmark index strategies.',
    due_date: '2026-02-10',
    onedrive_link: 'https://onedrive.live.com/cs204-lab-1-optimization',
    assigned_to_type: 'all',
  },
  {
    courseIndex: 2, // CS204
    title: 'Lab 2: ACID Transactions & Concurrency',
    description: 'Simulate isolation levels (Read Committed, Repeatable Read, Serializable) and analyze deadlock resolution strategies.',
    due_date: '2026-11-01',
    onedrive_link: 'https://onedrive.live.com/cs204-lab-2-transactions',
    assigned_to_type: 'all',
  },
];

async function seedDemo(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 0. Ensure schema migrations exist ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        professor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS course_enrollments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(course_id, student_id)
      );

      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL;
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_url TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending';
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_feedback TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    `);

    console.log('🌱 Seeding rich demo data (12 Students, 3 Courses, 4 Groups, 6 Assignments)...\n');

    // ── 1. Admin Account ─────────────────────────────────────────────────────
    const adminEmail = process.env.SYSADMIN_EMAIL || process.env.ADMIN_EMAIL || 'sysadmin@groupsync.internal';
    const adminPassword = process.env.SYSADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Adm!n@GrpSync#2024';
    const adminName = process.env.SYSADMIN_NAME || process.env.ADMIN_NAME || 'System Administrator';
    const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const adminCheck = await client.query<{ id: number }>(
      `SELECT id FROM users WHERE email = $1`,
      [adminEmail]
    );

    let adminId: number;
    if (adminCheck.rows.length > 0) {
      adminId = adminCheck.rows[0].id;
      await client.query(
        `UPDATE users SET name = $1, password_hash = $2, role = 'admin' WHERE id = $3`,
        [adminName, adminPasswordHash, adminId]
      );
    } else {
      const adminUpsert = await client.query<{ id: number }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id`,
        [adminName, adminEmail, adminPasswordHash]
      );
      adminId = adminUpsert.rows[0].id;
    }
    console.log(`  🛡️  Admin / Professor: ${adminName} <${adminEmail}>`);

    // ── 2. Seed 12 Students ──────────────────────────────────────────────────
    const studentPasswordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    const userIds: Record<string, number> = {};

    console.log('\n  🎓 Registering 12 Students:');
    for (const student of STUDENTS) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'student')
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [student.name, student.email, studentPasswordHash]
      );
      userIds[student.email] = result.rows[0].id;
      console.log(`    ✓ ${student.name} <${student.email}>`);
    }

    // ── 3. Seed 3 Courses ────────────────────────────────────────────────────
    console.log('\n  📚 Creating 3 Academic Courses:');
    const courseIds: number[] = [];

    for (const course of COURSES) {
      const existing = await client.query<{ id: number }>(
        `SELECT id FROM courses WHERE title = $1`,
        [course.title]
      );

      let courseId: number;
      if (existing.rows.length > 0) {
        courseId = existing.rows[0].id;
        await client.query(
          `UPDATE courses SET description = $1, professor_id = $2 WHERE id = $3`,
          [course.description, adminId, courseId]
        );
      } else {
        const res = await client.query<{ id: number }>(
          `INSERT INTO courses (title, description, professor_id)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [course.title, course.description, adminId]
        );
        courseId = res.rows[0].id;
      }
      courseIds.push(courseId);
      console.log(`    ✓ ${course.title} (id=${courseId})`);

      // Enroll all 12 students in each course
      for (const student of STUDENTS) {
        const studentId = userIds[student.email];
        await client.query(
          `INSERT INTO course_enrollments (course_id, student_id)
           VALUES ($1, $2)
           ON CONFLICT (course_id, student_id) DO NOTHING`,
          [courseId, studentId]
        );
      }
    }
    console.log(`    → Enrolled all 12 students across courses.`);

    // ── 4. Seed 4 Student Groups with Designated Leaders ───────────────────────
    console.log('\n  👥 Creating 4 Student Teams:');
    const TEAMS = [
      {
        name: 'Nova Squad',
        leaderEmail: 'alice@groupsync.com',
        memberEmails: ['alice@groupsync.com', 'bob@groupsync.com', 'carol@groupsync.com'],
      },
      {
        name: 'ByteCoders',
        leaderEmail: 'david@groupsync.com',
        memberEmails: ['david@groupsync.com', 'emma@groupsync.com', 'frank@groupsync.com'],
      },
      {
        name: 'Quantum Crew',
        leaderEmail: 'grace@groupsync.com',
        memberEmails: ['grace@groupsync.com', 'henry@groupsync.com', 'isabella@groupsync.com'],
      },
      {
        name: 'CyberKnights',
        leaderEmail: 'jack@groupsync.com',
        memberEmails: ['jack@groupsync.com', 'katherine@groupsync.com'],
      },
    ];

    const groupIds: Record<string, number> = {};

    for (const team of TEAMS) {
      const leaderId = userIds[team.leaderEmail];
      const existing = await client.query<{ id: number }>(
        `SELECT id FROM groups WHERE name = $1`,
        [team.name]
      );

      let groupId: number;
      if (existing.rows.length > 0) {
        groupId = existing.rows[0].id;
        await client.query(
          `UPDATE groups SET leader_id = $1, created_by = $1 WHERE id = $2`,
          [leaderId, groupId]
        );
      } else {
        const res = await client.query<{ id: number }>(
          `INSERT INTO groups (name, created_by, leader_id)
           VALUES ($1, $2, $2)
           RETURNING id`,
          [team.name, leaderId]
        );
        groupId = res.rows[0].id;
      }
      groupIds[team.name] = groupId;

      // Add members
      for (const email of team.memberEmails) {
        const memberId = userIds[email];
        await client.query(
          `INSERT INTO group_members (group_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [groupId, memberId]
        );
      }

      console.log(`    ✓ ${team.name} (id=${groupId}) — Leader: ${team.leaderEmail} (${team.memberEmails.length} members)`);
    }
    console.log(`    ✓ Leo Messi left ungrouped (fresh registration flow).`);

    // ── 5. Seed 6 Assignments ─────────────────────────────────────────────────
    console.log('\n  📝 Seeding 6 Course Deliverables:');
    const assignmentIds: number[] = [];

    for (const assign of ASSIGNMENTS_DATA) {
      const courseId = courseIds[assign.courseIndex];
      const existing = await client.query<{ id: number }>(
        `SELECT id FROM assignments WHERE title = $1`,
        [assign.title]
      );

      let assignId: number;
      if (existing.rows.length > 0) {
        assignId = existing.rows[0].id;
        await client.query(
          `UPDATE assignments
           SET description = $1, due_date = $2, onedrive_link = $3, course_id = $4, assigned_to_type = $5
           WHERE id = $6`,
          [assign.description, assign.due_date, assign.onedrive_link, courseId, assign.assigned_to_type, assignId]
        );
      } else {
        const res = await client.query<{ id: number }>(
          `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, assigned_to_type, course_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [assign.title, assign.description, assign.due_date, assign.onedrive_link, adminId, assign.assigned_to_type, courseId]
        );
        assignId = res.rows[0].id;
      }
      assignmentIds.push(assignId);
      console.log(`    ✓ ${assign.title} (id=${assignId}, Due: ${assign.due_date})`);
    }

    // ── 6. Seed Varied & Realistic Submissions ─────────────────────────────────
    console.log('\n  📊 Populating Varied Submission Lifecycle States & Professor Feedback:');

    const [cs301M1, cs301M2, cs402PA, cs402PB, cs204L1, cs204L2] = assignmentIds;
    const dummyPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    // Helper to insert or update submission
    async function upsertSubmission(
      assignmentId: number,
      groupId: number,
      status: string,
      confirmedById: number | null,
      confirmedDaysAgo: number | null,
      reviewStatus: string | null = 'pending',
      reviewFeedback: string | null = null
    ) {
      const confirmedAt = confirmedDaysAgo !== null ? `now() - interval '${confirmedDaysAgo} days'` : null;
      await client.query(
        `INSERT INTO submissions (assignment_id, group_id, status, confirmed_by, confirmed_at, file_url, review_status, review_feedback, reviewed_at, reviewed_by)
         VALUES ($1, $2, $3, $4, ${confirmedAt ? confirmedAt : 'NULL'}, $5, $6, $7, ${reviewStatus !== 'pending' ? 'now() - interval \'1 day\'' : 'NULL'}, ${reviewStatus !== 'pending' ? adminId : 'NULL'})
         ON CONFLICT (assignment_id, group_id) DO UPDATE
           SET status = EXCLUDED.status,
               confirmed_by = EXCLUDED.confirmed_by,
               confirmed_at = EXCLUDED.confirmed_at,
               file_url = EXCLUDED.file_url,
               review_status = EXCLUDED.review_status,
               review_feedback = EXCLUDED.review_feedback,
               reviewed_at = EXCLUDED.reviewed_at,
               reviewed_by = EXCLUDED.reviewed_by`,
        [assignmentId, groupId, status, confirmedById, status !== 'pending' ? dummyPdf : null, reviewStatus, reviewFeedback]
      );
    }

    // 1. Nova Squad Submissions:
    await upsertSubmission(cs301M1, groupIds['Nova Squad'], 'confirmed', userIds['alice@groupsync.com'], 12, 'accepted', 'Flawless leader election and heartbeat timeouts! 100/100');
    await upsertSubmission(cs301M2, groupIds['Nova Squad'], 'pending_confirmation', null, null, 'pending', null); // Bob uploaded, waiting for Alice
    await upsertSubmission(cs402PA, groupIds['Nova Squad'], 'confirmed', userIds['alice@groupsync.com'], 5, 'rejected', 'Missing Docker Compose benchmark test suite. Please revise.');
    await upsertSubmission(cs204L1, groupIds['Nova Squad'], 'confirmed', userIds['alice@groupsync.com'], 18, 'accepted', 'Optimal composite B-tree indexing.');
    console.log('    ✓ Nova Squad: 2 Accepted ✓, 1 Rejected (needs revision), 1 Pending Leader Lock-In');

    // 2. ByteCoders Submissions:
    await upsertSubmission(cs301M1, groupIds['ByteCoders'], 'confirmed', userIds['david@groupsync.com'], 14, 'accepted', 'Clean RPC protocol implementation.');
    await upsertSubmission(cs301M2, groupIds['ByteCoders'], 'confirmed', userIds['david@groupsync.com'], 1, 'pending', null); // Locked, awaiting professor grading
    await upsertSubmission(cs402PA, groupIds['ByteCoders'], 'confirmed', userIds['david@groupsync.com'], 6, 'accepted', 'Excellent event-driven microservices setup.');
    await upsertSubmission(cs204L1, groupIds['ByteCoders'], 'confirmed', userIds['david@groupsync.com'], 20, 'accepted', 'Clear execution plan comparison.');
    console.log('    ✓ ByteCoders: 3 Accepted ✓, 1 Confirmed (Awaiting Professor Review)');

    // 3. Quantum Crew Submissions:
    await upsertSubmission(cs301M1, groupIds['Quantum Crew'], 'confirmed', userIds['grace@groupsync.com'], 10, 'accepted', 'Great state machine replication.');
    await upsertSubmission(cs402PA, groupIds['Quantum Crew'], 'pending_confirmation', null, null, 'pending', null); // Henry uploaded, waiting for Grace
    await upsertSubmission(cs204L1, groupIds['Quantum Crew'], 'confirmed', userIds['grace@groupsync.com'], 15, 'accepted', 'Detailed query cost breakdown.');
    console.log('    ✓ Quantum Crew: 2 Accepted ✓, 1 Pending Leader Lock-In, 3 Not Started');

    // 4. CyberKnights Submissions:
    await upsertSubmission(cs301M1, groupIds['CyberKnights'], 'confirmed', userIds['jack@groupsync.com'], 2, 'pending', null);
    console.log('    ✓ CyberKnights: 1 Confirmed (Awaiting Review), 5 Not Started');

    await client.query('COMMIT');

    console.log('\n═════════════════════════════════════════════════════════════════');
    console.log('🎉 RICH DEMO SEED COMPLETED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════════════════════════════');
    console.log(`🛡️  PROFESSOR / ADMIN CREDENTIALS:`);
    console.log(`   Email:    sysadmin@groupsync.internal`);
    console.log(`   Password: Adm!n@GrpSync#2024`);
    console.log('');
    console.log(`🎓 DEMO STUDENT ACCOUNTS (Password for all students: Demo@1234):`);
    console.log(`   1.  alice@groupsync.com     (Leader  · Nova Squad)`);
    console.log(`   2.  bob@groupsync.com       (Member  · Nova Squad)`);
    console.log(`   3.  carol@groupsync.com     (Member  · Nova Squad)`);
    console.log(`   4.  david@groupsync.com     (Leader  · ByteCoders)`);
    console.log(`   5.  emma@groupsync.com      (Member  · ByteCoders)`);
    console.log(`   6.  frank@groupsync.com     (Member  · ByteCoders)`);
    console.log(`   7.  grace@groupsync.com     (Leader  · Quantum Crew)`);
    console.log(`   8.  henry@groupsync.com     (Member  · Quantum Crew)`);
    console.log(`   9.  isabella@groupsync.com  (Member  · Quantum Crew)`);
    console.log(`   10. jack@groupsync.com      (Leader  · CyberKnights)`);
    console.log(`   11. katherine@groupsync.com (Member  · CyberKnights)`);
    console.log(`   12. leo@groupsync.com       (Solo    · No Group)`);
    console.log('═════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Demo seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemo();
