import type { InterceptorFunc } from '../consume-message-from-topic';

export interface InterceptorService {
  getInterceptors(): Record<string, InterceptorFunc>;
}
