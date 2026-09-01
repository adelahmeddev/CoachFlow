const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const trainerId = 'c119c61e240d9428e81bab1e0';

    // Run the EXACT same query as the dashboard
    const statsQuery = `
      SELECT
        COUNT(*)::int AS "totalClients",
        COUNT(*) FILTER (WHERE "status" = $4::"ClientStatus")::int AS "pendingAssessment",
        COUNT(*) FILTER (WHERE "status" = $5::"ClientStatus")::int AS "activeClients",
        COUNT(*) FILTER (WHERE "createdAt" >= $2::timestamptz)::int AS "recentlyAdded",
        COUNT(*) FILTER (WHERE "createdAt" >= $3::timestamptz AND "createdAt" < $2::timestamptz)::int AS "prevPeriodAdded",
        COUNT(*) FILTER (WHERE "status" = $4::"ClientStatus" AND "createdAt" < $2::timestamptz)::int AS "prevPendingAssessment",
        COUNT(*) FILTER (WHERE "status" = $5::"ClientStatus" AND "createdAt" < $2::timestamptz)::int AS "prevActiveClients"
      FROM "Client"
      WHERE "trainerId" = $1
    `;

    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    try {
      const statsRes = await pool.query(statsQuery, [
        trainerId,
        thirtyDaysAgo,
        sixtyDaysAgo,
        'PENDING_ASSESSMENT',
        'ACTIVE',
      ]);
      console.log('--- Stats Query Result ---');
      console.log(JSON.stringify(statsRes.rows[0], null, 2));
    } catch (e) {
      console.error('Stats query FAILED:', e.message);
    }

    // Also try recent clients
    const recentQuery = `
      SELECT id, "fullName", phone, goal, status, "createdAt"
      FROM "Client"
      WHERE "trainerId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 5
    `;
    try {
      const recentRes = await pool.query(recentQuery, [trainerId]);
      console.log('--- Recent Query Result ---');
      console.log('Row count:', recentRes.rowCount);
      console.table(recentRes.rows);
    } catch (e) {
      console.error('Recent query FAILED:', e.message);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
