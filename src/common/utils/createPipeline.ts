export function createPipeline(middlewares: any[]) {
  if (middlewares.length < 2) {
    throw new Error('createPipeline requires at least 2 functions.');
  }

  const lastMiddleware = middlewares[middlewares.length - 1]!;

  let composedHandler = async (...args: any) => {
    await lastMiddleware(...args, () => {});
  };

  for (let i = middlewares.length - 2; i >= 0; i--) {
    const middleware = middlewares[i]!;

    const next = composedHandler;

    composedHandler = async (...args: any) => {
      let nextPromise: Promise<void> | undefined;

      await middleware(...args, () => {
        nextPromise = next(...args);
      });

      if (nextPromise !== undefined) {
        await nextPromise;
      }
    };
  }

  return composedHandler;
}
