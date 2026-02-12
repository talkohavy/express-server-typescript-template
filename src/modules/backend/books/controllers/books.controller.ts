import { API_URLS, StatusCodes } from '../../../../common/constants';
import { joiBodyMiddleware } from '../../../../middlewares/joi-body.middleware';
import { joiQueryMiddleware } from '../../../../middlewares/joi-query.middleware';
import { createBookSchema } from './dto/createBookSchema.dto';
import { getBooksQuerySchema } from './dto/getBooksSchema.dto';
import { updateBookSchema } from './dto/updateBookSchema.dto';
import type { ControllerFactory } from '../../../../lib/lucky-server';
import type { IBooksAdapter } from '../adapters/books.adapter.interface';
import type { GetBooksParsedQuery } from '../types';
import type { Application, Request, Response } from 'express';

export class BooksController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly booksAdapter: IBooksAdapter,
  ) {}

  private createBook() {
    this.app.post(API_URLS.books, joiBodyMiddleware(createBookSchema), async (req: Request, res: Response) => {
      const { body } = req;

      this.app.logger.info(`POST ${API_URLS.books} - creating new book`);

      const newBook = await this.booksAdapter.createBook(body);

      res.status(StatusCodes.CREATED).json(newBook);
    });
  }

  private getBooks() {
    this.app.get(API_URLS.books, joiQueryMiddleware(getBooksQuerySchema), async (req: Request, res: Response) => {
      const queryParsed = req.queryParsed as GetBooksParsedQuery;

      this.app.logger.info(
        `GET ${API_URLS.books} - fetching books (page=${queryParsed.page}, limit=${queryParsed.limit})`,
      );

      const result = await this.booksAdapter.getBooks(queryParsed);

      res.json(result);
    });
  }

  private getBookById() {
    this.app.get(API_URLS.bookById, async (req: Request, res: Response) => {
      const { params } = req;

      this.app.logger.info(`GET ${API_URLS.bookById} - fetching book by ID`);

      const bookId = params.bookId!;

      const book = await this.booksAdapter.getBookById(bookId);

      if (!book) {
        this.app.logger.error('Book not found', bookId);

        return void res.status(StatusCodes.NOT_FOUND).json({ message: 'Book not found' });
      }

      res.json(book);
    });
  }

  private updateBook() {
    this.app.patch(API_URLS.bookById, joiBodyMiddleware(updateBookSchema), async (req: Request, res: Response) => {
      const { body, params } = req;

      this.app.logger.info(`PATCH ${API_URLS.bookById} - updating book by ID`);

      const bookId = params.bookId!;
      const updatedBook = await this.booksAdapter.updateBook(bookId, body);

      if (!updatedBook) {
        this.app.logger.error('Book not found', bookId);

        return void res.status(StatusCodes.NOT_FOUND).json({ message: 'Book not found' });
      }

      res.json(updatedBook);
    });
  }

  private deleteBook() {
    this.app.delete(API_URLS.bookById, async (req: Request, res: Response) => {
      const { params } = req;

      this.app.logger.info(`DELETE ${API_URLS.bookById} - deleting book by ID`);

      const bookId = params.bookId!;
      const deletedBook = await this.booksAdapter.deleteBook(bookId);

      if (!deletedBook) {
        this.app.logger.error('Book not found', bookId);

        return void res.status(StatusCodes.NOT_FOUND).json({ message: 'Book not found' });
      }

      res.json({ message: 'Book deleted successfully' });
    });
  }

  registerRoutes() {
    this.getBooks();
    this.getBookById();
    this.createBook();
    this.updateBook();
    this.deleteBook();
  }
}
