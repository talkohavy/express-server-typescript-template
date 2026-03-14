import { Server, ServerCredentials } from '@grpc/grpc-js';
import { ConfigKeys } from '../types';
import { buildBooksGrpcApp } from './books-grpc.app';

startServer();

export async function startServer() {
  const app = new Server();

  await buildBooksGrpcApp(app);

  const { configService, logger } = app;

  const port = configService.get<number>(ConfigKeys.Port);

  await new Promise((resolve, reject) => {
    app.bindAsync(`0.0.0.0:${port}`, ServerCredentials.createInsecure(), (err, port) => {
      if (err) {
        reject(err);
      } else {
        resolve(port);
      }
    });
  });

  logger.log(`gRPC server started on port ${port}`);
}

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', { err });
  console.error('Should not get here!  You are missing a try/catch somewhere.');
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', { err });
  console.error('Should not get here! You are missing a try/catch somewhere.');
});
