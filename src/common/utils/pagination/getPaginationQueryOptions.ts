import { DEFAULT_LIMIT, SortDirection, type SortDirectionKeys } from './constants';
import { getBoundedPage } from './getBoundedPage';
import type { QueryOptions } from './types';

type GetPaginationQueryOptionsProps = {
  page?: number;
  limit?: number;
  totalItemsCount?: number;
  sortFieldName?: string;
  sortDirection?: SortDirectionKeys;
};

export function getPaginationQueryOptions(props: GetPaginationQueryOptionsProps): QueryOptions {
  const {
    page: pageInput,
    limit = DEFAULT_LIMIT,
    totalItemsCount,
    sortFieldName = 'updatedAt',
    sortDirection = 'DESC',
  } = props;

  const boundedPage = getBoundedPage({ page: pageInput, limit, totalItemsCount });

  const skip = limit * boundedPage;
  const sort = { [sortFieldName]: SortDirection[sortDirection] };

  const options: QueryOptions = { sort, limit, skip };

  return options;
}
