import type { CreateBookDto, UpdateBookDto } from '../../../books/services/interfaces/books.service.interface';
import type { Book, PaginatedBooksResponse } from '../../../books/types';

export interface IBooksAdapter {
  getBooks(options?: { page?: number; limit?: number }): Promise<PaginatedBooksResponse>;
  getBookById(bookId: string): Promise<Book | null>;
  createBook(data: CreateBookDto): Promise<Book>;
  updateBook(bookId: string, data: UpdateBookDto): Promise<Book | null>;
  deleteBook(bookId: string): Promise<{ message: string } | null>;
}
