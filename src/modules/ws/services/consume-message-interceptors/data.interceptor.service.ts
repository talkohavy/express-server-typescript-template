import { StaticTopics } from '../../logic/constants';
import type { TopicPayload } from '@src/common/types';
import type { InterceptorFunc } from '@src/lib/topic-subscriber';
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
