import { StatusCodes } from '@src/common/constants';
import { HttpException } from './HttpException';

type ForbiddenErrorOptions = {
  /**
   * @default false
   */
  shouldReport?: boolean;
};

export class ForbiddenError extends HttpException {
  constructor(message?: string, options?: ForbiddenErrorOptions) {
    const { shouldReport } = options ?? {};

    super({
      name: ForbiddenError.name,
      message: message ?? 'Forbidden',
      statusCode: StatusCodes.FORBIDDEN,
      shouldReport,
    });
  }
}
