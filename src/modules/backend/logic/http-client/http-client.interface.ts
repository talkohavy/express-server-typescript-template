import type { HttpMethodValues } from '@src/common/constants';
import type { ServiceNameValues } from '@src/configurations';
import type { IncomingHttpHeaders } from 'node:http';

export type HttpClientRequestOptions = {
  headers?: IncomingHttpHeaders;
  queryParams?: Record<string, any>;
  /**
   * If set to true, and an error occurs during the request, it will not throw an error.
   * @default false
   */
  silent?: boolean;
};

export type GetRequestProps = HttpClientRequestOptions & {
  serviceName: ServiceNameValues;
  route: string;
  options?: HttpClientRequestOptions;
};

export type RequestWithBodyProps = HttpClientRequestOptions & {
  serviceName: ServiceNameValues;
  route: string;
  body?: Record<string, any>;
  options?: HttpClientRequestOptions;
};

export type RequestProps = RequestWithBodyProps & {
  method: HttpMethodValues;
};
