import { COLORS } from 'color-my-json';
import { ConfigKeys } from '../../configurations';
import { buildApp } from './backend.app';

export async function startServer() {
  const app = await buildApp();

  const PORT = app.configService.get<number>(ConfigKeys.Port);

  app.listen(PORT, () => app.logger.log(`server started on port ${PORT}`));
  console.log(`${COLORS.green}Open in browser: ${COLORS.blue}http://localhost:${PORT}${COLORS.stop}`);
}

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', { err });
  console.error('Should not get here!  You are missing a try/catch somewhere.');
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', { err });
  console.error('Should not get here! You are missing a try/catch somewhere.');
});

startServer();
