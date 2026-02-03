import { CACHE_PREFIX_KEYS } from '../constants';

export function getMasterRoomByConnectionId(id: string) {
  return `${CACHE_PREFIX_KEYS.MasterRoom}:${id}`;
}
