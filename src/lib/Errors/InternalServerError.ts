import { StatusCodes } from '@src/common/constants';
import { HttpException } from './HttpException';

type InternalServerErrorOptions = {
  /**
   * @default false
   */
  shouldReport?: boolean;
};

export class InternalServerError extends HttpException {
  constructor(message?: string, options?: InternalServerErrorOptions) {
    const { shouldReport } = options ?? {};

    super({
      name: InternalServerError.name,
      message: message ?? 'Internal Server Error',
      statusCode: StatusCodes.INTERNAL_ERROR,
      shouldReport,
    });
  }
}
