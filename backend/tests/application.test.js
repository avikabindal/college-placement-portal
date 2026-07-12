const request = require("supertest");

// Mock Supabase module (must be defined before requiring app/server)
jest.mock("../database/supabase", () => {
  const mockSingle = jest.fn();
  const mockOrder = jest.fn();
  const mockEq = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();

  const mockFromChain = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  };

  mockSelect.mockReturnValue(mockFromChain);
  mockInsert.mockReturnValue(mockFromChain);
  mockUpdate.mockReturnValue(mockFromChain);
  mockEq.mockReturnValue(mockFromChain);
  mockOrder.mockReturnValue(mockFromChain);

  const mockFrom = jest.fn(() => mockFromChain);

  return {
    supabaseAuth: {
      auth: {
        getUser: jest.fn(),
      },
      from: mockFrom,
    },
    supabaseAdmin: {
      auth: {
        getUser: jest.fn(),
        admin: {
          getUser: jest.fn(),
        },
      },
      from: mockFrom,
    },
  };
});

const app = require("../server");
const { supabaseAdmin } = require("../database/supabase");

describe("Application Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /applications (List Applications for TPO)", () => {
    it("should return 200 and list of applications for a TPO user", async () => {
      // Mock authorization middleware lookup
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: "mock-tpo-id" } },
        error: null,
      });
      // Mock profile check to return role: tpo
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { role: "tpo", name: "TPO Admin", email: "tpo@jietjodhpur.ac.in" },
        error: null,
      });
      // Mock getAllApplications query result
      supabaseAdmin.from().select().order.mockResolvedValueOnce({
        data: [
          { id: "app-1", status: "applied", opportunities: { title: "Software Engineer Dev" } }
        ],
        error: null,
      });

      const res = await request(app)
        .get("/applications")
        .set("Authorization", "Bearer valid-tpo-token");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].id).toBe("app-1");
    });

    it("should return 403 Access Denied if user is a student", async () => {
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: "mock-student-id" } },
        error: null,
      });
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { role: "student", name: "Student User", email: "student@jietjodhpur.ac.in" },
        error: null,
      });

      const res = await request(app)
        .get("/applications")
        .set("Authorization", "Bearer valid-student-token");

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");
    });
  });

  describe("POST /applications (Submit Application)", () => {
    it("should allow a student to apply successfully to an open opportunity", async () => {
      // Mock auth middleware
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: "mock-student-id" } },
        error: null,
      });

      // Queue of 5 .single() resolutions for the success path:
      
      // 1. Auth middleware profile lookup
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { role: "student", name: "Student User", email: "student@jietjodhpur.ac.in" },
        error: null,
      });
      // 2. Check opportunity status
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { status: "open", companies: { is_active: true } },
        error: null,
      });
      // 3. Fetch student's current resume
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { resume_url: "https://drive.google.com/file/d/cv/view" },
        error: null,
      });
      // 4. Create application insert statement
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { id: "new-app-id", status: "applied", student_id: "mock-student-id" },
        error: null,
      });
      // 5. Fetch opportunity detail query (inside apply, line 51)
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { title: "Software Engineer", companies: { profiles: { name: "Test Corp" } } },
        error: null,
      });

      // 6. Mock notification insertion (inside createNotification helper)
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { id: "notif-id", title: "Application Submitted" },
        error: null,
      });

      const res = await request(app)
        .post("/applications")
        .set("Authorization", "Bearer student-token")
        .send({
          opportunity_id: "open-opp-id",
          cover_note: "I am interested",
        });

      expect(res.status).toBe(201);
    });

    it("should return 400 if opportunity is closed", async () => {
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: "mock-student-id" } },
        error: null,
      });
      
      // 1. Auth middleware profile lookup
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { role: "student", name: "Student User", email: "student@jietjodhpur.ac.in" },
        error: null,
      });

      // 2. Mock opportunity query returning status: closed
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { status: "closed", companies: { is_active: true } },
        error: null,
      });

      const res = await request(app)
        .post("/applications")
        .set("Authorization", "Bearer student-token")
        .send({
          opportunity_id: "closed-opp-id",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("This opportunity is not open for applications");
    });
  });

  describe("PUT /applications/:id/status (Update status)", () => {
    it("should allow a Company Recruiter to update the application pipeline status", async () => {
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: "mock-recruiter-id" } },
        error: null,
      });
      
      // Queue of 6 .single() resolutions for the status update success path:

      // 1. Auth middleware profile lookup
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { role: "company", name: "Recruiter User", email: "recruiter@company.com" },
        error: null,
      });
      // 2. Fetch application details to check authorization (getApplicationById)
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { id: "app-id", student_id: "student-1", opportunity_id: "opp-1" },
        error: null,
      });
      // 3. Fetch opportunity owner check
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { company_id: "mock-recruiter-id" },
        error: null,
      });
      // 4. Perform the update application status query
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { id: "app-id", status: "shortlisted" },
        error: null,
      });
      // 5. Fetch application details for student notification
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { student_id: "student-1", opportunities: { title: "Software Engineer", companies: { profiles: { name: "Test Corp" } } } },
        error: null,
      });
      // 6. Mock notification insert
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { id: "notif-id", title: "Application Update" },
        error: null,
      });

      const res = await request(app)
        .put("/applications/app-id/status")
        .set("Authorization", "Bearer recruiter-token")
        .send({
          status: "shortlisted",
          remarks: "Excellent portfolio",
        });

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe("shortlisted");
    });
  });
});
