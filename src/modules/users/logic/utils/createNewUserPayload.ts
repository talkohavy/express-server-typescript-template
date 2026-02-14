import { RoleTypes } from '@src/lib/permissions';
import type { CreateUserDto } from '../../services/interfaces/users.service.interface';
import type { DatabaseUser } from '../../types';

export function createNewUserPayload(body: CreateUserDto) {
  const createdUserValues: Omit<DatabaseUser, 'id'> = {
    email: body.email,
    nickname: body.nickname,
    date_of_birth: Number(body.dateOfBirth),
    hashed_password: body.password,
    role: body.role ?? RoleTypes.User,
  };

  return createdUserValues;
}
