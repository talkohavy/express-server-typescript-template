import { BadRequestError } from '../lib/Errors';
import type { NextFunction, Request, Response } from 'express';
import type Joi from 'joi';

export function joiQueryMiddleware(validationSchema: Joi.ObjectSchema<any>): any {
  return function validateUsingJoi(req: Request, _res: Response, next: NextFunction) {
    const { query } = req;

    const { error, value: castedValues } = validationSchema.validate(query);

    req.queryParsed = castedValues;

    if (error) throw new BadRequestError(error.message);

    next();
  };
}
