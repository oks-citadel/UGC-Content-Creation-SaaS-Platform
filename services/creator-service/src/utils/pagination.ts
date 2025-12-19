export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function calculatePagination(options: PaginationOptions = {}): PaginationResult {
  const maxLimit = options.maxLimit || 100;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(Math.max(1, options.limit || 20), maxLimit);
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit,
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
