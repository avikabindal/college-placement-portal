import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const isClosingSoon = (deadline) => {
  if (!deadline) return false;
  const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 5;
};

const isNew = (createdAt) => {
  if (!createdAt) return false;
  const diff = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
  return diff <= 3;
};

const cardColors = [
  { bg: "bg-primary-fixed", text: "text-on-primary-fixed" },
  { bg: "bg-secondary-container", text: "text-on-secondary-container" },
  { bg: "bg-tertiary-fixed", text: "text-on-tertiary-fixed-variant" },
  { bg: "bg-primary-fixed-dim", text: "text-primary" },
  { bg: "bg-secondary-fixed", text: "text-on-secondary-fixed-variant" },
  { bg: "bg-surface-container-highest", text: "text-on-surface-variant" },
];

const BrowseOpportunities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(null);
  const [applied, setApplied] = useState(new Set());
  const [coverNote, setCoverNote] = useState("");
  const [showNoteFor, setShowNoteFor] = useState(null);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    api.get("/opportunities")
      .then((res) => {
        const sorted = (res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOpportunities(sorted);
        setFiltered(sorted);
      })
      .catch(() => setError("Failed to load opportunities."))
      .finally(() => setLoading(false));

    if (user?.id) {
      api.get(`/applications/student/${user.id}`)
        .then((res) => {
          const opportunityIds = new Set((res.data || []).map(app => app.opportunity_id));
          setApplied(opportunityIds);
        })
        .catch((err) => console.error("Failed to load applied opportunities:", err));
    }
  }, [user?.id]);

  useEffect(() => {
    let result = opportunities;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.companies?.profiles?.name?.toLowerCase().includes(q) ||
          o.skills_required?.toLowerCase().includes(q)
      );
    }
    if (locationFilter !== "all") {
      result = result.filter((o) =>
        o.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, locationFilter, opportunities]);

  const handleApply = async (opportunityId) => {
    setApplying(opportunityId);
    try {
      await api.post("/applications", {
        opportunity_id: opportunityId,
        cover_note: coverNote,
      });
      setApplied(new Set([...applied, opportunityId]));
      setShowNoteFor(null);
      setCoverNote("");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to apply.";
      if (msg.includes("already applied")) {
        setApplied(new Set([...applied, opportunityId]));
      } else {
        alert(msg);
      }
    } finally {
      setApplying(null);
    }
  };

  const locations = [...new Set(opportunities.map((o) => o.location).filter(Boolean))];
  const closingSoonCount = opportunities.filter((o) => isClosingSoon(o.apply_deadline)).length;

  return (
    <div className="pl-8 pr-6 py-6 max-w-container-max mx-auto flex flex-col gap-8">

      {/* Header + Filters */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-on-surface">Explore Opportunities</h2>
            <p className="text-on-surface-variant mt-1">
              {filtered.length} open role{filtered.length !== 1 ? "s" : ""} available for you
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles, companies, skills..."
                className="pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option value="all">All Locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-primary rounded-xl flex items-center gap-4 shadow-[0px_4px_20px_rgba(0,55,176,0.25)]">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">work</span>
            </div>
            <div>
              <p className="text-xs text-on-primary/70 uppercase tracking-wider font-medium">Open Roles</p>
              <p className="text-2xl font-bold text-on-primary">{opportunities.length}</p>
            </div>
          </div>

          <div className="p-4 bg-secondary rounded-xl flex items-center gap-4 shadow-[0px_4px_20px_rgba(0,108,73,0.25)]">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-on-secondary">
              <span className="material-symbols-outlined">send</span>
            </div>
            <div>
              <p className="text-xs text-on-secondary/70 uppercase tracking-wider font-medium">Applied</p>
              <p className="text-2xl font-bold text-on-secondary">{applied.size}</p>
            </div>
          </div>

          <div className="p-4 bg-error-container rounded-xl flex items-center gap-4 border border-error/20">
            <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-xs text-on-error-container/70 uppercase tracking-wider font-medium">Closing Soon</p>
              <p className="text-2xl font-bold text-on-error-container">{closingSoonCount}</p>
            </div>
          </div>

          <div className="p-4 bg-tertiary-fixed rounded-xl flex items-center gap-4 border border-tertiary/20">
            <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">filter_list</span>
            </div>
            <div>
              <p className="text-xs text-on-tertiary-fixed-variant/70 uppercase tracking-wider font-medium">Showing</p>
              <p className="text-2xl font-bold text-on-tertiary-fixed-variant">{filtered.length}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">{error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-16 h-16 skeleton-loader" />
              <div className="h-6 w-3/4 skeleton-loader" />
              <div className="h-4 w-1/2 skeleton-loader" />
              <div className="h-20 w-full skeleton-loader mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface border border-outline-variant rounded-2xl max-w-lg mx-auto flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">No Opportunities Found</h3>
            <p className="text-on-surface-variant text-xs mt-1 max-w-sm">We couldn't find any job drives matching your criteria. Try adjusting your search query or location filter.</p>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((opp, index) => {
            const companyName = opp.companies?.profiles?.name || "Unknown";
            const isApplied = applied.has(opp.id);
            const showingNote = showNoteFor === opp.id;
            const closing = isClosingSoon(opp.apply_deadline);
            const fresh = isNew(opp.created_at);
            const color = cardColors[index % cardColors.length];

            return (
              <div
                key={opp.id}
                className="bg-surface border border-outline-variant rounded-2xl overflow-hidden flex flex-col hover-lift shadow-sm"
              >
                <div className="p-6 flex flex-col gap-4 flex-grow">
                  {/* Logo + Badge */}
                  <div className="flex justify-between items-start">
                    <div className={`w-16 h-16 rounded-xl ${color.bg} ${color.text} flex items-center justify-center font-bold text-lg border border-outline-variant/30`}>
                      {getInitials(companyName)}
                    </div>
                    {closing ? (
                      <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-bold">
                        Closing Soon
                      </span>
                    ) : fresh ? (
                      <span className="px-3 py-1 bg-secondary-container text-on-secondary-fixed-variant rounded-full text-xs font-bold">
                        New
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-medium">
                        Open
                      </span>
                    )}
                  </div>

                  {/* Title + Company */}
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface leading-snug">{opp.title}</h3>
                    <p className="text-sm text-primary font-medium mt-0.5">{companyName}</p>
                  </div>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-y-3 pt-2 border-t border-outline-variant/30">
                    {opp.location && (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                        <span className="text-xs font-medium">{opp.location}</span>
                      </div>
                    )}
                    {opp.stipend && (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px] text-secondary">payments</span>
                        <span className="text-xs font-medium">{opp.stipend}</span>
                      </div>
                    )}
                    {opp.apply_deadline && (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className={`material-symbols-outlined text-[18px] ${closing ? "text-error" : "text-tertiary"}`}>
                          calendar_today
                        </span>
                        <span className="text-xs font-medium">
                          {new Date(opp.apply_deadline).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {opp.duration && (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px] text-outline">work_history</span>
                        <span className="text-xs font-medium">{opp.duration}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {(opp.cgpa_requirement || opp.eligible_branches || opp.skills_required) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {opp.cgpa_requirement && (
                        <span className="text-xs bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-medium">
                          Min CGPA: {opp.cgpa_requirement}
                        </span>
                      )}
                      {opp.eligible_branches && (
                        <span className="text-xs bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-0.5 rounded-full font-medium">
                          {opp.eligible_branches}
                        </span>
                      )}
                      {opp.skills_required && (
                        <span className="text-xs bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-medium">
                          {opp.skills_required}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Cover Note Form */}
                  {showingNote && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">
                        Cover note (optional)
                      </label>
                      <textarea
                        value={coverNote}
                        onChange={(e) => setCoverNote(e.target.value)}
                        placeholder="Why are you interested in this role?"
                        rows={3}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-low"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApply(opp.id)}
                          disabled={applying === opp.id}
                          className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg disabled:opacity-50 hover:opacity-90"
                        >
                          {applying === opp.id ? "Applying..." : "Submit Application"}
                        </button>
                        <button
                          onClick={() => { setShowNoteFor(null); setCoverNote(""); }}
                          className="px-4 py-2 border border-outline-variant text-on-surface-variant text-sm font-medium rounded-lg hover:bg-surface-container"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                {!showingNote && (
                  <div className="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between gap-4">
                    <button
                      onClick={() => navigate(`/student/opportunities/${opp.id}`)}
                      className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">info</span>
                      View Details
                    </button>
                    {isApplied ? (
                      <span className="px-4 py-2 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-lg flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowNoteFor(opp.id)}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-all hover:opacity-90"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default BrowseOpportunities;