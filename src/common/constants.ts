import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError, UnauthorizedError } from '../lib/Errors';
import type { HttpException } from '../lib/Errors/HttpException';
import type { OptimizedApp } from './types';

export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

type TypeOfStatusCodes = typeof StatusCodes;
export type StatusCodeKeys = keyof TypeOfStatusCodes;
export type StatusCodeValues = TypeOfStatusCodes[StatusCodeKeys];

export const StatusCodeToError: Partial<Record<StatusCodeValues, new (...args: any[]) => HttpException>> = {
  [StatusCodes.BAD_REQUEST]: BadRequestError,
  [StatusCodes.UNAUTHORIZED]: UnauthorizedError,
  [StatusCodes.FORBIDDEN]: ForbiddenError,
  [StatusCodes.NOT_FOUND]: NotFoundError,
  [StatusCodes.INTERNAL_ERROR]: InternalServerError,
} as const;

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethodValues = (typeof HttpMethod)[keyof typeof HttpMethod];

export const Environment = {
  Prod: 'prod',
  Dev: 'dev',
} as const;

type TypeOfEnvironment = typeof Environment;
export type EnvironmentKeys = keyof TypeOfEnvironment;
export type EnvironmentValues = TypeOfEnvironment[EnvironmentKeys];

export const HEADERS = {
  RequestId: 'x-request-id',
};

export const API_URLS = {
  healthCheck: '/api/health-check',
  apiDocs: '/api/docs',
  // authentication
  auth: '/api/auth',
  authLogin: '/api/auth/login',
  authLogout: '/api/auth/logout',
  createTokens: '/api/auth/tokens',
  verifyToken: '/api/auth/verify-token',
  isPasswordValid: '/api/auth/is-password-valid',
  // users
  users: '/api/users',
  userById: '/api/users/:userId',
  getProfile: '/api/users/get-profile',
  getUserByEmail: '/api/users/get-by-email',
  // books
  books: '/api/books',
  bookById: '/api/books/:bookId',
  // dragons
  dragons: '/api/dragons',
  dragonById: '/api/dragons/:dragonId',
  // upload file
  uploadFileMultipart: '/api/upload-file/multipart',
  uploadFileBinary: '/api/upload-file/binary',
  // backend
  backendMiddleware: '/api/backend',
} satisfies Record<string, `/${string}`>;

/**
 * Paths that should be excluded from certain middlewares
 */
export const EXCLUDED_PATHS = [API_URLS.healthCheck] as string[];

/**
 * Pre-defined object structure for V8 shape optimization.
 */
export const optimizedApp: OptimizedApp = {
  modules: {
    AuthenticationModule: null as any,
    HealthCheckModule: null as any,
    UsersModule: null as any,
    BooksModule: null as any,
    DragonsModule: null as any,
    FileUploadModule: null as any,
    SwaggerModule: null as any,
  },
  configService: null as any,
  redis: {
    pub: null as any,
    sub: null as any,
  },
  pg: null as any,
  logger: null as any,
  callContextService: null as any,
  httpServer: null as any,
  io: null as any,
  wss: null as any,
};
