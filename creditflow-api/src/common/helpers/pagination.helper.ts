import { PaginationParams, PaginationMeta, PaginatedResponse } from '@creditflow/shared-types';

export function getPaginationParams(params: PaginationParams): { skip: number; take: number } {
  const page = params.page || 1;
  const limit = params.limit || 10;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const totalPages = Math.ceil(total / limit);

  const meta: PaginationMeta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return { data, meta };
}
