import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const res = await pool.query('SELECT id, username, email, role, "mustChangePassword", "createdAt" FROM "User"');
console.table(res.rows);

await pool.end();