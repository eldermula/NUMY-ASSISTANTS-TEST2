const express = require("express");
const { z } = require("zod");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { isOrgMember } = require("../utils/orgAccess");


const router = express.Router();

// Validation
const createTaskSchema = z.object({
  orgId: z.number().int(),
  title: z.string().min(2),
  description: z.string().optional().default(""),
  dueDate: z.string().optional().default(null) // ISO string preferred
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  dueDate: z.string().nullable().optional()
});

/**
 * BOOTSTRAP: creates tasks table
 * Run once when server is executable.
 */
router.get("/bootstrap", async (req, res) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      due_date TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  res.json({ ok: true, message: "tasks table ready" });
});

/**
 * Create a task (must be authenticated).
 * Basic membership enforcement will be added next; for now we keep it simple.
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const data = createTaskSchema.parse(req.body);
const member = await isOrgMember(data.orgId, req.user.userId);
if (!member) return res.status(403).json({ error: "Not a member of this organization" });

    const result = await pool.query(
      `INSERT INTO tasks (org_id, created_by, assigned_to, title, description, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.orgId,
        req.user.userId,
        req.user.userId,
        data.title,
        data.description,
        data.dueDate ? new Date(data.dueDate) : null
      ]
    );

    res.status(201).json({ ok: true, task: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: "Invalid input", details: String(err.message || err) });
  }
});

/**
 * List tasks by orgId (must be authenticated).
 */
router.get("/", requireAuth, async (req, res) => {
  const orgId = Number(req.query.orgId);
  if (!orgId) return res.status(400).json({ error: "orgId query param required" });
const member = await isOrgMember(orgId, req.user.userId);
if (!member) return res.status(403).json({ error: "Not a member of this organization" });

  const result = await pool.query(
    `SELECT * FROM tasks
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [orgId]
  );

  res.json({ ok: true, tasks: result.rows });
});

/**
 * Update a task by id (status/title/description/dueDate).
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!taskId) return res.status(400).json({ error: "Invalid task id" });

    const patch = updateTaskSchema.parse(req.body);

    // Fetch existing
    const existing = await pool.query("SELECT * FROM tasks WHERE id=$1", [taskId]);
    if (existing.rowCount === 0) return res.status(404).json({ error: "Task not found" });

    const current = existing.rows[0];

    const nextTitle = patch.title ?? current.title;
    const nextDescription = patch.description ?? current.description;
    const nextStatus = patch.status ?? current.status;
    const nextDueDate =
      patch.dueDate === undefined
        ? current.due_date
        : patch.dueDate === null
          ? null
          : new Date(patch.dueDate);

    const updated = await pool.query(
      `UPDATE tasks
       SET title=$1, description=$2, status=$3, due_date=$4, updated_at=NOW()
       WHERE id=$5
       RETURNING *`,
      [nextTitle, nextDescription, nextStatus, nextDueDate, taskId]
    );

    res.json({ ok: true, task: updated.rows[0] });
  } catch (err) {
    res.status(400).json({ error: "Invalid input", details: String(err.message || err) });
  }
});

module.exports = router;
