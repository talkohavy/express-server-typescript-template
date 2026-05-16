import { StatusCodes } from '@src/common/constants';
import { HttpException } from './HttpException';

type BadRequestErrorOptions = {
  /**
   * Override the default status code.
   * The default depends on the error type.
   */
  statusCode?: number;
  /**
   * @default false
   */
  shouldReport?: boolean;
};

export class BadRequestError extends HttpException {
  constructor(message?: string, options?: BadRequestErrorOptions) {
    const { statusCode, shouldReport } = options ?? {};

    if (statusCode && !(statusCode >= 400 && statusCode <= 499)) {
      throw new Error(`statusCode of BadRequestError must be in range 400-499. Received: ${statusCode}`);
    }

    super({
      name: BadRequestError.name,
      message: message ?? 'Bad Request',
      statusCode: statusCode ?? StatusCodes.BAD_REQUEST,
      shouldReport,
    });
  }
}
