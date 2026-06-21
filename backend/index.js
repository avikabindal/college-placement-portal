const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------
// Supabase client (server-side, uses service_role key — full
// trust, bypasses Row Level Security, since the Express server
// itself is the trusted layer here, not the browser).
// ------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ------------------------------------------------------------
// TEMP: until auth middleware is wired up (Day 6 continued / Auth task),
// every request is treated as this one hardcoded user so you can keep
// testing CRUD end-to-end. Replace this with the real authenticated
// user's id (from the verified JWT) once login is implemented.
// ------------------------------------------------------------
const TEMP_USER_ID = process.env.TEMP_USER_ID; // paste a real auth.users UUID here in .env

/* HEALTH CHECK */
app.get("/", (req, res) => {
  res.send("API running");
});

/* CREATE APPLICATION */
app.post("/applications", async (req, res) => {
  const { companyName, role, status, location, jobLink, stipend, notes, appliedDate } = req.body;

  if (!companyName || !role) {
    return res.status(400).json({ error: "companyName and role are required" });
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: TEMP_USER_ID,
      company_name: companyName,
      role_title: role,
      status: (status || "applied").toLowerCase(),
      location: location || null,
      job_link: jobLink || null,
      stipend: stipend || null,
      notes: notes || null,
      applied_date: appliedDate || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

/* GET ALL (supports ?status=interview and ?search=zeta) */
app.get("/applications", async (req, res) => {
  const { status, search } = req.query;

  let query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", TEMP_USER_ID)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status.toLowerCase());
  }
  if (search) {
    query = query.or(`company_name.ilike.%${search}%,role_title.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/* GET ONE (+ status history, for Application Details screen) */
app.get("/applications/:id", async (req, res) => {
  const { id } = req.params;

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", TEMP_USER_ID)
    .single();

  if (appError || !application) {
    return res.status(404).json({ error: "Application not found" });
  }

  const { data: history, error: historyError } = await supabase
    .from("status_history")
    .select("*")
    .eq("application_id", id)
    .order("changed_at", { ascending: true });

  if (historyError) {
    console.error(historyError);
    return res.status(500).json({ error: historyError.message });
  }

  res.json({ ...application, history });
});

/* UPDATE (status or any other field) */
app.put("/applications/:id", async (req, res) => {
  const { id } = req.params;
  const { companyName, role, status, location, jobLink, stipend, notes, appliedDate } = req.body;

  const updates = {};
  if (companyName !== undefined) updates.company_name = companyName;
  if (role !== undefined) updates.role_title = role;
  if (status !== undefined) updates.status = status.toLowerCase();
  if (location !== undefined) updates.location = location;
  if (jobLink !== undefined) updates.job_link = jobLink;
  if (stipend !== undefined) updates.stipend = stipend;
  if (notes !== undefined) updates.notes = notes;
  if (appliedDate !== undefined) updates.applied_date = appliedDate;

  const { data, error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", TEMP_USER_ID)
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "Application not found" });
  }

  res.json({ message: "Updated successfully", application: data });
});

/* DELETE */
app.delete("/applications/:id", async (req, res) => {
  const { id } = req.params;

  const { error, count } = await supabase
    .from("applications")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", TEMP_USER_ID);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
  if (count === 0) {
    return res.status(404).json({ error: "Application not found" });
  }

  res.json({ message: "Deleted successfully" });
});

/* DASHBOARD STATS */
app.get("/dashboard/stats", async (req, res) => {
  const { data, error } = await supabase
    .from("applications")
    .select("status")
    .eq("user_id", TEMP_USER_ID);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  const stats = {
    total: data.length,
    applied: data.filter((a) => a.status === "applied").length,
    interview: data.filter((a) => a.status === "interview").length,
    selected: data.filter((a) => a.status === "selected").length,
    rejected: data.filter((a) => a.status === "rejected").length,
  };

  res.json(stats);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});