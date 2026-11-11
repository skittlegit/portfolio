/**
 * Copy text to the clipboard. Resolves to whether it actually worked, so
 * callers only show "copied" on success (the Clipboard API is missing on
 * insecure origins and rejects when permission is denied).
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
