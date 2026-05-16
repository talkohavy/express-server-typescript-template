import { StatusCodes } from '@src/common/constants';
import { HttpException } from './HttpException';

type NotFoundErrorOptions = {
  /**
   * @default false
   */
  shouldReport?: boolean;
};

export class NotFoundError extends HttpException {
  constructor(message?: string, options?: NotFoundErrorOptions) {
    const { shouldReport } = options ?? {};

    super({
      name: NotFoundError.name,
      message: message ?? 'Not Found',
      statusCode: StatusCodes.NOT_FOUND,
      shouldReport,
    });
  }
}
