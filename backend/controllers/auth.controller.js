const { supabaseAdmin, supabaseAuth } = require("../database/supabase");
const { getProfileById } = require("../models/profile.model");

const register = async (req, res) => {
  try {
    console.log("Register hit, body:", req.body);
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "name, email, password, and role are required" });
    }
    if (!["student", "tpo"].includes(role)) {
      return res.status(400).json({ error: "Self-registration is only allowed for students and TPOs." });
    }
    if (!email.toLowerCase().endsWith("@jietjodhpur.ac.in")) {
      return res.status(400).json({ error: "Only accounts with official @jietjodhpur.ac.in email addresses are allowed to register." });
    }
    if (role === "tpo") {
      const tpoKey = req.body.tpo_key || req.headers["x-tpo-key"];
      const expectedKey = process.env.TPO_REGISTRATION_KEY;
      if (!expectedKey || tpoKey !== expectedKey) {
        return res.status(403).json({ error: "Unauthorized: TPO registration key is invalid or missing." });
      }
    }

    console.log("Calling Supabase signUp Client API");
    const { data, error: signUpError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (signUpError) {
      console.log("SignUp API returned error:", signUpError);
      return res.status(400).json({ error: signUpError.message || "Registration failed" });
    }

    console.log("SignUp successful, inserting profile for user ID:", data.user?.id);

    if (role === "student") {
      const { error: insertError } = await supabaseAdmin.from("students").insert({ id: data.user.id });
      if (insertError) {
        console.log("Error inserting student record:", insertError);
      }
    }

    res.status(201).json({
      message: "User registered successfully",
      user: { id: data.user.id, email, name, role },
    });
  } catch (error) {
    console.error("Critical error in register controller:", error);
    res.status(500).json({ error: "An internal server error occurred during registration." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: "Invalid email or password" });

  const { data: profile } = await getProfileById(data.user.id);

  if (profile?.role === "company") {
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("is_active")
      .eq("id", data.user.id)
      .single();

    if (company && company.is_active === false) {
      await supabaseAuth.auth.signOut();
      return res.status(403).json({ error: "Your company account is inactive. Please contact the TPO." });
    }
  }

  res.json({
    message: "Login successful",
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name,
      role: profile?.role,
    },
  });
};

const logout = async (req, res) => {
  await supabaseAuth.auth.signOut();
  res.json({ message: "Logged out successfully" });
};

const getMe = async (req, res) => {
  const { data, error } = await getProfileById(req.user.id);
  if (error) return res.status(404).json({ error: "Profile not found" });
  res.json(data);
};

// PUT /users/profile
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  // Update profile table (name)
  const { data: updatedProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ name })
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    return res.status(400).json({ error: profileError.message });
  }

  // If email changed, update it in Supabase Auth too (keeps login email in sync)
  const { data: currentAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getUserError) {
    return res.status(400).json({ error: getUserError.message });
  }

  if (currentAuthUser.user.email !== email) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email });
    if (authUpdateError) {
      return res.status(400).json({ error: authUpdateError.message });
    }
  }

  res.json({
    message: "Profile updated successfully",
    user: { id: userId, name: updatedProfile.name, email },
  });
};

// PUT /users/password
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "newPassword must be at least 8 characters" });
  }

  // Get the user's current email (needed to verify currentPassword via sign-in)
  const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getUserError) {
    return res.status(404).json({ error: "User not found" });
  }

  // Verify current password by attempting a real sign-in
  const { error: verifyError } = await supabaseAuth.auth.signInWithPassword({
    email: authUser.user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  // Update to the new password via the Admin API
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  res.json({ message: "Password updated successfully" });
};

// POST /users/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Request Supabase Auth recovery link
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo: `${req.headers.origin || "http://localhost:5173"}/reset-password`,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "Password reset link sent to your email." });
};

// POST /users/reset-password
const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.id; // set by authMiddleware from Bearer token

  if (!newPassword) {
    return res.status(400).json({ error: "newPassword is required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "Password reset successfully. You can now login with your new password." });
};

module.exports = { register, login, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword };