const { pool } = require("../config/db");

/**
 * Returns true if user is a member of org.
 */
async function isOrgMember(orgId, userId) {
  const result = await pool.query(
    "SELECT id FROM org_members WHERE org_id=$1 AND user_id=$2",
    [orgId, userId]
  );
  return result.rowCount > 0;
}

module.exports = { isOrgMember };
