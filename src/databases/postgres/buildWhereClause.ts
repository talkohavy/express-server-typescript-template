export type PostgresQueryParts = {
  whereClause: string;
  values: unknown[];
};

/**
 * Builds a WHERE clause from a filter object using only whitelisted columns.
 * Returns parameterized query parts to prevent SQL injection.
 */
export function buildWhereClause(
  filter: Record<string, unknown> | undefined,
  allowedColumns: Set<string>,
): PostgresQueryParts {
  if (!filter || Object.keys(filter).length === 0) {
    return { whereClause: '', values: [] };
  }

  const values: unknown[] = [];
  const conditions: string[] = [];

  for (const key of Object.keys(filter)) {
    if (allowedColumns.has(key)) {
      values.push(filter[key]);
      conditions.push(`${key} = $${values.length}`);
    }
  }

  if (conditions.length === 0) {
    return { whereClause: '', values: [] };
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    values,
  };
}
