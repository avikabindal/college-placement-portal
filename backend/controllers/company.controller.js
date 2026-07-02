const { supabaseAdmin, supabaseAuth } = require("../database/supabase");

// List all companies (TPO only)
const listCompanies = async (req, res) => {
  try {
    const { data, error } = await supabaseAuth
      .from("companies")
      .select(`
        id,
        description,
        industry,
        location,
        contact_email,
        website,
        created_at,
        profiles (
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new company (TPO creates it with email/password)
const createCompany = async (req, res) => {
  try {
    const { name, email, password, description, industry, location, contact_email, website } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Create auth user via Supabase Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: "company" },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile record
    const { data: profileData, error: profileError } = await supabaseAuth
      .from("profiles")
      .insert({
        id: authUser.user.id,
        name,
        email,
        role: "company",
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ error: profileError.message });
    }

    // Create company record
    const { data: companyData, error: companyError } = await supabaseAuth
      .from("companies")
      .insert({
        user_id: authUser.user.id,
        description: description || "",
        industry: industry || "",
        location: location || "",
        contact_email: contact_email || "",
        website: website || "",
      })
      .select(`
        id,
        description,
        industry,
        location,
        contact_email,
        website,
        created_at,
        profiles (
          id,
          name,
          email
        )
      `)
      .single();

    if (companyError) {
      // Cleanup: delete auth user and profile
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAuth.from("profiles").delete().eq("id", authUser.user.id);
      return res.status(500).json({ error: companyError.message });
    }

    res.status(201).json({ message: "Company created successfully", company: companyData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single company by ID
const getCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Access control: company can only view themselves, TPO can view any
    if (req.user.role === "company" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { data, error } = await supabaseAuth
      .from("companies")
      .select(`
        id,
        description,
        industry,
        location,
        contact_email,
        website,
        created_at,
        profiles (
          id,
          name,
          email
        )
      `)
      .eq("user_id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update company profile
const updateCompanyProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Access control
    if (req.user.role === "company" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, email, description, website, industry, location, contact_email } = req.body;

    // Update name/email via Supabase Auth Admin API
    if (name !== undefined || email !== undefined) {
      const { data: currentAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(id);

      if (getUserError) {
        return res.status(404).json({ error: "Company user not found" });
      }

      const authUpdates = {};

      if (name !== undefined) {
        authUpdates.user_metadata = { ...currentAuthUser.user.user_metadata, name };
      }

      if (email !== undefined && email !== currentAuthUser.user.email) {
        authUpdates.email = email;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);

        if (authUpdateError) {
          return res.status(400).json({ error: authUpdateError.message });
        }

        // Update profiles table
        if (name !== undefined || email !== undefined) {
          const profileUpdates = {};
          if (name !== undefined) profileUpdates.name = name;
          if (email !== undefined) profileUpdates.email = email;

          await supabaseAuth.from("profiles").update(profileUpdates).eq("id", id);
        }
      }
    }

    // Update companies table fields
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (website !== undefined) updates.website = website;
    if (industry !== undefined) updates.industry = industry;
    if (location !== undefined) updates.location = location;
    if (contact_email !== undefined) updates.contact_email = contact_email;

    let data = null;

    if (Object.keys(updates).length > 0) {
      const { data: updatedData, error: updateError } = await supabaseAuth
        .from("companies")
        .update(updates)
        .eq("user_id", id)
        .select(`
          id,
          description,
          industry,
          location,
          contact_email,
          website,
          created_at,
          profiles (
            id,
            name,
            email
          )
        `)
        .single();

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }

      data = updatedData;
    } else {
      // If no updates, just fetch current data
      const { data: fetchedData, error: fetchError } = await supabaseAuth
        .from("companies")
        .select(`
          id,
          description,
          industry,
          location,
          contact_email,
          website,
          created_at,
          profiles (
            id,
            name,
            email
          )
        `)
        .eq("user_id", id)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: "Company not found" });
      }

      data = fetchedData;
    }

    res.json({ message: "Company updated successfully", company: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete company
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Access control: only TPO can delete
    if (req.user.role !== "tpo") {
      return res.status(403).json({ error: "Only TPO can delete companies" });
    }

    // Delete company record
    const { error: companyError } = await supabaseAuth.from("companies").delete().eq("user_id", id);

    if (companyError) {
      return res.status(500).json({ error: companyError.message });
    }

    // Delete profile record
    const { error: profileError } = await supabaseAuth.from("profiles").delete().eq("id", id);

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      return res.status(500).json({ error: authError.message });
    }

    res.json({ message: "Company deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  listCompanies,
  createCompany,
  getCompany,
  updateCompanyProfile,
  deleteCompany,
};