const { supabaseAdmin } = require("../database/supabase");
const {
  getAllApplications, getApplicationsByStudent, getApplicationsByOpportunity,
  createApplication, updateApplicationStatus, getApplicationById,
} = require("../models/application.model");
const { createNotification } = require("./notification.controller");

const listApplications = async (req, res) => {
  const { data, error } = await getAllApplications();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const apply = async (req, res) => {
  try {
    const { opportunity_id, cover_note, resume_url } = req.body;
    if (!opportunity_id) return res.status(400).json({ error: "opportunity_id is required" });

    const { data: opp } = await supabaseAdmin
      .from("opportunities")
      .select("status, companies(is_active)")
      .eq("id", opportunity_id)
      .single();

    if (!opp || opp.status !== "open" || opp.companies?.is_active === false) {
      return res.status(400).json({ error: "This opportunity is not open for applications" });
    }

    // Fetch student's current resume_url from profile as fallback
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("resume_url")
      .eq("id", req.user.id)
      .single();

    const finalResumeUrl = resume_url || student?.resume_url || null;

    const { data, error } = await createApplication({
      opportunity_id, student_id: req.user.id, cover_note, resume_url: finalResumeUrl,
    });

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "You have already applied for this opportunity" });
      }
      return res.status(500).json({ error: error.message });
    }

    // Create success notification for the student
    if (data) {
      try {
        const { data: oppDetail } = await supabaseAdmin
          .from("opportunities")
          .select("title, companies(profiles(name))")
          .eq("id", opportunity_id)
          .single();
        
        const compName = oppDetail?.companies?.profiles?.name || "Partner Company";
        const oppTitle = oppDetail?.title || "Role";

        await createNotification(
          req.user.id,
          "Application Submitted",
          `You have successfully applied for the position of "${oppTitle}" at "${compName}".`
        );
      } catch (err) {
        console.error("Failed to send application confirmation notification:", err);
      }
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("CRITICAL ERROR IN APPLY CONTROLLER:", err);
    res.status(500).json({ error: err.message });
  }
};

const getStudentApplications = async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === "student" && req.user.id !== studentId) {
    return res.status(403).json({ error: "Access denied" });
  }
  if (req.user.role === "company") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { data, error } = await getApplicationsByStudent(studentId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const getOpportunityApplications = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === "company") {
    const { data: opp } = await supabaseAdmin
      .from("opportunities").select("company_id").eq("id", id).single();
    if (!opp || opp.company_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
  }

  const { data, error } = await getApplicationsByOpportunity(id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, remarks, scheduled_date, event_details } = req.body;
  if (!status) return res.status(400).json({ error: "status is required" });

  const validStatuses = [
    "applied", "under_review", "shared_with_company",
    "shortlisted", "assessment", "interview", "selected", "rejected"
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  // TPO cannot change status
  if (req.user.role === "tpo") {
    return res.status(403).json({ error: "TPO accounts can only view application status, not modify it." });
  }

  // Company validation
  if (req.user.role === "company") {
    const { data: app } = await getApplicationById(id);
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }
    const { data: opp } = await supabaseAdmin
      .from("opportunities")
      .select("company_id")
      .eq("id", app.opportunity_id)
      .single();
      
    if (!opp || opp.company_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only update status for your own opportunities." });
    }
  } else {
    // Students or others cannot update status
    return res.status(403).json({ error: "Access denied" });
  }

  const { data, error } = await updateApplicationStatus(id, status, remarks, scheduled_date, event_details);
  if (error) return res.status(500).json({ error: error.message });

  // Trigger notification for the student
  if (data) {
    try {
      const { data: appDetail } = await supabaseAdmin
        .from("applications")
        .select("student_id, opportunities(title, companies(profiles(name)))")
        .eq("id", id)
        .single();

      if (appDetail) {
        const studentId = appDetail.student_id;
        const compName = appDetail.opportunities?.companies?.profiles?.name || "Company";
        const oppTitle = appDetail.opportunities?.title || "Role";

        let title = "Application Update";
        let message = `Your application for "${oppTitle}" at "${compName}" has been updated to "${status.replace(/_/g, " ")}".`;

        if (status === "assessment") {
          title = "Assessment Scheduled";
          message = `An online assessment has been scheduled for your application for "${oppTitle}" at "${compName}".`;
          if (scheduled_date) {
            message += ` Date: ${new Date(scheduled_date).toLocaleString("en-IN")}.`;
          }
          if (event_details) {
            message += ` Details: ${event_details}`;
          }
        } else if (status === "interview") {
          title = "Interview Scheduled";
          message = `An interview has been scheduled for your application for "${oppTitle}" at "${compName}".`;
          if (scheduled_date) {
            message += ` Date: ${new Date(scheduled_date).toLocaleString("en-IN")}.`;
          }
          if (event_details) {
            message += ` Details: ${event_details}`;
          }
        } else if (status === "selected") {
          title = "Offer Extended 🎉";
          message = `Congratulations! You have been selected for the "${oppTitle}" position at "${compName}". Please check your pipeline for details.`;
        } else if (status === "rejected") {
          title = "Application Update";
          message = `Thank you for your interest. Unfortunately, your application for "${oppTitle}" at "${compName}" was not selected to proceed further.`;
        }

        await createNotification(studentId, title, message);
      }
    } catch (err) {
      console.error("Failed to send status update notification:", err);
    }
  }

  res.json({ message: "Status updated successfully", application: data });
};

const deleteApp = async (req, res) => {
  const { id } = req.params;
  const { data: app, error: getError } = await getApplicationById(id);
  if (getError || !app) return res.status(404).json({ error: "Application not found" });

  if (req.user.role === "student" && app.student_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  const { error } = await supabaseAdmin
    .from("applications")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Application withdrawn successfully" });
};

module.exports = { listApplications, apply, getStudentApplications, getOpportunityApplications, updateStatus, deleteApp };