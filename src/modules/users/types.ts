import type { RoleTypeValues } from '@src/common/constants';

export type DatabaseUser = {
  id: number;
  email: string;
  nickname: string;
  hashed_password: string;
  date_of_birth: number;
  role: RoleTypeValues;
};
