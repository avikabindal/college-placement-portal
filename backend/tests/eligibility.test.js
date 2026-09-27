const { checkStudentEligibility } = require("../utils/eligibility");

describe("Student Eligibility Utility Unit Tests", () => {
  it("should mark student eligible when opportunity has no CGPA or branch requirements", () => {
    const opp = { cgpa_requirement: null, eligible_branches: null };
    const student = { cgpa: 6.5, branch: "Mechanical" };
    const result = checkStudentEligibility(opp, student);
    expect(result.isEligible).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("should fail eligibility if student CGPA is lower than cutoff", () => {
    const opp = { cgpa_requirement: 7.5, eligible_branches: "CSE" };
    const student = { cgpa: 7.2, branch: "CSE" };
    const result = checkStudentEligibility(opp, student);
    expect(result.isEligible).toBe(false);
    expect(result.reason).toContain("below the required cutoff of 7.5");
  });

  it("should pass eligibility if student CGPA equals or exceeds cutoff", () => {
    const opp = { cgpa_requirement: 7.5, eligible_branches: "CSE" };
    const student = { cgpa: 7.5, branch: "Computer Science" };
    const result = checkStudentEligibility(opp, student);
    expect(result.isEligible).toBe(true);
  });

  it("should fail eligibility if student CGPA is missing when required", () => {
    const opp = { cgpa_requirement: 7.0, eligible_branches: null };
    const student = { cgpa: null, branch: "CSE" };
    const result = checkStudentEligibility(opp, student);
    expect(result.isEligible).toBe(false);
    expect(result.reason).toContain("profile lacks CGPA details");
  });

  it("should fail eligibility if student branch does not match eligible branches", () => {
    const opp = { cgpa_requirement: 6.0, eligible_branches: "Computer Science, IT" };
    const student = { cgpa: 8.5, branch: "Civil Engineering" };
    const result = checkStudentEligibility(opp, student);
    expect(result.isEligible).toBe(false);
    expect(result.reason).toContain("branch (Civil Engineering) is not eligible");
  });

  it("should match branch abbreviations and aliases (e.g. CSE vs Computer Science, IT vs Information Technology)", () => {
    const opp = { cgpa_requirement: 6.0, eligible_branches: "CSE, Information Technology" };
    const student1 = { cgpa: 7.0, branch: "Computer Science" };
    const student2 = { cgpa: 7.0, branch: "IT" };
    
    expect(checkStudentEligibility(opp, student1).isEligible).toBe(true);
    expect(checkStudentEligibility(opp, student2).isEligible).toBe(true);
  });

  it("should pass eligibility for all branches if eligible_branches is 'All' or 'Open for All'", () => {
    const opp = { cgpa_requirement: 6.0, eligible_branches: "Open for All Branches" };
    const student = { cgpa: 6.5, branch: "Mechanical" };
    expect(checkStudentEligibility(opp, student).isEligible).toBe(true);
  });
});
