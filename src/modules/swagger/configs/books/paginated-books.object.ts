export const PaginatedBooksObject = {
  type: 'object',
  required: ['data', 'total', 'page', 'limit', 'totalPages', 'hasMore'],
  properties: {
    data: {
      type: 'array',
      items: { $ref: '#/components/schemas/Book' },
    },
    total: { type: 'integer', description: 'Total number of books' },
    page: { type: 'integer', description: 'Current page (1-based)' },
    limit: { type: 'integer', description: 'Items per page' },
    totalPages: { type: 'integer', description: 'Total number of pages' },
    hasMore: { type: 'boolean', description: 'Whether more pages exist (for infinite scroll)' },
  },
};
