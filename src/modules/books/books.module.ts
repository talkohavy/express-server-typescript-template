import { BooksController } from './controllers/books.controller';
import { BooksMiddleware } from './middleware/books.middleware';
import { BooksService } from './services/books.service';
import type { Application } from 'express';

export class BooksModule {
  private booksService!: BooksService;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    this.booksService = new BooksService();

    // Only attach routes if running as a standalone micro-service
    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      this.attachControllers(this.app);
    }
  }

  private attachControllers(app: Application): void {
    const booksController = new BooksController(app, this.booksService);
    const booksMiddleware = new BooksMiddleware(app);

    booksMiddleware.use();

    booksController.registerRoutes();
  }

  get services() {
    return {
      booksService: this.booksService,
    };
  }
}
