import type { Application } from 'express';

export function registerProcessHandlers(app: Application) {
  const onSignal = createSignalShutdownHandler(app);
  const onFatalError = createFatalErrorHandler(app);

  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  process.on('unhandledRejection', onFatalError);
  process.on('uncaughtException', onFatalError);
}

function createSignalShutdownHandler(app: Application) {
  const { logger } = app;

  let isShuttingDown = false;

  function logCleanupFailure(logProps: { message: string; error: unknown }) {
    const { message, error } = logProps;

    logger.error(message, { error });
  }

  return async function onSignal() {
    if (isShuttingDown) return;

    isShuttingDown = true;

    logger.log('Shutting down gracefully...');

    await cleanupTopicSubscriber({
      app,
      failureMessage: 'Redis WS cleanup failed during graceful shutdown',
      logFailure: logCleanupFailure,
    });

    logger.log('Cleanup finished');

    process.exit(0);
  };
}

function createFatalErrorHandler(app: Application) {
  function logCleanupFailure(logProps: { message: string; error: unknown }) {
    const { message, error } = logProps;

    console.error(message, { error });
  }

  return async function onFatalError(reason: unknown) {
    console.error('Unhandled rejection or uncaught exception', { reason });
    console.error('Should not get here! You are missing a try/catch somewhere.');

    await cleanupTopicSubscriber({
      app,
      failureMessage: 'Redis WS cleanup failed during unexpected shutdown',
      logFailure: logCleanupFailure,
    });

    process.exit(1);
  };
}

async function cleanupTopicSubscriber(props: {
  app: Application;
  failureMessage: string;
  logFailure: (logProps: { message: string; error: unknown }) => void;
}) {
  const { app, failureMessage, logFailure } = props;
  const { topicSubscriber } = app;

  try {
    await topicSubscriber.cleanup();
  } catch (error) {
    logFailure({ message: failureMessage, error });
  }
}
