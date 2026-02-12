import type { CreateBookDto, UpdateBookDto } from '../../../books/services/interfaces/books.service.interface';
import type { Book, PaginatedBooksResponse } from '../../../books/types';
import type { GetBooksParsedQuery } from '../types';

export interface IBooksAdapter {
  getBooks(query: GetBooksParsedQuery): Promise<PaginatedBooksResponse>;
  getBookById(bookId: string): Promise<Book | null>;
  createBook(data: CreateBookDto): Promise<Book>;
  updateBook(bookId: string, data: UpdateBookDto): Promise<Book | null>;
  deleteBook(bookId: string): Promise<{ message: string } | null>;
}
