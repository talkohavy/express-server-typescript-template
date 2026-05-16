import { StatusCodes } from '@src/common/constants';
import { BaseError } from './BaseError';

type HttpExceptionConstructorProps = {
  name?: string;
  message?: string;
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

export class HttpException extends BaseError {
  public readonly statusCode: number;
  public readonly shouldReport: boolean;

  constructor(props: HttpExceptionConstructorProps) {
    const { name, message, statusCode, shouldReport = false } = props;

    super({ name: name ?? HttpException.name, message });

    this.statusCode = statusCode ?? StatusCodes.INTERNAL_ERROR;
    this.shouldReport = shouldReport;
  }
}
