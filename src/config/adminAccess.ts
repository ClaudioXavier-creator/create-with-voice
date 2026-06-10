export const LICENSE_ADMIN_ROLE = "admin" as const;
export const SUPER_ADMIN_EMAILS = [
  "claudiolx.nunes@gmail.com",
  "clxn2000@hotmail.com",
  "contato@bpfconsult.com.br"
] as const;

export function canAccessLicenseAdmin(roles?: string[] | null, email?: string | null) {
  const isSuperAdmin = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as any);
  const isAdminRole = roles?.includes("admin");
  return !!(isSuperAdmin || isAdminRole);
}

export function canAccessLeadsAdmin(roles?: string[] | null, email?: string | null) {
  const isSuperAdmin = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as any);
  const isAdminRole = roles?.includes("admin") || roles?.includes("comercial");
  return !!(isSuperAdmin || isAdminRole);
}

export function canAccessCRM(roles?: string[] | null, email?: string | null) {
  const isSuperAdmin = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as any);
  const isAdminRole = roles?.includes("admin") || roles?.includes("comercial");
  return !!(isSuperAdmin || isAdminRole);
}