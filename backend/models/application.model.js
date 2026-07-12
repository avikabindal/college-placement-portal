const { supabaseAdmin } = require("../database/supabase");

const getAllApplications = async () => {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*, students(id, resume_url, profiles(name, email)), opportunities(title, company_id, companies(profiles(name)))")
    .order("created_at", { ascending: false });
  return { data, error };
};

const getApplicationsByStudent = async (studentId) => {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*, opportunities(title, location, stipend, companies(profiles(name))), status_history(*)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return { data, error };
};

const getApplicationsByOpportunity = async (opportunityId) => {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*, students(*, profiles(name, email))")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  return { data, error };
};

const createApplication = async (fields) => {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .insert(fields)
    .select()
    .single();
  return { data, error };
};

const updateApplicationStatus = async (id, status, remarks, scheduled_date = undefined, event_details = undefined) => {
  const updates = { status, remarks };
  if (scheduled_date !== undefined) updates.scheduled_date = scheduled_date;
  if (event_details !== undefined) updates.event_details = event_details;

  const { data, error } = await supabaseAdmin
    .from("applications")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
};

const getApplicationById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*, opportunity_id, student_id, opportunities(company_id)")
    .eq("id", id)
    .single();
  return { data, error };
};

module.exports = {
  getAllApplications,
  getApplicationsByStudent,
  getApplicationsByOpportunity,
  createApplication,
  updateApplicationStatus,
  getApplicationById,
};