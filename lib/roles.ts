export const ADMIN_EMAILS = ["gdos87@hotmail.com"];

/** Optional hard-coded staff emails. Prefer adding staff from Admin so you do not need another deploy. */
export const STAFF_EMAILS: string[] = [];

export function normEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

export function isAdminEmail(email?: string | null) {
  return ADMIN_EMAILS.includes(normEmail(email));
}

export function isHardcodedStaff(email?: string | null) {
  return STAFF_EMAILS.includes(normEmail(email));
}
