import type { BooksService } from '../../../books/services/books.service';
import type { CreateBookDto, UpdateBookDto } from '../../../books/services/interfaces/books.service.interface';
import type { Book, PaginatedBooksResponse } from '../../../books/types';
import type { GetBooksParsedQuery } from '../types';
import type { IBooksAdapter } from './books.adapter.interface';

export class BooksDirectAdapter implements IBooksAdapter {
  constructor(private readonly booksService: BooksService) {}

  async getBooks(query: GetBooksParsedQuery): Promise<PaginatedBooksResponse> {
    return this.booksService.getBooks(query);
  }

  async getBookById(bookId: string): Promise<Book | null> {
    return this.booksService.getBookById(bookId);
  }

  async createBook(data: CreateBookDto): Promise<Book> {
    return this.booksService.createBook(data);
  }

  async updateBook(bookId: string, data: UpdateBookDto): Promise<Book | null> {
    return this.booksService.updateBook(bookId, data);
  }

  async deleteBook(bookId: string): Promise<{ message: string } | null> {
    return this.booksService.deleteBook(bookId);
  }
}
