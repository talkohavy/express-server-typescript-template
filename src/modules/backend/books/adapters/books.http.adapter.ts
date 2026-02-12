import { API_URLS } from '../../../../common/constants';
import { ServiceNames } from '../../../../configurations';
import type { CreateBookDto, UpdateBookDto } from '../../../books/services/interfaces/books.service.interface';
import type { Book, PaginatedBooksResponse } from '../../../books/types';
import type { HttpClient } from '../../logic/http-client';
import type { GetBooksParsedQuery } from '../types';
import type { IBooksAdapter } from './books.adapter.interface';

export class BooksHttpAdapter implements IBooksAdapter {
  constructor(private readonly httpClient: HttpClient) {}

  async getBooks(queryParams: GetBooksParsedQuery): Promise<PaginatedBooksResponse> {
    return this.httpClient.get<PaginatedBooksResponse>({
      serviceName: ServiceNames.Books,
      route: API_URLS.books,
      options: { queryParams },
    });
  }

  async getBookById(bookId: string): Promise<Book | null> {
    const route = `${API_URLS.books}/${bookId}`;
    return this.httpClient.get<Book | null>({
      serviceName: ServiceNames.Books,
      route,
    });
  }

  async createBook(data: CreateBookDto): Promise<Book> {
    return this.httpClient.post<Book>({
      serviceName: ServiceNames.Books,
      route: API_URLS.books,
      body: data,
    });
  }

  async updateBook(bookId: string, data: UpdateBookDto): Promise<Book | null> {
    const route = `${API_URLS.books}/${bookId}`;
    return this.httpClient.patch<Book | null>({
      serviceName: ServiceNames.Books,
      route,
      body: data,
    });
  }

  async deleteBook(bookId: string): Promise<{ message: string } | null> {
    const route = `${API_URLS.books}/${bookId}`;
    return this.httpClient.delete<{ message: string } | null>({
      serviceName: ServiceNames.Books,
      route,
    });
  }
}
