export const LICENSE_ADMIN_ROLE = "admin" as const;

export function canAccessLicenseAdmin(roles?: string[] | null) {
  return !!roles?.includes(LICENSE_ADMIN_ROLE);
}