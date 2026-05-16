import type { InterceptorFunc } from '@src/lib/topic-subscriber';

export interface InterceptorService {
  getInterceptors(): Record<string, InterceptorFunc>;
}
