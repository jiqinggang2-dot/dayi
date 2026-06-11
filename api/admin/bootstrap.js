import { adminClient, json } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  try {
    const secret = req.headers["x-bootstrap-secret"];
    if (!process.env.BOOTSTRAP_SECRET || secret !== process.env.BOOTSTRAP_SECRET) {
      return json(res, 403, { error: "Invalid bootstrap secret" });
    }

    const supabase = adminClient();
    const { data: existingAdmins, error: countError } = await supabase
      .from("app_users")
      .select("id, role:app_roles!inner(is_super_admin)")
      .eq("role.is_super_admin", true)
      .limit(1);
    if (countError) return json(res, 400, { error: countError.message });
    if (existingAdmins?.length) return json(res, 409, { error: "Super admin already exists" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { email, password, full_name = "CEO" } = body;
    if (!email || !password) return json(res, 400, { error: "email and password are required" });

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role_id: "super_admin" }
    });
    if (createError) return json(res, 400, { error: createError.message });

    const { data: profile, error: profileError } = await supabase
      .from("app_users")
      .insert({
        auth_user_id: authData.user.id,
        email,
        full_name,
        role_id: "super_admin",
        active: true
      })
      .select("*, role:app_roles(*)")
      .single();
    if (profileError) return json(res, 400, { error: profileError.message });
    return json(res, 201, { user: profile });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}
