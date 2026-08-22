import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'sgas_db',
        user: process.env.DB_USER || 'sgas_user',
        password: process.env.DB_PASSWORD || 'sgas_pass',
      }
);

pool.on('error', (err: Error) => {
  console.error('Unexpected PostgreSQL client error', err);
  process.exit(1);
});

export default pool;
