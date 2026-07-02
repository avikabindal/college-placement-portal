import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    api.get(`/opportunities/${id}`)
      .then((res) => setOpp(res.data))
      .catch(() => setError("Failed to load opportunity."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post("/applications", {
        opportunity_id: id,
        cover_note: coverNote,
      });
      setApplied(true);
      setShowNoteForm(false);
      setCoverNote("");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to apply.";
      if (msg.includes("already applied")) {
        setApplied(true);
      } else {
        alert(msg);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="pl-8 pr-6 py-6 max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-surface-container rounded w-64" />
        <div className="h-4 bg-surface-container rounded w-40" />
        <div className="h-48 bg-surface-container rounded-2xl" />
        <div className="h-32 bg-surface-container rounded-2xl" />
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="pl-8 pr-6 py-6 max-w-3xl mx-auto">
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm">{error || "Opportunity not found."}</div>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary font-semibold hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Opportunities
        </button>
      </div>
    );
  }

  const companyName = opp.companies?.profiles?.name || "Unknown Company";
  const isOpen = opp.status === "open";

  return (
    <div className="pl-8 pr-6 py-6 max-w-3xl mx-auto space-y-6">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors font-medium"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Opportunities
      </button>

      {/* Hero Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
        {/* Coloured top strip */}
        <div className="h-2 bg-primary w-full" />

        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              {/* Company Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-2xl border border-outline-variant/30 flex-shrink-0">
                {companyName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-on-surface leading-tight">{opp.title}</h1>
                <p className="text-primary font-semibold mt-1">{companyName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isOpen
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container text-on-surface-variant"
                  }`}>
                    {isOpen ? "Open" : "Closed"}
                  </span>
                  {opp.duration && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-fixed text-on-primary-fixed">
                      {opp.duration}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            {isOpen && (
              <div className="flex-shrink-0">
                {applied ? (
                  <span className="px-5 py-2.5 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Applied
                  </span>
                ) : (
                  <button
                    onClick={() => setShowNoteForm(!showNoteForm)}
                    className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-[0px_4px_20px_rgba(0,55,176,0.3)]"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cover Note Form */}
          {showNoteForm && !applied && (
            <div className="mt-6 p-5 bg-surface-container-low rounded-xl border border-outline-variant">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">
                Cover note <span className="text-on-surface-variant/60">(optional)</span>
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Why are you interested in this role?"
                rows={4}
                className="w-full px-4 py-3 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-6 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
                <button
                  onClick={() => { setShowNoteForm(false); setCoverNote(""); }}
                  className="px-6 py-2.5 border border-outline-variant text-on-surface-variant text-sm font-medium rounded-lg hover:bg-surface-container"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meta Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "location_on", label: "Location", value: opp.location, color: "text-primary", bg: "bg-primary-fixed" },
          { icon: "payments", label: "Stipend / CTC", value: opp.stipend, color: "text-secondary", bg: "bg-secondary-container" },
          { icon: "calendar_today", label: "Deadline", value: opp.apply_deadline ? new Date(opp.apply_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null, color: "text-tertiary", bg: "bg-tertiary-fixed" },
          { icon: "school", label: "Min CGPA", value: opp.cgpa_requirement, color: "text-primary", bg: "bg-primary-fixed-dim" },
        ].filter((m) => m.value).map((meta) => (
          <div key={meta.label} className="glass-card rounded-xl p-4 flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center ${meta.color}`}>
              <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{meta.label}</p>
            <p className="font-semibold text-on-surface text-sm">{meta.value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {opp.description && (
        <div className="glass-card rounded-2xl p-6 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary">description</span>
            <h2 className="font-semibold text-on-surface text-lg">About the Role</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{opp.description}</p>
        </div>
      )}

      {/* Eligibility */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-secondary">assignment_turned_in</span>
          <h2 className="font-semibold text-on-surface text-lg">Eligibility</h2>
        </div>
        <div className="space-y-3">
          {opp.eligible_branches && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">school</span>
              <div>
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Eligible Branches</p>
                <p className="text-sm text-on-surface mt-0.5">{opp.eligible_branches}</p>
              </div>
            </div>
          )}
          {opp.skills_required && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">code</span>
              <div>
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Skills Required</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {opp.skills_required.split(",").map((skill, i) => (
                    <span key={i} className="text-xs bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-medium">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {opp.cgpa_requirement && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">grade</span>
              <div>
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Minimum CGPA</p>
                <p className="text-sm text-on-surface mt-0.5">{opp.cgpa_requirement}</p>
              </div>
            </div>
          )}
          {!opp.eligible_branches && !opp.skills_required && !opp.cgpa_requirement && (
            <p className="text-sm text-on-surface-variant">No specific eligibility criteria listed.</p>
          )}
        </div>
      </div>

      {/* Bottom Apply CTA */}
      {isOpen && !applied && (
        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-on-surface">Ready to apply?</p>
            <p className="text-sm text-on-surface-variant">Submit your application for {opp.title}</p>
          </div>
          <button
            onClick={() => { setShowNoteForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-[0px_4px_20px_rgba(0,55,176,0.3)]"
          >
            Apply Now
          </button>
        </div>
      )}

      {applied && (
        <div className="p-5 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="font-semibold">Application submitted!</p>
            <p className="text-sm opacity-80">You can track its status in My Applications.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityDetail;