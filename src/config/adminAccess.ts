export const LICENSE_MANAGER_USER_ID = "40d41e11-4ab8-4af2-bcc6-3f94bef7495b";

export function canAccessLicenseAdmin(userId?: string | null) {
  return userId === LICENSE_MANAGER_USER_ID;
}