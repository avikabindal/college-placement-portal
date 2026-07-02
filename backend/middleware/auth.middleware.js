const { supabaseAdmin, supabaseAuth } = require("../database/supabase");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, name, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: "User profile not found" });
  }

  req.user = { id: user.id, role: profile.role, name: profile.name, email: profile.email };
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

module.exports = { authMiddleware, requireRole };