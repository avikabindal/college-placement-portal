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
        is_active,
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
      email_confirm: true,
      user_metadata: { name, role: "company" },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile record
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
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

    // Create company record (using 'id' as key)
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        id: authUser.user.id,
        description: description || "",
        industry: industry || "",
        location: location || "",
        contact_email: contact_email || "",
        website: website || "",
        is_active: true,
      })
      .select(`
        id,
        description,
        industry,
        location,
        contact_email,
        website,
        is_active,
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
      await supabaseAdmin.from("profiles").delete().eq("id", authUser.user.id);
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
        is_active,
        created_at,
        profiles (
          id,
          name,
          email
        )
      `)
      .eq("id", id)
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

    const { name, email, description, website, industry, location, contact_email, is_active } = req.body;

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

          await supabaseAdmin.from("profiles").update(profileUpdates).eq("id", id);
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
    if (is_active !== undefined) updates.is_active = is_active;

    let data = null;

    if (Object.keys(updates).length > 0) {
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from("companies")
        .update(updates)
        .eq("id", id)
        .select(`
          id,
          description,
          industry,
          location,
          contact_email,
          website,
          is_active,
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
      const { data: fetchedData, error: fetchError } = await supabaseAdmin
        .from("companies")
        .select(`
          id,
          description,
          industry,
          location,
          contact_email,
          website,
          is_active,
          created_at,
          profiles (
            id,
            name,
            email
          )
        `)
        .eq("id", id)
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

    // Check if company has any opportunities
    const { data: opps, error: oppCheckError } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .eq("company_id", id)
      .limit(1);

    if (oppCheckError) {
      return res.status(500).json({ error: oppCheckError.message });
    }

    if (opps && opps.length > 0) {
      return res.status(400).json({
        error: "Cannot delete this company because they have active or past job opportunities/placements. You should deactivate them instead."
      });
    }

    // Delete company record
    const { error: companyError } = await supabaseAdmin.from("companies").delete().eq("id", id);

    if (companyError) {
      return res.status(500).json({ error: companyError.message });
    }

    // Delete profile record
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", id);

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