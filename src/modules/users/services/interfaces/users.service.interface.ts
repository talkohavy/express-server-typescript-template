import type { UserRole } from '../../types';

export type CreateUserDto = {
  email: string;
  password: string;
  nickname: string;
  dateOfBirth: number | string;
  role?: UserRole;
};

export type UpdateUserDto = {
  email?: string;
  password?: string;
  nickname?: string;
  dateOfBirth?: number | string;
  role?: UserRole;
};
