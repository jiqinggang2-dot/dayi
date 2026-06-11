import { createClient } from "@supabase/supabase-js";

export function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function requireAdmin(req, supabase) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return { error: "Missing bearer token", status: 401 };
  }
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return { error: "Invalid session", status: 401 };
  }
  const { data: profile, error: profileError } = await supabase
    .from("app_users")
    .select("*, role:app_roles(*)")
    .eq("auth_user_id", authData.user.id)
    .eq("active", true)
    .single();
  if (profileError || !profile) {
    return { error: "No active company profile", status: 403 };
  }
  if (!profile.role?.is_super_admin && !profile.role?.can_manage_users) {
    return { error: "Insufficient permissions", status: 403 };
  }
  return { user: authData.user, profile };
}

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
