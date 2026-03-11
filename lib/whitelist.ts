// Whitelisted users who can access the /165 section.
// Add emails or usernames (without @) to grant access.
export const WHITELIST = {
  emails: [
    // "user@example.com",
  ] as string[],
  usernames: [
    // "someuser",
  ] as string[],
};

export function isWhitelisted(email?: string | null, username?: string | null): boolean {
  if (email && WHITELIST.emails.includes(email.toLowerCase())) return true;
  if (username && WHITELIST.usernames.includes(username.toLowerCase())) return true;
  return false;
}
