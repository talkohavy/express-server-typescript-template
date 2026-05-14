import { StaticTopics } from '../../logic/constants';
import type { TopicPayload } from '@src/lib/websocket-manager';
import type { InterceptorFunc } from '../consume-message-from-topic';
import type { InterceptorService } from './types';

export class DataInterceptorService implements InterceptorService {
  getInterceptors(): Record<string, InterceptorFunc> {
    return {
      [StaticTopics.Data]: this.interceptDataTopic.bind(this),
    };
  }

  private async interceptDataTopic(topicPayload: TopicPayload): Promise<TopicPayload> {
    return topicPayload;
  }
}
