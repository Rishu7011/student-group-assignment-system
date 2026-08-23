/**
 * seedDemo.ts
 *
 * Seeds realistic demo data for the GroupSync video walkthrough.
 * Creates students, a pre-built group, and assignments in varied states.
 *
 * Safe to re-run — all inserts are idempotent (ON CONFLICT DO NOTHING).
 *
 * Run with:
 *   npx ts-node src/scripts/seedDemo.ts
 *
 * Or add an npm script in package.json:
 *   "seed:demo": "ts-node src/scripts/seedDemo.ts"
 */

import bcrypt from 'bcrypt';
import 'dotenv/config';
import pool from '../config/db';

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'Demo@1234';

// ── Demo users ───────────────────────────────────────────────────────────────
const STUDENTS = [
  { name: 'Alice Demo',  email: 'alice@groupsync.com' },
  { name: 'Bob Demo',    email: 'bob@groupsync.com' },
  { name: 'Carol Demo',  email: 'carol@groupsync.com' }, // fresh account — used for live registration demo
];

// ── Demo assignments ─────────────────────────────────────────────────────────
const ASSIGNMENTS = [
  {
    title: 'Research Report',
    description: 'Write a 5-page research report on a topic of your choice.',
    due_date: '2025-07-15',          // past due — for partial-submission demo
    onedrive_link: 'https://onedrive.live.com/demo-research-report',
    assigned_to_type: 'all',
  },
  {
    title: 'Final Presentation',
    description: 'Prepare and submit a 10-slide presentation deck.',
    due_date: '2026-09-30',          // upcoming — used for live submission demo
    onedrive_link: 'https://onedrive.live.com/demo-final-presentation',
    assigned_to_type: 'all',
  },
  {
    title: 'Lab Write-up',
    description: 'Document your lab findings and submit the write-up.',
    due_date: '2025-06-01',          // past due — fully confirmed (shows 100% in analytics)
    onedrive_link: 'https://onedrive.live.com/demo-lab-writeup',
    assigned_to_type: 'all',
  },
];

async function seedDemo(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Ensure submission columns exist
    await client.query(`
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_url TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending';
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_feedback TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    `);

    console.log('🌱 Seeding demo data...\n');

    // ── 1. Upsert student users ───────────────────────────────────────────────
    const password_hash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    const userIds: Record<string, number> = {};

    for (const student of STUDENTS) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'student')
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [student.name, student.email, password_hash]
      );
      userIds[student.email] = result.rows[0].id;
      console.log(`  ✅ Student: ${student.name} <${student.email}>`);
    }

    // ── 2. Create "Team Alpha" group (owned by Alice) ─────────────────────────
    const aliceId = userIds['alice@groupsync.com'];
    const bobId   = userIds['bob@groupsync.com'];

    const groupResult = await client.query<{ id: number }>(
      `INSERT INTO groups (name, created_by)
       VALUES ('Team Alpha', $1)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [aliceId]
    );

    let groupId: number;
    if (groupResult.rows.length > 0) {
      groupId = groupResult.rows[0].id;
    } else {
      // Group already existed — look it up
      const existing = await client.query<{ id: number }>(
        `SELECT id FROM groups WHERE name = 'Team Alpha' AND created_by = $1`,
        [aliceId]
      );
      groupId = existing.rows[0].id;
    }
    console.log(`\n  ✅ Group: "Team Alpha" (id=${groupId})`);

    // Add Alice and Bob as members (Carol is intentionally excluded — fresh account)
    for (const [label, userId] of [['Alice', aliceId], ['Bob', bobId]] as [string, number][]) {
      await client.query(
        `INSERT INTO group_members (group_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [groupId, userId]
      );
      console.log(`    → ${label} added to Team Alpha`);
    }

    // ── 3. Ensure Admin account exists & has configured password ───────────────
    let adminId: number;
    const adminEmail = process.env.SYSADMIN_EMAIL || process.env.ADMIN_EMAIL || 'sysadmin@groupsync.internal';
    const adminPassword = process.env.SYSADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Adm!n@GrpSync#2024';
    const adminName = process.env.SYSADMIN_NAME || process.env.ADMIN_NAME || 'System Administrator';
    const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const adminCheck = await client.query<{ id: number }>(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (adminCheck.rows.length > 0) {
      adminId = adminCheck.rows[0].id;
      await client.query(
        `UPDATE users SET name = $1, password_hash = $2, role = 'admin' WHERE id = $3`,
        [adminName, adminPasswordHash, adminId]
      );
      console.log(`\n  🛡️  Admin: ${adminName} <${adminEmail}> updated (password: ${adminPassword})`);
    } else {
      const adminUpsert = await client.query<{ id: number }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
         RETURNING id`,
        [adminName, adminEmail, adminPasswordHash]
      );
      adminId = adminUpsert.rows[0].id;
      console.log(`\n  🛡️  Admin: ${adminName} <${adminEmail}> created (password: ${adminPassword})`);
    }

    // ── 4. Upsert assignments ─────────────────────────────────────────────────
    console.log('\n  Seeding assignments...');
    const assignmentIds: number[] = [];

    for (const assignment of ASSIGNMENTS) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, assigned_to_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          assignment.title,
          assignment.description,
          assignment.due_date,
          assignment.onedrive_link,
          adminId,
          assignment.assigned_to_type,
        ]
      );

      let assignmentId: number;
      if (result.rows.length > 0) {
        assignmentId = result.rows[0].id;
      } else {
        const existing = await client.query<{ id: number }>(
          `SELECT id FROM assignments WHERE title = $1`,
          [assignment.title]
        );
        assignmentId = existing.rows[0].id;
      }

      assignmentIds.push(assignmentId);
      console.log(`  ✅ Assignment: "${assignment.title}" (id=${assignmentId}, due: ${assignment.due_date})`);
    }

    const [researchReportId, , labWriteupId] = assignmentIds;

    // ── 5. Seed submissions ───────────────────────────────────────────────────
    console.log('\n  Seeding submissions...');

    // "Research Report" — Team Alpha: confirmed
    // Progress bar shows submitted for this group. Carol has no group → analytics shows partial.
    await client.query(
      `INSERT INTO submissions (assignment_id, group_id, status, confirmed_by, confirmed_at, file_url)
       VALUES ($1, $2, 'confirmed', $3, now() - interval '5 days', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
       ON CONFLICT (assignment_id, group_id) DO UPDATE
         SET status = 'confirmed', confirmed_by = EXCLUDED.confirmed_by, confirmed_at = EXCLUDED.confirmed_at, file_url = EXCLUDED.file_url`,
      [researchReportId, groupId, aliceId]
    );
    console.log('  ✅ "Research Report" → Team Alpha: confirmed (by Alice, 5 days ago)');

    // "Final Presentation" — no submission (intentional — clean slate for live demo)
    console.log('  ⬜ "Final Presentation" → Team Alpha: no submission (clean for live demo)');

    // "Lab Write-up" — Team Alpha: confirmed (shows near-100% in analytics)
    await client.query(
      `INSERT INTO submissions (assignment_id, group_id, status, confirmed_by, confirmed_at, file_url)
       VALUES ($1, $2, 'confirmed', $3, now() - interval '30 days', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
       ON CONFLICT (assignment_id, group_id) DO UPDATE
         SET status = 'confirmed', confirmed_by = EXCLUDED.confirmed_by, confirmed_at = EXCLUDED.confirmed_at, file_url = EXCLUDED.file_url`,
      [labWriteupId, groupId, aliceId]
    );
    console.log('  ✅ "Lab Write-up" → Team Alpha: confirmed (30 days ago)');

    await client.query('COMMIT');

    console.log('\n✅ Demo seed complete!\n');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('Credentials Summary:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`  🛡️  Admin / Professor:`);
    console.log(`      Email:    ${adminEmail}`);
    console.log(`      Password: ${adminPassword}`);
    console.log('');
    console.log(`  🎓 Students (Password for all students: Demo@1234):`);
    console.log('      alice@groupsync.com   (Team Alpha - Member)');
    console.log('      bob@groupsync.com     (Team Alpha - Member)');
    console.log('      carol@groupsync.com   (Fresh student - No Group)');
    console.log('─────────────────────────────────────────────────────────────────\n');

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
