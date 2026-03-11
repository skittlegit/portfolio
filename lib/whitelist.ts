// ============================================================
// WHITELIST — Users who can access the /165 section
// ============================================================
// Add emails or usernames (without @) below to grant access.
// This list is checked client-side — the page redirects away
// for anyone not on the list.
//
// Example:
//   emails: ["alice@gmail.com", "bob@outlook.com"],
//   usernames: ["alice", "bob-dev"],
// ============================================================

export const WHITELIST = {
  emails: [
    "deepakrdy7@gmail.com",
    // Add whitelisted emails here
  ] as string[],
  usernames: [
    "skittle",
    // Add whitelisted usernames here
  ] as string[],
};

export function isWhitelisted(email?: string | null, username?: string | null): boolean {
  if (email && WHITELIST.emails.includes(email.toLowerCase())) return true;
  if (username && WHITELIST.usernames.includes(username.toLowerCase())) return true;
  return false;
}
