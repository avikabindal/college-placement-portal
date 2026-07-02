const { supabaseAdmin, supabaseAuth } = require("../database/supabase");
const { getProfileById } = require("../models/profile.model");

const register = async (req, res) => {
  console.log("Register hit, body:", req.body);
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, and role are required" });
  }
  if (!["tpo", "student", "company"].includes(role)) {
    return res.status(400).json({ error: "role must be tpo, student, or company" });
  }

  console.log("Calling Supabase Admin REST API directly");
  const supaRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    }),
  });

  const result = await supaRes.json();
  console.log("Result:", { status: supaRes.status, result });

  if (!supaRes.ok) {
    return res.status(400).json({ error: result.msg || result.error_code || "Registration failed" });
  }

  const data = { user: result };

  if (role === "student") {
    await supabaseAdmin.from("students").insert({ id: data.user.id });
  }
  if (role === "company") {
    await supabaseAdmin.from("companies").insert({ id: data.user.id });
  }

  res.status(201).json({
    message: "User registered successfully",
    user: { id: data.user.id, email, name, role },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: "Invalid email or password" });

  const { data: profile } = await getProfileById(data.user.id);

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

module.exports = { register, login, logout, getMe, updateProfile, changePassword };