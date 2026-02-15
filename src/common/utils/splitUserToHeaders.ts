import { USER_PROP_TO_USER_HEADER } from '../constants';
import { encodeBase64 } from './encodeBase64';
import type { IncomingHttpHeaders } from 'http';

/**
 * @description
 * Splits a user object to request headers.
 * Not all props will be converted to headers.
 * This function will be used by the:
 * 1. An api-gateway upon entry (wrapped in a middleware).
 * 2. An microServicesNetworkClient upon exit.
 */
export function splitUserToHeaders(userData: Record<string, any>): IncomingHttpHeaders {
  const userAuthHeaders = {} as IncomingHttpHeaders;

  const userDataEntries = Object.entries(userData);

  userDataEntries.forEach((userDataEntry) => {
    const [userPropName, userPropValue] = userDataEntry;

    const userHeader = USER_PROP_TO_USER_HEADER[userPropName];

    if (userHeader) {
      const { headerName, isEncoded } = userHeader;
      const headerValue = isEncoded ? encodeBase64(userPropValue) : userPropValue;
      userAuthHeaders[headerName] = headerValue;
    }
  });

  return userAuthHeaders;
}
