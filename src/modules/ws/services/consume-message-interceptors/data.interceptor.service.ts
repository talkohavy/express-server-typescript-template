import { StaticTopics } from '../../logic/constants';
import type { InterceptorFunc } from '../consume-message-from-topic';
import type { InterceptorService } from './types';
import type { TopicMessage } from '@src/lib/websocket-manager';

export class DataInterceptorService implements InterceptorService {
  constructor() {}

  getInterceptors(): Record<string, InterceptorFunc> {
    return {
      [StaticTopics.Data]: this.interceptDataTopic.bind(this),
    };
  }

  private async interceptDataTopic(message: TopicMessage): Promise<TopicMessage> {
    return message;
  }
}
