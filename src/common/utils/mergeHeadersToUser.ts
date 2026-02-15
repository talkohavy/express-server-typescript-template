import { USER_PROP_TO_USER_HEADER } from '../constants';
import { decodeBase64 } from './decodeBase64';
import type { IncomingHttpHeaders } from 'http';

/**
 * @description
 * Merges request headers back to a user object.
 * This is the inverse operation of splitUserToHeaders.
 * Only headers that match the AuthorizedUserHeaders configuration will be processed.
 * This function will be used by:
 * 1. Microservices to reconstruct user data from headers.
 * 2. Middleware to extract user information from incoming requests.
 */
export function mergeHeadersToUser(headers: IncomingHttpHeaders): Record<any, any> {
  const user = {} as Record<any, any>;

  const userHeaderEntries = Object.entries(USER_PROP_TO_USER_HEADER);

  userHeaderEntries.forEach(([userPropName, headerConfig]) => {
    const { headerName, isEncoded, type } = headerConfig;
    const headerValue = headers[headerName];

    if (headerValue !== undefined) {
      const valueAsString = Array.isArray(headerValue) ? headerValue[0] : headerValue;

      if (valueAsString) {
        const decodedValue = isEncoded ? decodeBase64(valueAsString) : valueAsString;
        const parsedValue = type === 'int' ? Number.parseInt(decodedValue, 10) : decodedValue;
        user[userPropName] = parsedValue;
      }
    }
  });

  return user;
}
