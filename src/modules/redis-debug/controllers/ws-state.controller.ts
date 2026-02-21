import { API_URLS } from '@src/common/constants';
import { internalApiKeyMiddleware } from '../middlewares/internal-api-key.middleware';
import type { ControllerFactory } from '@src/lib/lucky-server';
import type { Application, Response } from 'express';

export class WsStateController implements ControllerFactory {
  constructor(private readonly app: Application) {}

  private wsState(): void {
    this.app.get(API_URLS.internalWsState, internalApiKeyMiddleware, async (_req, res: Response) => {
      const { wsManager, logger } = this.app;

      logger.debug(`GET ${API_URLS.internalWsState} - internal ws state`);

      const [topicCount, topicNames] = await Promise.all([wsManager.getTopicCount(), wsManager.getTopicNames()]);

      const topicDetailsArr = await Promise.all(
        topicNames.map(async (topic) => {
          const subscriberCount = await wsManager.getTopicSubscriberCount(topic);

          return { topic, subscriberCount };
        }),
      );

      const totalSubscribersSum = topicDetailsArr.reduce((sum, d) => sum + d.subscriberCount, 0);

      const payload = {
        activeTopics: topicCount,
        topics: topicDetailsArr,
        totalSubscribers: totalSubscribersSum,
      };

      res.json(payload);
    });
  }

  registerRoutes(): void {
    this.wsState();
  }
}
