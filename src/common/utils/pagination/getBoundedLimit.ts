import { MAX_LIMIT } from './constants';

type GetBoundedLimitProps = {
  limit: number;
  maxLimit?: number;
};

export function getBoundedLimit(props: GetBoundedLimitProps) {
  const { limit, maxLimit = MAX_LIMIT } = props;

  return Math.min(maxLimit ?? MAX_LIMIT, Math.max(1, limit));
}
