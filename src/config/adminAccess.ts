export const LICENSE_ADMIN_ROLE = "admin" as const;
export const SUPER_ADMIN_EMAILS = [
  "claudiolx.nunes@gmail.com",
  "clxn2000@hotmail.com",
  "contato@bpfconsult.com.br"
] as const;

export function canAccessLicenseAdmin(roles?: string[] | null, email?: string | null) {
  if (!email) return false;
  // Apenas o Super Admin tem acesso total às licenças e CRM administrativo
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as any);
}

export function canAccessLeadsAdmin(roles?: string[] | null, email?: string | null) {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as any);
}

export function canAccessCRM(roles?: string[] | null, email?: string | null) {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as any);
}