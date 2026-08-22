/**
 * seed-admin.ts
 *
 * Upserts the system administrator account from environment variables.
 * Called automatically on server startup — safe to re-run (idempotent).
 *
 * Required env vars (set in backend/.env, never committed):
 *   SYSADMIN_EMAIL     – login email for the system admin
 *   SYSADMIN_PASSWORD  – plaintext password (will be bcrypt-hashed)
 *   SYSADMIN_NAME      – display name  (default: "System Administrator")
 */

import bcrypt from 'bcrypt';
import pool from '../config/db';

const SALT_ROUNDS = 12;

export async function seedSystemAdmin(): Promise<void> {
  const email    = process.env.SYSADMIN_EMAIL;
  const password = process.env.SYSADMIN_PASSWORD;
  const name     = process.env.SYSADMIN_NAME ?? 'System Administrator';

  if (!email || !password) {
    console.warn(
      '⚠️  SYSADMIN_EMAIL or SYSADMIN_PASSWORD not set — skipping system admin seed.'
    );
    return;
  }

  try {
    // Check if the account already exists
    const existing = await pool.query<{ id: number; role: string }>(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    );

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE users SET name = $1, password_hash = $2, role = 'admin' WHERE email = $3",
        [name, password_hash, email]
      );
      console.log(`✅ System admin account synchronized: ${email}`);
      return;
    }

    // Create the account with a bcrypt-hashed password
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [name, email, password_hash]
    );

    console.log(`🛡️  System admin account created: ${email}`);
  } catch (err) {
    console.error('❌ Failed to seed system admin:', err);
    // Do NOT throw — a seed failure should not crash the whole server
  }
}
