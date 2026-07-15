const { supabaseAdmin } = require("../database/supabase");
const { createAuditLog } = require("../models/audit.model");
const { createNotification } = require("./notification.controller");
const {
  getAllOpportunities, getOpportunityById,
  createOpportunity, updateOpportunity, deleteOpportunity,
} = require("../models/opportunity.model");

const listOpportunities = async (req, res) => {
  const filters = {};
  if (req.user.role === "student") filters.status = "open";
  if (req.user.role === "company") filters.company_id = req.user.id;

  const { data, error } = await getAllOpportunities(filters);
  if (error) return res.status(500).json({ error: error.message });

  // Filter out opportunities from inactive companies if student is requesting
  let filteredData = data;
  if (req.user.role === "student") {
    filteredData = data.filter(opp => opp.companies && opp.companies.is_active !== false);
  }

  res.json(filteredData);
};

const createOpp = async (req, res) => {
  const {
    company_id, title, description, location, stipend,
    duration, apply_deadline, cgpa_requirement, eligible_branches, skills_required,
  } = req.body;

  // Enforce company role constraints
  let finalCompanyId = company_id;
  let finalStatus = "open"; // Default for TPO

  if (req.user.role === "company") {
    finalCompanyId = req.user.id;
    finalStatus = "pending";
  } else {
    if (!company_id || !title) {
      return res.status(400).json({ error: "company_id and title are required" });
    }
  }

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const { data, error } = await createOpportunity({
    company_id: finalCompanyId, posted_by: req.user.id, title, description,
    location, stipend, duration, apply_deadline,
    cgpa_requirement, eligible_branches, skills_required, status: finalStatus,
  });
  if (error) return res.status(500).json({ error: error.message });

  if (data && finalStatus === "pending") {
    try {
      // Find all TPO users to notify
      const { data: tpos } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", "tpo");

      if (tpos && tpos.length > 0) {
        // Fetch company name from profiles
        const { data: compProfile } = await supabaseAdmin
          .from("profiles")
          .select("name")
          .eq("id", finalCompanyId)
          .single();

        const companyName = compProfile?.name || "A partner company";
        const titleMsg = "New Pending Drive";
        const bodyMsg = `"${companyName}" has created a new job posting "${title}" that requires your approval.`;

        for (const tpo of tpos) {
          await createNotification(tpo.id, titleMsg, bodyMsg);
        }
      }
    } catch (err) {
      console.error("Failed to notify TPO of new pending opportunity:", err);
    }
  }

  if (data && req.user.role === "tpo") {
    // Get company name
    const { data: compProfile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", finalCompanyId)
      .single();
    const companyName = compProfile?.name || "Company";

    await createAuditLog(
      req.user.id,
      req.user.id,
      "create_opportunity",
      `Created placement drive "${title}" for "${companyName}"`
    );
  }

  res.status(201).json(data);
};

const getOpp = async (req, res) => {
  const { data, error } = await getOpportunityById(req.params.id);
  if (error || !data) return res.status(404).json({ error: "Opportunity not found" });

  if (req.user.role === "student" && data.companies && data.companies.is_active === false) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  if (req.user.role === "company" && data.company_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }
  res.json(data);
};

const updateOpp = async (req, res) => {
  const {
    title, description, location, stipend, duration,
    apply_deadline, cgpa_requirement, eligible_branches, skills_required, status,
  } = req.body;

  const { data: opp, error: getError } = await getOpportunityById(req.params.id);
  if (getError || !opp) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (location !== undefined) updates.location = location;
  if (stipend !== undefined) updates.stipend = stipend;
  if (duration !== undefined) updates.duration = duration;
  if (apply_deadline !== undefined) updates.apply_deadline = apply_deadline;
  if (cgpa_requirement !== undefined) updates.cgpa_requirement = cgpa_requirement;
  if (eligible_branches !== undefined) updates.eligible_branches = eligible_branches;
  if (skills_required !== undefined) updates.skills_required = skills_required;

  if (req.user.role === "company") {
    if (opp.company_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only update your own opportunities." });
    }
    if (opp.status !== "pending") {
      return res.status(403).json({ error: "Access denied. Approved opportunities cannot be modified by companies." });
    }
    updates.status = "pending"; // Force status to remain pending
  } else {
    if (status !== undefined) updates.status = status;
  }

  const { data, error } = await updateOpportunity(req.params.id, updates);
  if (error) return res.status(500).json({ error: error.message });

  if (data && req.user.role === "tpo" && status === "open" && opp.status === "pending") {
    try {
      await createNotification(
        opp.company_id,
        "Placement Drive Approved",
        `Your job posting "${data.title}" has been approved by the TPO and is now open for students to apply.`
      );
    } catch (err) {
      console.error("Failed to notify company of drive approval:", err);
    }
  }

  if (data && req.user.role === "tpo") {
    if (status === "open" && opp.status === "pending") {
      await createAuditLog(
        req.user.id,
        req.user.id,
        "approve_opportunity",
        `Approved placement drive "${data.title}"`
      );
    } else {
      await createAuditLog(
        req.user.id,
        req.user.id,
        "update_opportunity",
        `Updated placement drive details for "${data.title}"`
      );
    }
  }

  res.json(data);
};

const deleteOpp = async (req, res) => {
  const { data: opp, error: getError } = await getOpportunityById(req.params.id);
  if (getError || !opp) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  if (req.user.role === "company") {
    if (opp.company_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only delete your own opportunities." });
    }
    if (opp.status !== "pending") {
      return res.status(403).json({ error: "Access denied. Published/approved opportunities can only be deleted by TPO administrators." });
    }
  }

  const { error } = await deleteOpportunity(req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  if (req.user.role === "tpo") {
    await createAuditLog(
      req.user.id,
      req.user.id,
      "delete_opportunity",
      `Deleted placement drive "${opp.title}"`
    );
  }

  res.json({ message: "Opportunity deleted successfully" });
};

module.exports = { listOpportunities, createOpp, getOpp, updateOpp, deleteOpp };