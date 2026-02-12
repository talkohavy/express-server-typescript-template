type GetLastPageIndexProps = {
  totalItemsCount: number;
  limit: number;
};

/**
 * Returns the last possible 0-based page index for the given item count and limit.
 * Use this for skip-based pagination (e.g. skip = pageIndex * limit).
 * Returns 0 when totalItemsCount is 0.
 */
export function getLastPageIndex(props: GetLastPageIndexProps) {
  const { totalItemsCount, limit } = props;

  // 0 is an exception case. The math below would end up returning -1 on it, so it needs special treatment.
  if (totalItemsCount === 0) return 0;

  return Math.ceil(totalItemsCount / limit) - 1;
}
