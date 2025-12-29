const express = require("express");
const { z } = require("zod");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { isOrgMember } = require("../utils/orgAccess");

const router = express.Router();

const upsertPageSchema = z.object({
  orgId: z.number().int(),
  slug: z.string().min(1).max(100), // e.g. "about", "services"
  title: z.string().min(1).max(200),
  content: z.string().optional().default(""),
  published: z.boolean().optional().default(false)
});

/**
 * BOOTSTRAP: creates pages table
 */
router.get("/bootstrap", async (req, res) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pages (
      id SERIAL PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      published BOOLEAN NOT NULL DEFAULT FALSE,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, slug)
    );
  `);

  res.json({ ok: true, message: "pages table ready" });
});

/**
 * Create or update a page (private, org members only).
 * If page exists (orgId+slug), it updates; otherwise creates.
 */
router.post("/upsert", requireAuth, async (req, res) => {
  try {
    const data = upsertPageSchema.parse(req.body);

    const member = await isOrgMember(data.orgId, req.user.userId);
    if (!member) return res.status(403).json({ error: "Not a member of this organization" });

    const result = await pool.query(
      `
      INSERT INTO pages (org_id, slug, title, content, published, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (org_id, slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        published = EXCLUDED.published,
        updated_at = NOW()
      RETURNING *;
      `,
      [data.orgId, normalizeSlug(data.slug), data.title, data.content, data.published, req.user.userId]
    );

    res.json({ ok: true, page: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: "Invalid input", details: String(err.message || err) });
  }
});

/**
 * List pages for an org (private, org members only).
 */
router.get("/", requireAuth, async (req, res) => {
  const orgId = Number(req.query.orgId);
  if (!orgId) return res.status(400).json({ error: "orgId query param required" });

  const member = await isOrgMember(orgId, req.user.userId);
  if (!member) return res.status(403).json({ error: "Not a member of this organization" });

  const result = await pool.query(
    `SELECT id, org_id, slug, title, published, created_at, updated_at
     FROM pages
     WHERE org_id = $1
     ORDER BY updated_at DESC`,
    [orgId]
  );

  res.json({ ok: true, pages: result.rows });
});

/**
 * Get one page (private, org members only).
 */
router.get("/one", requireAuth, async (req, res) => {
  const orgId = Number(req.query.orgId);
  const slug = String(req.query.slug || "");
  if (!orgId || !slug) return res.status(400).json({ error: "orgId and slug required" });

  const member = await isOrgMember(orgId, req.user.userId);
  if (!member) return res.status(403).json({ error: "Not a member of this organization" });

  const result = await pool.query(
    `SELECT * FROM pages WHERE org_id=$1 AND slug=$2`,
    [orgId, normalizeSlug(slug)]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: "Page not found" });
  res.json({ ok: true, page: result.rows[0] });
});

/**
 * Public: view a published page by orgId + slug.
 * This is your “website output” endpoint.
 */
router.get("/public", async (req, res) => {
  const orgId = Number(req.query.orgId);
  const slug = String(req.query.slug || "");
  if (!orgId || !slug) return res.status(400).json({ error: "orgId and slug required" });

  const result = await pool.query(
    `SELECT org_id, slug, title, content, updated_at
     FROM pages
     WHERE org_id=$1 AND slug=$2 AND published=TRUE`,
    [orgId, normalizeSlug(slug)]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: "Page not found or not published" });

  res.json({ ok: true, page: result.rows[0] });
});

function normalizeSlug(slug) {
  return slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

module.exports = router;
