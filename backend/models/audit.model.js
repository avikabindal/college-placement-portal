const { supabaseAdmin } = require("../database/supabase");

const createAuditLog = async (tpoId, changedById, action, details) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tpo_audit_logs")
      .insert({
        tpo_id: tpoId,
        changed_by: changedById,
        action,
        details
      })
      .select();
    
    if (error) {
      console.error("Failed to insert tpo_audit_log:", error);
    }
    return { data, error };
  } catch (err) {
    console.error("Error creating audit log:", err);
    return { error: err };
  }
};

const getAuditLogs = async (tpoId) => {
  const { data, error } = await supabaseAdmin
    .from("tpo_audit_logs")
    .select(`
      id,
      action,
      details,
      created_at,
      changed_by_profile:profiles!changed_by (
        name,
        email
      )
    `)
    .eq("tpo_id", tpoId)
    .order("created_at", { ascending: false });

  return { data, error };
};

module.exports = { createAuditLog, getAuditLogs };
