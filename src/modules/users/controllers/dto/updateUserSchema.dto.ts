import Joi from 'joi';
import { RoleTypes } from '@src/lib/permissions';

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  nickname: Joi.string().min(1).max(30).optional(),
  dateOfBirth: Joi.date().optional(),
  role: Joi.string()
    .valid(...Object.values(RoleTypes))
    .optional(),
})
  .or('email', 'nickname', 'dateOfBirth', 'role')
  .required();
