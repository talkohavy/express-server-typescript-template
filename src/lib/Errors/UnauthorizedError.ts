import { StatusCodes } from '@src/common/constants';
import { HttpException } from './HttpException';

type UnauthorizedErrorOptions = {
  /**
   * @default false
   */
  shouldReport?: boolean;
};

export class UnauthorizedError extends HttpException {
  constructor(message?: string, options?: UnauthorizedErrorOptions) {
    const { shouldReport } = options ?? {};

    super({
      name: UnauthorizedError.name,
      message: message ?? 'Unauthorized',
      statusCode: StatusCodes.UNAUTHORIZED,
      shouldReport,
    });
  }
}
