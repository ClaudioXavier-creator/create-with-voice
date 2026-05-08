export const LICENSE_ADMIN_ROLE = "admin" as const;
export const SUPER_ADMIN_EMAIL = "claudiolx.nunes@gmail.com" as const;

export function canAccessLicenseAdmin(roles?: string[] | null, email?: string | null) {
  return !!roles?.includes(LICENSE_ADMIN_ROLE) || email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function canAccessLeadsAdmin(roles?: string[] | null) {
  return !!roles?.includes(LICENSE_ADMIN_ROLE);
}