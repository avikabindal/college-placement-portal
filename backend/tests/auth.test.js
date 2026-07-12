const request = require("supertest");

// Mock Supabase module (must be defined before requiring app/server)
jest.mock("../database/supabase", () => {
  const mockSingle = jest.fn();
  const mockEq = jest.fn(() => ({
    single: mockSingle,
  }));
  const mockSelect = jest.fn(() => ({
    eq: mockEq,
    single: mockSingle,
  }));
  const mockInsert = jest.fn();
  const mockFromChain = jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq,
  }));

  return {
    supabaseAuth: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
      },
      from: mockFromChain,
    },
    supabaseAdmin: {
      auth: {
        getUser: jest.fn(),
        admin: {
          getUser: jest.fn(),
        },
      },
      from: mockFromChain,
    },
  };
});

const app = require("../server");
const { supabaseAuth, supabaseAdmin } = require("../database/supabase");

describe("Auth Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /users/register", () => {
    it("should register a student successfully with a valid @jietjodhpur.ac.in email", async () => {
      supabaseAuth.auth.signUp.mockResolvedValue({
        data: { user: { id: "mock-student-id" } },
        error: null,
      });
      // Mock profiles/students insertion
      supabaseAdmin.from().insert.mockResolvedValue({ error: null });

      const res = await request(app)
        .post("/users/register")
        .send({
          name: "Test Student",
          email: "student@jietjodhpur.ac.in",
          password: "password123",
          role: "student",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("User registered successfully");
      expect(res.body.user.email).toBe("student@jietjodhpur.ac.in");
      expect(supabaseAuth.auth.signUp).toHaveBeenCalledWith({
        email: "student@jietjodhpur.ac.in",
        password: "password123",
        options: {
          data: { name: "Test Student", role: "student" },
        },
      });
    });

    it("should block registration if email does not belong to @jietjodhpur.ac.in domain", async () => {
      const res = await request(app)
        .post("/users/register")
        .send({
          name: "Test External",
          email: "student@gmail.com",
          password: "password123",
          role: "student",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Only accounts with official @jietjodhpur.ac.in");
      expect(supabaseAuth.auth.signUp).not.toHaveBeenCalled();
    });

    it("should block registration if role is invalid (e.g. company self-reg)", async () => {
      const res = await request(app)
        .post("/users/register")
        .send({
          name: "Test Recruiter",
          email: "recruiter@jietjodhpur.ac.in",
          password: "password123",
          role: "company",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Self-registration is only allowed for students and TPOs");
    });
  });

  describe("POST /users/login", () => {
    it("should authenticate successfully and return profile role", async () => {
      supabaseAuth.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "mock-user-id" }, session: { access_token: "mock-token" } },
        error: null,
      });
      // Mock profile fetch
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { role: "student", name: "Test Student", email: "student@jietjodhpur.ac.in" },
        error: null,
      });

      const res = await request(app)
        .post("/users/login")
        .send({
          email: "student@jietjodhpur.ac.in",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("student");
    });

    it("should return 401 for invalid credentials", async () => {
      supabaseAuth.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      const res = await request(app)
        .post("/users/login")
        .send({
          email: "student@jietjodhpur.ac.in",
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password");
    });
  });

  describe("GET /users/me", () => {
    it("should return user profile if authorization header is valid", async () => {
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: "mock-user-id" } },
        error: null,
      });
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { role: "student", name: "Test Student", email: "student@jietjodhpur.ac.in" },
        error: null,
      });

      const res = await request(app)
        .get("/users/me")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("student@jietjodhpur.ac.in");
      expect(res.body.role).toBe("student");
    });

    it("should return 401 if authorization header is missing", async () => {
      const res = await request(app).get("/users/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Missing or invalid Authorization header");
    });
  });
});
