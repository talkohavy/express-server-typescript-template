import { matchPath } from './path-matcher';

describe('matchPath', () => {
  it('matches exact path without params', () => {
    const expectedResult = {};
    const actualResult = matchPath('/api/users', '/api/users');
    expect(actualResult).toEqual(expectedResult);
  });

  it('returns null when path lengths differ', () => {
    const actualResult = matchPath('/api/users/:userId', '/api/users');
    expect(actualResult).toBeNull();
  });

  it('extracts single param', () => {
    const expectedResult = { userId: '123' };
    const actualResult = matchPath('/api/users/:userId', '/api/users/123');
    expect(actualResult).toEqual(expectedResult);
  });

  it('extracts multiple params', () => {
    const expectedResult = { userId: '1', bookId: '42' };
    const actualResult = matchPath('/api/users/:userId/books/:bookId', '/api/users/1/books/42');
    expect(actualResult).toEqual(expectedResult);
  });

  it('returns null when static segment mismatch', () => {
    const actualResult = matchPath('/api/users/:userId', '/api/books/123');
    expect(actualResult).toBeNull();
  });
});
