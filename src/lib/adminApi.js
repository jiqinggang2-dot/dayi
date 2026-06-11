import { getAccessToken } from "./supabase";

async function requestAdmin(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Admin request failed");
  }
  return payload;
}

export function createCompanyUser(input) {
  return requestAdmin("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateCompanyUser(input) {
  return requestAdmin("/api/admin/users", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}
