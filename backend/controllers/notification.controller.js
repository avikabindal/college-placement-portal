const { supabaseAdmin } = require("../database/supabase");

// Internal helper to create a notification
const createNotification = async (userId, title, message) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({ user_id: userId, title, message })
      .select()
      .single();
    if (error) console.error("Error creating notification:", error.message);
    return { data, error };
  } catch (err) {
    console.error("Create notification failed:", err);
    return { error: err };
  }
};

const listNotifications = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createNotification,
  listNotifications,
  markAllRead,
  markRead,
};
