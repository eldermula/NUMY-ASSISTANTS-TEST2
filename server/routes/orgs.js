const express = require("express");
const { z } = require("zod");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const createOrgSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default("")
});

/**
 * BOOTSTRAP: creates organizations + org_members tables
 * Run once when server is executable.
 */
router.get("/bootstrap", async (req, res) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_members (
      id SERIAL PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, user_id)
    );
  `);

  res.json({ ok: true, message: "organizations + org_members tables ready" });
});

/**
 * Create an organization and add the creator as admin member.
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const data = createOrgSchema.parse(req.body);

    const created = await pool.query(
      `INSERT INTO organizations (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_by, created_at`,
      [data.name, data.description, req.user.userId]
    );

    const org = created.rows[0];

    await pool.query(
      `INSERT INTO org_members (org_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (org_id, user_id) DO NOTHING`,
      [org.id, req.user.userId, "admin"]
    );

    res.status(201).json({ ok: true, organization: org });
  } catch (err) {
    res.status(400).json({ error: "Invalid input", details: String(err.message || err) });
  }
});

/**
 * List organizations the current user belongs to.
 */
router.get("/mine", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT o.id, o.name, o.description, m.role, o.created_at
     FROM org_members m
     JOIN organizations o ON o.id = m.org_id
     WHERE m.user_id = $1
     ORDER BY o.created_at DESC`,
    [req.user.userId]
  );

  res.json({ ok: true, organizations: result.rows });
});

module.exports = router;
