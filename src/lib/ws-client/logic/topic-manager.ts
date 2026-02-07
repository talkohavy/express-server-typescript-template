import type { WebSocket } from 'ws';

/**
 * Efficiently manages topic subscriptions for WebSocket clients.
 *
 * Uses:
 * - Map<string, Set<WebSocket>> for O(1) topic lookups and client management
 * - WeakMap<WebSocket, Set<string>> for automatic cleanup when clients disconnect
 *
 * Performance optimizations:
 * - Set operations are O(1) for add/delete/has
 * - WeakMap allows garbage collection of disconnected clients
 * - Single-pass iteration when publishing to topics
 */
export class TopicManager {
  /**
   * Maps topic names to sets of subscribed WebSocket clients.
   * Using Set ensures O(1) add/delete operations and prevents duplicates.
   */
  private readonly topicToClients = new Map<string, Set<WebSocket>>();

  /**
   * Maps WebSocket clients to their subscribed topics.
   * Using WeakMap allows automatic cleanup when clients are garbage collected.
   */
  private readonly clientToTopics = new WeakMap<WebSocket, Set<string>>();

  subscribe(client: WebSocket, topic: string): boolean {
    // Get or create the set of clients for this topic
    let clientsSubscribedToTopic = this.topicToClients.get(topic);

    if (!clientsSubscribedToTopic) {
      clientsSubscribedToTopic = new Set<WebSocket>();
      this.topicToClients.set(topic, clientsSubscribedToTopic);
    }

    if (clientsSubscribedToTopic.has(client)) return false;

    clientsSubscribedToTopic.add(client);

    // Track topic for this client (for cleanup on disconnect)
    let clientTopics = this.clientToTopics.get(client);

    if (!clientTopics) {
      clientTopics = new Set<string>();
      this.clientToTopics.set(client, clientTopics);
    }

    clientTopics.add(topic);

    return true;
  }

  /**
   * Unsubscribe a client from a topic.
   * @returns true if unsubscribe operation was successful, false if not.
   */
  unsubscribe(client: WebSocket, topic: string): boolean {
    const clientsSubscribedToTopic = this.topicToClients.get(topic);

    if (!clientsSubscribedToTopic?.has(client)) return false;

    clientsSubscribedToTopic.delete(client); // <--- Remove client from topic

    // Clean up empty topic sets to prevent memory leaks
    if (clientsSubscribedToTopic.size === 0) {
      this.topicToClients.delete(topic);
    }

    // Remove topic from client's subscription list
    const topicsOfClient = this.clientToTopics.get(client);
    if (topicsOfClient) topicsOfClient.delete(topic);

    return true;
  }

  /**
   * Unsubscribe a client from all topics (used on disconnect).
   * @param client - The WebSocket client to unsubscribe from all topics
   */
  unsubscribeAll(client: WebSocket): void {
    const topicsOfClient = this.clientToTopics.get(client);

    if (!topicsOfClient) return;

    // Remove client from all topics it's subscribed to
    topicsOfClient.forEach((topic) => {
      const clientsSubscribedToTopic = this.topicToClients.get(topic);

      if (!clientsSubscribedToTopic) return;

      clientsSubscribedToTopic.delete(client);

      // Clean up empty topic sets
      if (clientsSubscribedToTopic.size === 0) {
        this.topicToClients.delete(topic);
      }
    });

    // WeakMap will automatically clean up the client entry when client is garbage collected
  }

  getSubscribers(topic: string): Set<WebSocket> {
    return this.topicToClients.get(topic) ?? new Set<WebSocket>();
  }

  getClientTopics(client: WebSocket): Set<string> {
    return this.clientToTopics.get(client) ?? new Set<string>();
  }

  isSubscribed(client: WebSocket, topic: string): boolean {
    const clientsSubscribedToTopic = this.topicToClients.get(topic);
    return clientsSubscribedToTopic?.has(client) ?? false;
  }

  getTopicCount(): number {
    return this.topicToClients.size;
  }

  getSubscriberCount(topic: string): number {
    return this.topicToClients.get(topic)?.size ?? 0;
  }
}
