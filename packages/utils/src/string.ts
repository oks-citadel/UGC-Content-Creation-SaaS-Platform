// =============================================================================
// String Utilities
// =============================================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

export function camelToKebab(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToSnake(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function snakeToCamel(text: string): string {
  return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function truncate(text: string, maxLength: number, ellipsis = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length).trim() + ellipsis;
}

export function truncateMiddle(text: string, maxLength: number, separator = '...'): string {
  if (text.length <= maxLength) return text;

  const charsToShow = maxLength - separator.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return text.slice(0, frontChars) + separator + text.slice(-backChars);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

export function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => map[entity] || entity);
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches)] : [];
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches)] : [];
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

export function highlightText(text: string, query: string, className = 'highlight'): string {
  if (!query.trim()) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  return text.replace(regex, `<span class="${className}">$1</span>`);
}

export function generateInitials(name: string, maxChars = 2): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, maxChars)
    .join('');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const maskedLocal =
    local.length <= 2 ? '*'.repeat(local.length) : local[0] + '*'.repeat(local.length - 2) + local.slice(-1);

  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '*'.repeat(cleaned.length);

  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

export function maskCreditCard(number: string): string {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length < 4) return '*'.repeat(cleaned.length);

  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function removeEmojis(text: string): string {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ''
    )
    .trim();
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function countCharacters(text: string, excludeSpaces = false): number {
  return excludeSpaces ? text.replace(/\s/g, '').length : text.length;
}

export function getReadingTime(text: string, wordsPerMinute = 200): number {
  const words = countWords(text);
  return Math.ceil(words / wordsPerMinute);
}

export function isEmptyOrWhitespace(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function toAscii(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
