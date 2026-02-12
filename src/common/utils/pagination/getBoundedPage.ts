import { DEFAULT_PAGE } from './constants';
import { getLastPageIndex } from './getLastPageIndex';

type GetBoundedPageProps = {
  page?: number;
  limit: number;
  totalItemsCount?: number;
};

export function getBoundedPage(props: GetBoundedPageProps) {
  const { page: pageInput = DEFAULT_PAGE, limit, totalItemsCount } = props;

  let boundedPage = pageInput > 0 ? pageInput - 1 : 0; // <--- prevents negative page numbers. UI page is 1-based, skip is 0-based.

  if (boundedPage && totalItemsCount !== undefined) {
    const lastPossiblePage = getLastPageIndex({ totalItemsCount, limit });
    boundedPage = Math.min(boundedPage, lastPossiblePage); // <--- prevents going beyond the last page
  }

  return boundedPage;
}
