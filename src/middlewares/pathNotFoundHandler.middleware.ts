import type { Application, Request, Response } from 'express';

export function pathNotFoundHandler(app: Application) {
  app.use(pathNotFoundMiddleware);
}

function pathNotFoundMiddleware(req: Request, _res: Response, next: any) {
  console.error('req.originalUrl is:', req.originalUrl);
  console.error('req.path is:', req.path);
  console.error('req.url is:', req.url);
  console.error('req.body is:', req.body);
  console.error('req.params is:', req.params);
  next();
}
