import { StaticTopics } from '../../logic/constants';
import type { InterceptorFunc } from '../consume-message-from-topic';
import type { InterceptorService } from './types';
import type { TopicPayload } from '@src/lib/websocket-manager';

export class DataInterceptorService implements InterceptorService {
  constructor() {}

  getInterceptors(): Record<string, InterceptorFunc> {
    return {
      [StaticTopics.Data]: this.interceptDataTopic.bind(this),
    };
  }

  private async interceptDataTopic(topicPayload: TopicPayload): Promise<TopicPayload> {
    return topicPayload;
  }
}
