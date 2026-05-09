import { createPipeline } from './createPipeline';

describe('createPipeline', () => {
  describe('guard: fewer than 2 functions', () => {
    it('throws when the middlewares array is empty', () => {
      expect(() => createPipeline([])).toThrow('createPipeline requires at least 2 functions.');
    });

    it('throws when the middlewares array has only 1 function', () => {
      expect(() => createPipeline([async (_next) => {}])).toThrow('createPipeline requires at least 2 functions.');
    });
  });

  describe('middleware chain: execution order', () => {
    it('runs middlewares in order when each calls next', async () => {
      const order: number[] = [];

      const handler = createPipeline([
        async (_arg, next) => {
          order.push(1);
          next();
        },
        async (_arg, next) => {
          order.push(2);
          next();
        },
        (_arg, _next) => {
          order.push(3);
        },
      ]);

      await handler('arg');

      expect(order).toEqual([1, 2, 3]);
    });

    it('propagates args unchanged through the entire chain', async () => {
      const seen: string[] = [];

      const handler = createPipeline([
        async (val, next) => {
          seen.push(`mw1:${val}`);
          next();
        },
        async (val, next) => {
          seen.push(`mw2:${val}`);
          next();
        },
        async (val, _next) => {
          seen.push(`mw3:${val}`);
        },
      ]);

      await handler('hello');

      expect(seen).toEqual(['mw1:hello', 'mw2:hello', 'mw3:hello']);
    });
  });

  describe('middleware chain: short-circuiting', () => {
    it('stops the chain when a middleware does not call next', async () => {
      const order: number[] = [];

      const handler = createPipeline([
        async (_next) => {
          order.push(1);
          // intentionally does not call next
        },
        async (_next) => {
          order.push(2);
        },
      ]);

      await handler();

      expect(order).toEqual([1]);
    });

    it('stops at the middle of a three-middleware chain when the first does not call next', async () => {
      const order: number[] = [];

      const handler = createPipeline([
        async (_next) => {
          order.push(1);
        },
        async (next) => {
          order.push(2);
          next();
        },
        async (_next) => {
          order.push(3);
        },
      ]);

      await handler();

      expect(order).toEqual([1]);
    });
  });

  describe('async behaviour', () => {
    it('awaits async middlewares before running the next one', async () => {
      const order: string[] = [];

      const handler = createPipeline([
        async (next) => {
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
          order.push('mw1-done');
          next();
        },
        async (_next) => {
          order.push('mw2-done');
        },
      ]);

      await handler();

      expect(order).toEqual(['mw1-done', 'mw2-done']);
    });

    it('awaits the terminal handler even if it is async', async () => {
      let finished = false;

      const handler = createPipeline([
        async (next) => {
          next();
        },
        async (_next) => {
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
          finished = true;
        },
      ]);

      await handler();

      expect(finished).toBe(true);
    });
  });

  describe('return value', () => {
    it('returns a function', () => {
      const result = createPipeline([
        async (next) => {
          next();
        },
        async (_next) => {},
      ]);
      expect(typeof result).toBe('function');
    });

    it('the composed handler returns a Promise', () => {
      const handler = createPipeline([
        async (next) => {
          next();
        },
        async (_next) => {},
      ]);
      const result = handler();
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
