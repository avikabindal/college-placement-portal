const { supabaseAdmin } = require("../database/supabase");

const getAllOpportunities = async (filters = {}) => {
  let query = supabaseAdmin
    .from("opportunities")
    .select("*, companies(id, is_active, profiles(name))")
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.company_id) query = query.eq("company_id", filters.company_id);

  const { data, error } = await query;
  return { data, error };
};

const getOpportunityById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select("*, companies(id, is_active, description, profiles(name, email))")
    .eq("id", id)
    .single();
  return { data, error };
};

const createOpportunity = async (fields) => {
  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .insert(fields)
    .select()
    .single();
  return { data, error };
};

const updateOpportunity = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
};

const deleteOpportunity = async (id) => {
  const { error } = await supabaseAdmin
    .from("opportunities")
    .delete()
    .eq("id", id);
  return { error };
};

module.exports = {
  getAllOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
};