import { NextFunction, RequestHandler, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { ServiceResult } from '../shared/application/serviceResult';

export const sendServiceResult = <T>(
  res: Response,
  result: ServiceResult<T>,
  successStatusCode?: number
): void => {
  if (result.error) {
    res.status(result.statusCode).json({
      error: result.error,
      statusCode: result.statusCode,
    });
    return;
  }

  res.status(successStatusCode ?? result.statusCode).json({ data: result.data });
};

export const asyncHandler =
  <
    P = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = ParsedQs,
    Locals extends Record<string, unknown> = Record<string, unknown>,
  >(
    handler: RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> =>
  (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
