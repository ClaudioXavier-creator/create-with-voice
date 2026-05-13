export const LICENSE_ADMIN_ROLE = "admin" as const;
export const SUPER_ADMIN_EMAIL = "claudiolx.nunes@gmail.com" as const;

export function canAccessLicenseAdmin(roles?: string[] | null, email?: string | null) {
  // Apenas o Super Admin tem acesso total às licenças e CRM administrativo
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function canAccessLeadsAdmin(roles?: string[] | null, email?: string | null) {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function canAccessCRM(roles?: string[] | null, email?: string | null) {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}