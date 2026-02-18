/**
 * Lua scripts for atomic topic subscription operations in Redis.
 * Used by TopicManager; all mutations go through these scripts so Redis stays the source of truth.
 *
 * Key layout:
 * - ws:topic:{topic}     -> SET of connectionIds
 * - ws:conn:{connectionId} -> SET of topics
 * - ws:topics            -> SET of topic names (for getTopicCount)
 */

const TOPICS_SET_KEY = 'ws:topics';

/** Script 1: Subscribe connectionId to topic. Returns 1 if newly subscribed, 0 if already member. */
export const SUBSCRIBE_SCRIPT = `
  local topicKey = KEYS[1]
  local connectionKey = KEYS[2]
  local topicsSet = KEYS[3]
  local connectionId = ARGV[1]
  local topic = ARGV[2]
  local added = redis.call('SADD', topicKey, connectionId)
  redis.call('SADD', connectionKey, topic)
  redis.call('SADD', topicsSet, topic)
  return added
`;

/** Script 2: Unsubscribe connectionId from topic. Returns 1 if was member, 0 otherwise. */
export const UNSUBSCRIBE_SCRIPT = `
  local topicKey = KEYS[1]
  local connectionKey = KEYS[2]
  local topicsSet = KEYS[3]
  local connectionId = ARGV[1]
  local topic = ARGV[2]
  local removed = redis.call('SREM', topicKey, connectionId)
  if removed == 1 then
    redis.call('SREM', connectionKey, topic)
    if redis.call('SCARD', topicKey) == 0 then
      redis.call('DEL', topicKey)
      redis.call('SREM', topicsSet, topic)
    end
  end
  return removed
`;

/** Script 3: Unsubscribe connectionId from all topics and delete conn key. Returns number of topics removed. */
export const UNSUBSCRIBE_ALL_SCRIPT = `
  local connectionKey = KEYS[1]
  local topicsSet = KEYS[2]
  local connectionId = ARGV[1]
  local topics = redis.call('SMEMBERS', connectionKey)
  for i, topic in ipairs(topics) do
    local topicKey = 'ws:topic:' .. topic
    redis.call('SREM', topicKey, connectionId)
    if redis.call('SCARD', topicKey) == 0 then
      redis.call('DEL', topicKey)
      redis.call('SREM', topicsSet, topic)
    end
  end
  redis.call('DEL', connectionKey)
  return #topics
`;

export function getTopicKey(topic: string): string {
  return `ws:topic:${topic}`;
}

export function getConnectionKey(connectionId: string): string {
  return `ws:conn:${connectionId}`;
}

export function getTopicsSetKey(): string {
  return TOPICS_SET_KEY;
}
