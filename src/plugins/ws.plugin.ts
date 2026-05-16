import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { TopicPublisherService } from '@src/lib/topic-publisher';
import { TopicSubscriberService } from '@src/lib/topic-subscriber';
import { WS_TOPIC_PUBSUB_CHANNEL } from '@src/modules/ws/logic/constants';
import type { Application } from 'express';

/**
 * @dependencies
 * - redis plugin
 *
 * @description
 * ## Redis client roles
 *
 * ### redis.sub
 *
 * A connection in subscriber mode can only run these operations: SUBSCRIBE/UNSUBSCRIBE/PING/QUIT.
 * We use redis.sub as a dedicated subscriber connection; used only to SUBSCRIBE to the topic channel so
 * this node receives messages to forward to its local WebSocket clients.
 *
 * ### redis.pub
 *
 * Our "normal" Redis client, which can run any operation (EVAL, SADD, SMEMBERS, PUBLISH, etc.).
 */
export function wsPlugin(app: Application) {
  app.httpServer ??= createServer(app);

  app.wsApp = new WebSocketServer({ server: app.httpServer });

  app.topicSubscriber = new TopicSubscriberService(
    app.redis.pub,
    app.redis.sub,
    app.logger,
    {
      // ...dataInterceptorService.getInterceptors(),
    },
    WS_TOPIC_PUBSUB_CHANNEL,
  );

  app.topicPublisher = new TopicPublisherService(app.redis.pub, WS_TOPIC_PUBSUB_CHANNEL);
}
