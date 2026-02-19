/**
 * Lua scripts for atomic topic subscription operations in Redis.
 * Used by TopicManager; all mutations go through these scripts so Redis stays the source of truth.
 *
 * Key layout:
 * - ws:topic:{topic}:sockets     -> SET of socketIds subscribed to the topic
 * - ws:socket:{socketId}:topics -> SET of topics the socketId is listed to
 * - ws:topics            -> SET of topic names (for getTopicCount)
 */

const TOPICS_GROUP_KEY = 'ws:topics';

/**
 * Script 1: Subscribe socketId to topic. Returns 1 if newly subscribed, 0 if already member.
 *
 * socketsUnderTopicKey: `ws:topic:${topic}:sockets`
 * topicsUnderSocketKey: `ws:socket:${socketId}:topics`
 * topicsGroupKey: 'ws:topics'
 */
export const SUBSCRIBE_SCRIPT = `
  local socketsUnderTopicKey = KEYS[1]
  local topicsUnderSocketKey = KEYS[2]
  local topicsGroupKey = KEYS[3]
  
  local socketId = ARGV[1]
  local topic = ARGV[2]
  
  local addedSocketId = redis.call('SADD', socketsUnderTopicKey, socketId)

  redis.call('SADD', topicsUnderSocketKey, topic)
  redis.call('SADD', topicsGroupKey, topic)
  
  return addedSocketId
`;

/**
 * Script 2: Unsubscribe socketId from topic. Returns 1 if was member, 0 otherwise.
 *
 * keys: [topicKeyStr, socketKeyStr, topicsSet]
 *
 * topicsUnderSocketKey: `ws:socket:${socketId}:topics`
 * socketsUnderTopicKey: `ws:topic:${topic}:sockets`
 * topicsGroupKey: 'ws:topics'
 */
export const UNSUBSCRIBE_SCRIPT = `
  local socketsUnderTopicKey = KEYS[1]
  local topicsUnderSocketKey = KEYS[2]
  local topicsGroupKey = KEYS[3]

  local socketId = ARGV[1]
  local topic = ARGV[2]

  local removedSocketId = redis.call('SREM', socketsUnderTopicKey, socketId)
  
  if removedSocketId == 1 then
    redis.call('SREM', topicsUnderSocketKey, topic)
    
    if redis.call('SCARD', socketsUnderTopicKey) == 0 then
      redis.call('DEL', socketsUnderTopicKey)
      redis.call('SREM', topicsGroupKey, topic)
    end
  end

  return removedSocketId
`;

/**
 * Script 3: Unsubscribe socketId from all topics and delete socket key. Returns number of topics removed.
 *
 * topicsUnderSocketKey: `ws:socket:${socketId}:topics`
 * socketsUnderTopicKey: `ws:topic:{topic}:sockets`
 * topicsGroupKey: 'ws:topics'
 */
export const UNSUBSCRIBE_ALL_SCRIPT = `
  local topicsUnderSocketKey = KEYS[1]
  local topicsGroupKey = KEYS[2]
  
  local socketId = ARGV[1]
  
  local topicsOfSocket = redis.call('SMEMBERS', topicsUnderSocketKey)
  
  for i, topic in ipairs(topicsOfSocket) do
    local socketsUnderTopicKey = 'ws:topic:' .. topic .. ':sockets' -- <--- concatenate to create 'ws:topic:{topic}:sockets'
    
    redis.call('SREM', socketsUnderTopicKey, socketId)
    
    if redis.call('SCARD', socketsUnderTopicKey) == 0 then
      redis.call('DEL', socketsUnderTopicKey)
      redis.call('SREM', topicsGroupKey, topic)
    end
  end

  redis.call('DEL', topicsUnderSocketKey)
  
  return #topicsOfSocket -- <--- in lua, # is the length operator
`;

/**
 * Script 4: Remove multiple connections from Redis in one round-trip.
 * KEYS[1] = topicsGroupKey (ws:topics), KEYS[2..n] = ws:socket:{socketId}:topics for each socket.
 * ARGV[1..n] = socketId for each socket (same order as KEYS[2..n]).
 *
 * topicsGroupKey: 'ws:topics'
 * topicsUnderSocketKey: `ws:socket:${socketId}:topics`
 * socketsUnderTopicKey: `ws:topic:{topic}:sockets`
 */
export const CLEANUP_CONNECTIONS_SCRIPT = `
  local topicsGroupKey = KEYS[1]

  -- loop through all sockets connected to this node
  for i = 2, #KEYS do
    local socketId = ARGV[i - 1]
    local topicsUnderSocketKey = KEYS[i]
    local topicsOfSocket = redis.call('SMEMBERS', topicsUnderSocketKey)

    -- loop through all topics this socket is subscribed to
    for j, topic in ipairs(topicsOfSocket) do
      local socketsUnderTopicKey = 'ws:topic:' .. topic .. ':sockets' -- <--- concatenate to create 'ws:topic:{topic}:sockets'
      
      -- remove the socket from the topic
      redis.call('SREM', socketsUnderTopicKey, socketId)
      
      -- if no more sockets are subscribed to the topic, delete the topic
      if redis.call('SCARD', socketsUnderTopicKey) == 0 then
        redis.call('DEL', socketsUnderTopicKey)
        redis.call('SREM', topicsGroupKey, topic)
      end
    end

    -- delete the socket's topics group key
    redis.call('DEL', topicsUnderSocketKey)
  end

  return 1
`;

export function getSocketsUnderTopicKey(topic: string): string {
  return `ws:topic:${topic}:sockets`;
}

export function getTopicsUnderSocketKey(socketId: string): string {
  return `ws:socket:${socketId}:topics`;
}

export function getTopicsGroupKey(): string {
  return TOPICS_GROUP_KEY;
}
