import { DEFAULT_MOCK_BOOKS_COUNT, generateMockBooks } from './mock-books.generator';
import type { Book, PaginatedBooksResponse } from '../types';
import type { CreateBookDto, UpdateBookDto } from './interfaces/books.service.interface';

const database: Array<Book> = generateMockBooks(DEFAULT_MOCK_BOOKS_COUNT);

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class BooksService {
  constructor() {}

  async getBooks(options?: { page?: number; limit?: number }): Promise<PaginatedBooksResponse> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, options?.limit ?? DEFAULT_LIMIT));
    const offset = (page - 1) * limit;
    const total = database.length;
    const totalPages = Math.ceil(total / limit);
    const data = database.slice(offset, offset + limit);
    const hasMore = page < totalPages;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };
  }

  async getBookById(userId: string): Promise<Book | null> {
    const book = database.find((book) => book.id === Number.parseInt(userId, 10));

    if (!book) return null;

    return book;
  }

  async createBook(book: CreateBookDto): Promise<Book> {
    const now = new Date().toISOString();

    const newBook: Book = {
      id: database.length > 0 ? Math.max(...database.map((b) => b.id)) + 1 : 1,
      name: book.name,
      author: book.author,
      publishedYear: book.publishedYear,
      genre: book.genre ?? 'Fiction',
      isbn: book.isbn ?? `978-${String(Date.now()).slice(-9)}-0`,
      coverImageUrl: book.coverImageUrl ?? 'https://picsum.photos/seed/new/300/450',
      description: book.description ?? '',
      pageCount: book.pageCount ?? 0,
      rating: book.rating ?? 0,
      language: book.language ?? 'English',
      publisher: book.publisher ?? 'Unknown',
      createdAt: now,
    };

    database.push(newBook);

    return newBook;
  }

  async updateBook(userId: string, user: UpdateBookDto): Promise<Book | null> {
    const parsedId = Number.parseInt(userId, 10);
    const bookIndex = database.findIndex((book) => book.id === parsedId);

    if (bookIndex === -1) return null;

    database[bookIndex] = { ...database[bookIndex], ...user } as Book;

    return database[bookIndex];
  }

  async deleteBook(userId: string) {
    const parsedId = Number.parseInt(userId, 10);
    const bookIndex = database.findIndex((book) => book.id === parsedId);

    if (bookIndex === -1) return null;

    database.splice(bookIndex, 1);

    return { message: 'Book deleted successfully' };
  }
}
