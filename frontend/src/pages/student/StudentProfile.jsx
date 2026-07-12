import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";

const BRANCHES = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
];

const getInitials = (name) => {
  if (!name) return "S";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const skillInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    branch: "",
    graduation_year: "",
    cgpa: "",
    phone: "",
    skills: [],
    resume_url: "",
    linkedin_url: "",
    registration_year: "",
  });
  const [originalForm, setOriginalForm] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [meRes, studentRes] = await Promise.all([
          api.get("/users/me"),
          api.get("/students/profile"),
        ]);
        const me = meRes.data;
        const s = studentRes.data;
        setProfile(me);
        setStudent(s);

        const skillsArr = s?.skills
          ? typeof s.skills === "string"
            ? s.skills.split(",").map((sk) => sk.trim()).filter(Boolean)
            : Array.isArray(s.skills) ? s.skills : []
          : [];

        const formData = {
          name: me?.name || "",
          branch: s?.branch || "",
          graduation_year: s?.graduation_year || "",
          cgpa: s?.cgpa || "",
          phone: s?.phone || "",
          skills: skillsArr,
          resume_url: s?.resume_url || "",
          linkedin_url: s?.linkedin_url || "",
          registration_year: s?.registration_year || "",
        };
        setForm(formData);
        setOriginalForm(formData);
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const skill = skillInput.trim().replace(/,$/, "");
      if (skill && !form.skills.includes(skill)) {
        setForm({ ...form, skills: [...form.skills, skill] });
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleDiscard = () => {
    if (originalForm) {
      setForm(originalForm);
      setSkillInput("");
      setError("");
      setSuccess("");
    }
  };

  const completionFields = ["name", "branch", "graduation_year", "cgpa", "phone", "resume_url", "linkedin_url", "registration_year"];
  const completionScore = Math.round(
    ((completionFields.filter((f) => form[f]).length + (form.skills.length > 0 ? 1 : 0)) /
      (completionFields.length + 1)) * 100
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // Update name via /users/profile
      await api.put("/users/profile", {
        name: form.name,
        email: profile?.email,
      });

      // Update student profile
      const studentPayload = {
        branch: form.branch,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
        phone: form.phone,
        skills: form.skills.join(", "),
        resume_url: form.resume_url,
        linkedin_url: form.linkedin_url,
        registration_year: form.registration_year ? parseInt(form.registration_year) : null,
      };

      if (student) {
        await api.put("/students/profile", studentPayload);
      } else {
        await api.post("/students/profile", studentPayload);
      }

      setOriginalForm(form);
      setSuccess("Profile saved successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 h-64 bg-gray-200 rounded-xl" />
          <div className="col-span-8 h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        {/* Left Sidebar */}
        <div className="lg:col-span-4 space-y-4">

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-secondary-container/20" />
            <div className="relative pt-10 pb-6 flex flex-col items-center text-center px-6">
              <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg bg-secondary-container flex items-center justify-center text-3xl font-bold text-on-secondary relative z-10">
                {getInitials(form.name || profile?.name)}
              </div>
              <h1 className="text-xl font-bold text-on-surface mt-3">{form.name || profile?.name || "Your Name"}</h1>
              <p className="text-sm text-on-surface-variant">{form.branch || "Add your branch"}</p>

              <div className="mt-4 w-full grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-low rounded-lg text-left">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">CGPA</span>
                  <span className="font-bold text-xl text-on-surface">{form.cgpa || "—"}</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg text-left">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">BATCH</span>
                  <span className="font-bold text-xl text-on-surface">{form.graduation_year || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Profile Completion</h3>
              <span className="text-sm font-bold text-secondary">{completionScore}%</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full mb-3">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <p className="text-xs text-on-surface-variant">
              {completionScore === 100
                ? "🎉 Profile complete! You're visible to all recruiters."
                : completionScore >= 75
                ? "Almost there! Add missing details to boost recruiter visibility."
                : "Complete your profile to improve your chances with recruiters."}
            </p>

            {/* Missing fields hint */}
            {completionScore < 100 && (
              <ul className="mt-3 space-y-1">
                {!form.phone && <li className="text-xs text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-sm text-error">radio_button_unchecked</span> Add phone number</li>}
                {!form.resume_url && <li className="text-xs text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-sm text-error">radio_button_unchecked</span> Add resume link</li>}
                {form.skills.length === 0 && <li className="text-xs text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-sm text-error">radio_button_unchecked</span> Add skills</li>}
                {!form.cgpa && <li className="text-xs text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-sm text-error">radio_button_unchecked</span> Add CGPA</li>}
              </ul>
            )}
          </div>

          {/* Skills Preview */}
          {form.skills.length > 0 && (
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {form.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-secondary-container/10 border border-secondary/20 text-secondary text-xs font-medium rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-on-surface">Student Profile</h2>
                <p className="text-on-surface-variant text-sm mt-1">Keep your details updated to get the best job matches.</p>
              </div>
              <span className="hidden md:block material-symbols-outlined text-secondary text-4xl opacity-20">account_circle</span>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span> {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Personal Info */}
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Personal Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                    <input
                      type="text" name="name" value={form.name} onChange={handleChange}
                      placeholder="Enter your full name"
                      className="px-4 py-2.5 rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Branch</label>
                    <select
                      name="branch" value={form.branch} onChange={handleChange}
                      className="px-4 py-2.5 rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                    >
                      <option value="">Select branch...</option>
                      {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Academic Details</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Registration Year</label>
                    <input
                      type="number" name="registration_year" value={form.registration_year} onChange={handleChange}
                      placeholder="e.g. 2022"
                      className="px-4 py-2.5 rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Graduation Year</label>
                    <input
                      type="number" name="graduation_year" value={form.graduation_year} onChange={handleChange}
                      placeholder="e.g. 2026"
                      className="px-4 py-2.5 rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Current CGPA</label>
                    <input
                      type="text" name="cgpa" value={form.cgpa} onChange={handleChange}
                      placeholder="e.g. 8.5"
                      className="px-4 py-2.5 rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Contact & Social Profiles</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">+91</span>
                      <input
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="Mobile number"
                        className="pl-12 pr-4 py-2.5 w-full rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">University Email</label>
                    <input
                      type="email" value={profile?.email || ""} disabled
                      className="px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container text-sm text-on-surface-variant cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">LinkedIn Profile Link</label>
                    <input
                      type="url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className="px-4 py-2.5 rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Technical Skills</label>
                <div
                  className="min-h-[80px] p-3 rounded-lg border border-outline-variant bg-surface-bright flex flex-wrap gap-2 items-start cursor-text"
                  onClick={() => skillInputRef.current?.focus()}
                >
                  {form.skills.map((skill) => (
                    <div key={skill} className="flex items-center gap-1 bg-secondary-container/10 border border-secondary/20 px-3 py-1 rounded-full group">
                      <span className="text-sm text-secondary font-medium">{skill}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
                        className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error transition-colors"
                      >
                        close
                      </button>
                    </div>
                  ))}
                  <input
                    ref={skillInputRef}
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder={form.skills.length === 0 ? "Add skills..." : ""}
                    className="bg-transparent border-none focus:ring-0 text-sm flex-1 min-w-[120px] py-1 outline-none"
                  />
                </div>
                <p className="text-xs text-on-surface-variant italic">Type a skill and press Enter (e.g., Java, AWS, Figma)</p>
              </div>

              {/* Resume URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Resume Link</label>
                <div className="flex gap-3">
                  <input
                    type="url" name="resume_url" value={form.resume_url} onChange={handleChange}
                    placeholder="https://drive.google.com/your-resume"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant focus:border-secondary bg-surface-bright text-sm transition-colors"
                  />
                  {form.resume_url && (
                    <a
                      href={form.resume_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      View
                    </a>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant">Paste a Google Drive, Notion, or any public PDF link</p>
              </div>

              {/* Actions */}
              <div className="pt-5 border-t border-outline-variant flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button" onClick={handleDiscard}
                  className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-high transition-all active:scale-95"
                >
                  Discard Changes
                </button>
                <button
                  type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-secondary text-white text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><span className="material-symbols-outlined text-base animate-spin">refresh</span> Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">save</span> Save Profile</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}