import { BookObject } from './book.object';
import { PaginatedBooksObject } from './paginated-books.object';

export const definitions = {
  Book: BookObject,
  PaginatedBooks: PaginatedBooksObject,
};

export const BOOK_REFS = {
  book: '#/components/schemas/Book',
  paginatedBooks: '#/components/schemas/PaginatedBooks',
};
