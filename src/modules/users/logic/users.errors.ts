import { BaseError } from '@src/core/errors/BaseError';

export class UserNotFoundError extends BaseError {
  constructor(userId: string) {
    super({ name: UserNotFoundError.name, message: `User with id ${userId} not found` });
  }
}
