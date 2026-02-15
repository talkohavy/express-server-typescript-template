import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '@src/lib/Errors';
import type { HttpException } from '@src/lib/Errors/HttpException';

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
