// =============================================================================
// Pagination Utilities
// =============================================================================

import type { PaginationParams, PaginatedResponse } from '@nexus/types';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function normalizePaginationParams(params: PaginationParams): Required<Omit<PaginationParams, 'cursor'>> & { cursor?: string } {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const limit = Math.min(Math.max(1, params.limit ?? DEFAULT_LIMIT), MAX_LIMIT);

  return {
    page,
    limit,
    cursor: params.cursor,
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

export function createPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = calculateTotalPages(total, limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const meta = createPaginationMeta(total, page, limit);

  return {
    data,
    pagination: meta,
  };
}

// Cursor-based pagination
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export function encodeCursor(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodeCursor<T extends Record<string, unknown>>(cursor: string): T | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

export function createCursorPaginatedResponse<T>(
  data: T[],
  limit: number,
  getCursor: (item: T) => Record<string, unknown>,
  hasMore: boolean
): CursorPaginatedResponse<T> {
  const lastItem = data[data.length - 1];
  const firstItem = data[0];

  return {
    data,
    pagination: {
      limit,
      hasMore,
      nextCursor: lastItem ? encodeCursor(getCursor(lastItem)) : undefined,
      prevCursor: firstItem ? encodeCursor(getCursor(firstItem)) : undefined,
    },
  };
}

// Infinite scroll helpers
export interface InfiniteScrollState<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
}

export function createInitialInfiniteScrollState<T>(): InfiniteScrollState<T> {
  return {
    items: [],
    page: 1,
    hasMore: true,
    isLoading: false,
    error: undefined,
  };
}

export function mergeInfiniteScrollData<T>(
  state: InfiniteScrollState<T>,
  response: PaginatedResponse<T>
): InfiniteScrollState<T> {
  return {
    items: [...state.items, ...response.data],
    page: response.pagination.page,
    hasMore: response.pagination.hasNext,
    isLoading: false,
    error: undefined,
  };
}

// Page range generator for UI
export function generatePageRange(
  currentPage: number,
  totalPages: number,
  maxVisible = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let rangeStart = Math.max(2, currentPage - halfVisible + 1);
  let rangeEnd = Math.min(totalPages - 1, currentPage + halfVisible - 1);

  // Adjust range if at edges
  if (currentPage <= halfVisible) {
    rangeEnd = maxVisible - 2;
  } else if (currentPage >= totalPages - halfVisible) {
    rangeStart = totalPages - maxVisible + 3;
  }

  // Add ellipsis after first page if needed
  if (rangeStart > 2) {
    pages.push('ellipsis');
  }

  // Add range pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (rangeEnd < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

// Batch processing with pagination
export async function* paginatedIterator<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit = DEFAULT_LIMIT
): AsyncGenerator<T[], void, unknown> {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchPage(page, limit);

    if (response.data.length > 0) {
      yield response.data;
    }

    hasMore = response.pagination.hasNext;
    page++;
  }
}

export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit = DEFAULT_LIMIT,
  maxPages = 100
): Promise<T[]> {
  const allItems: T[] = [];
  let pagesProcessed = 0;

  for await (const items of paginatedIterator(fetchPage, limit)) {
    allItems.push(...items);
    pagesProcessed++;

    if (pagesProcessed >= maxPages) {
      break;
    }
  }

  return allItems;
}
