import { accessibleModulesFor } from "../data/modules";

export function isSuperAdmin(profile) {
  return Boolean(profile?.role?.is_super_admin);
}

export function canManageUsers(profile) {
  return Boolean(profile?.role?.is_super_admin || profile?.role?.can_manage_users);
}

export function canAccessModule(profile, moduleId) {
  if (isSuperAdmin(profile)) return true;
  return accessibleModulesFor(profile).some((module) => module.id === moduleId);
}

export function canEditRecord(profile, record) {
  if (!profile || !record) return false;
  if (isSuperAdmin(profile)) return true;
  if (canAccessModule(profile, record.module_id)) return true;
  return [record.owner_user_id, record.approver_user_id, record.support_user_id].includes(profile.id);
}

export function visibleUsersForAssignment(users = [], profile) {
  if (isSuperAdmin(profile) || canManageUsers(profile)) return users;
  return users.filter((user) => user.id === profile?.id);
}
