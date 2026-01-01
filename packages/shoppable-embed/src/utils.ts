/**
 * HTML escape utility to prevent XSS attacks
 */

/**
 * Escapes HTML special characters in a string to prevent XSS attacks
 * when inserting user-controlled data into HTML templates.
 *
 * @param text - The text to escape
 * @returns The escaped text safe for use in HTML
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escapes HTML attribute values to prevent XSS attacks.
 * This handles additional characters that are problematic in attributes.
 *
 * @param text - The text to escape for use in an HTML attribute
 * @returns The escaped text safe for use in HTML attributes
 */
export function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
