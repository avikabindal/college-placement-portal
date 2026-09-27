/**
 * Evaluates whether a student meets the eligibility requirements for an opportunity.
 * @param {Object} opp - Opportunity record with cgpa_requirement, eligible_branches
 * @param {Object} student - Student profile record with cgpa, branch
 * @returns {Object} { isEligible: boolean, reason: string | null }
 */
const checkStudentEligibility = (opp, student) => {
  if (!opp) return { isEligible: false, reason: "Opportunity not found" };
  if (!student) {
    // If student profile record doesn't exist yet
    if ((opp.cgpa_requirement != null && parseFloat(opp.cgpa_requirement) > 0) || (opp.eligible_branches && opp.eligible_branches.trim())) {
      return {
        isEligible: false,
        reason: "Student profile information is missing. Please complete your profile.",
      };
    }
    return { isEligible: true, reason: null };
  }

  // 1. CGPA Cutoff Check
  if (opp.cgpa_requirement != null && opp.cgpa_requirement !== "") {
    const reqCgpa = parseFloat(opp.cgpa_requirement);
    if (!isNaN(reqCgpa) && reqCgpa > 0) {
      const studentCgpa = student.cgpa != null && student.cgpa !== "" ? parseFloat(student.cgpa) : null;

      if (studentCgpa == null || isNaN(studentCgpa)) {
        return {
          isEligible: false,
          reason: `Minimum CGPA requirement is ${reqCgpa}, but your profile lacks CGPA details.`,
        };
      }

      if (studentCgpa < reqCgpa) {
        return {
          isEligible: false,
          reason: `Your CGPA (${studentCgpa.toFixed(2)}) is below the required cutoff of ${reqCgpa}.`,
        };
      }
    }
  }

  // 2. Branch Requirement Check
  if (opp.eligible_branches && typeof opp.eligible_branches === "string" && opp.eligible_branches.trim()) {
    const rawEligible = opp.eligible_branches.trim();
    const isAllBranches = ["all", "any", "open for all", "all branches"].some(
      (keyword) => rawEligible.toLowerCase().includes(keyword)
    );

    if (!isAllBranches) {
      const studentBranch = student.branch ? student.branch.trim() : "";
      if (!studentBranch) {
        return {
          isEligible: false,
          reason: `Eligible branches: ${opp.eligible_branches}, but your profile branch is not set.`,
        };
      }

      const branchTokens = rawEligible
        .toLowerCase()
        .split(/[,/|]/)
        .map((b) => b.trim())
        .filter(Boolean);

      const normStudentBranch = studentBranch.toLowerCase();

      const aliases = {
        cse: ["computer science", "cs", "computer engineering", "cse"],
        "computer science": ["cse", "cs", "computer science"],
        it: ["information technology", "it"],
        "information technology": ["it", "information technology"],
        ece: ["electronics", "electronics and communication", "ece"],
        electronics: ["ece", "electronics"],
        ee: ["electrical", "eee", "ee"],
        electrical: ["ee", "eee", "electrical"],
        me: ["mechanical", "me"],
        mechanical: ["me", "mechanical"],
        ce: ["civil", "ce"],
        civil: ["ce", "civil"],
      };

      const studentAliases = aliases[normStudentBranch] || [normStudentBranch];

      const isMatch = branchTokens.some((token) => {
        if (normStudentBranch.includes(token) || token.includes(normStudentBranch)) {
          return true;
        }

        const tokenAliases = aliases[token] || [token];
        return studentAliases.some((sAlias) =>
          tokenAliases.some((tAlias) => sAlias === tAlias || sAlias.includes(tAlias) || tAlias.includes(sAlias))
        );
      });

      if (!isMatch) {
        return {
          isEligible: false,
          reason: `Your branch (${studentBranch}) is not eligible. Required branch: ${opp.eligible_branches}.`,
        };
      }
    }
  }

  return { isEligible: true, reason: null };
};

module.exports = { checkStudentEligibility };
