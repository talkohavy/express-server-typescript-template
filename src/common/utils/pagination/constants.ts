export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 24;
export const MAX_LIMIT = 100;

export const SortDirection = {
  ASC: 1,
  DESC: -1,
} as const;

type TypeofSortDirection = typeof SortDirection;
export type SortDirectionKeys = keyof TypeofSortDirection;
