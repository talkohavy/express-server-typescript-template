import { CACHE_PREFIX_KEYS } from '../constants';

export function getMasterRoomByUserId(userId: string) {
  return `${CACHE_PREFIX_KEYS.MasterRoom}:${userId}`;
}
