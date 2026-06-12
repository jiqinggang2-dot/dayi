import { adminClient, json, requireAdmin } from "./_supabaseAdmin.js";

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function usernameToEmail(username) {
  const normalized = normalizeUsername(username);
  return normalized.includes("@") ? normalized : `${normalized}@dayi.local`;
}

export default async function handler(req, res) {
  if (!["POST", "PATCH"].includes(req.method)) {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const supabase = adminClient();
    const auth = await requireAdmin(req, supabase);
    if (auth.error) return json(res, auth.status, { error: auth.error });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (req.method === "POST") {
      return await createUser(res, supabase, auth.profile, body);
    }
    return await updateUser(res, supabase, body);
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}

async function createUser(res, supabase, creator, body) {
  const { username, email: rawEmail, password, full_name, role_id, whatsapp, wechat, active = true } = body;
  const normalizedUsername = normalizeUsername(username || rawEmail);
  const email = usernameToEmail(normalizedUsername);
  if (!normalizedUsername || !password || !full_name || !role_id) {
    return json(res, 400, { error: "username, password, full_name and role_id are required" });
  }
  const { data: role, error: roleError } = await supabase.from("app_roles").select("*").eq("id", role_id).single();
  if (roleError || !role) return json(res, 400, { error: "Invalid role" });
  if (role.is_super_admin) return json(res, 403, { error: "Cannot create another super admin here" });

  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: normalizedUsername, full_name, role_id }
  });
  if (createError) return json(res, 400, { error: createError.message });

  const { data: userProfile, error: profileError } = await supabase
    .from("app_users")
    .insert({
      auth_user_id: authData.user.id,
      username: normalizedUsername,
      email,
      full_name,
      role_id,
      whatsapp: whatsapp || "",
      wechat: wechat || "",
      active,
      created_by: creator.id
    })
    .select("*, role:app_roles(*)")
    .single();
  if (profileError) return json(res, 400, { error: profileError.message });
  return json(res, 201, { user: userProfile });
}

async function updateUser(res, supabase, body) {
  const { id, password, ...patch } = body;
  if (!id) return json(res, 400, { error: "id is required" });

  const { data: existing, error: existingError } = await supabase.from("app_users").select("*, role:app_roles(*)").eq("id", id).single();
  if (existingError || !existing) return json(res, 404, { error: "User not found" });
  if (existing.role?.is_super_admin && (patch.active === false || patch.role_id)) {
    return json(res, 403, { error: "Cannot demote or disable the super admin" });
  }
  if (patch.role_id) {
    const { data: nextRole, error: roleError } = await supabase.from("app_roles").select("*").eq("id", patch.role_id).single();
    if (roleError || !nextRole) return json(res, 400, { error: "Invalid role" });
    if (nextRole.is_super_admin && !existing.role?.is_super_admin) {
      return json(res, 403, { error: "Cannot promote another user to super admin here" });
    }
  }

  const allowedPatch = {
    full_name: patch.full_name,
    role_id: patch.role_id,
    whatsapp: patch.whatsapp,
    wechat: patch.wechat,
    active: patch.active
  };
  Object.keys(allowedPatch).forEach((key) => allowedPatch[key] === undefined && delete allowedPatch[key]);

  const { data: profile, error: updateError } = await supabase
    .from("app_users")
    .update(allowedPatch)
    .eq("id", id)
    .select("*, role:app_roles(*)")
    .single();
  if (updateError) return json(res, 400, { error: updateError.message });

  if (password) {
    const { error: passwordError } = await supabase.auth.admin.updateUserById(existing.auth_user_id, { password });
    if (passwordError) return json(res, 400, { error: passwordError.message });
  }

  return json(res, 200, { user: profile });
}
