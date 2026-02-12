import {
  addIdParamToPath,
  addPaginationParams,
  addRequestBody,
  createApiRoute,
  createSwaggerApiDocs,
} from 'api-opener';
import { API_URLS } from '../../../../common/constants';
import { AbstractSwaggerConfig } from '../../logic/swagger.abstract.config';
import { BOOK_REFS, definitions } from './books.ref';

export class BooksSwaggerConfig extends AbstractSwaggerConfig {
  constructor() {
    super('Books');

    this.docs = createSwaggerApiDocs({
      title: 'LuckyLove: books-service',
      baseUrl: 'http://localhost:8000',
      definitions,
      routes: [
        // ##################
        // ---- Get Many ----
        // ##################
        createApiRoute({
          method: 'get',
          route: API_URLS.books,
          summary: 'Find books with pagination (supports infinite scroll)',
          parameters: addPaginationParams({
            style: 'page-limit',
            limitConfig: { defaultValue: 20, minimum: 1, maximum: 100 },
          }),
          responses: {
            '200': {
              description: 'Paginated books fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: BOOK_REFS.paginatedBooks },
                },
                'application/x-www-form-urlencoded': {},
              },
            },
          },
        }),
        // #################
        // ---- Get One ----
        // #################
        createApiRoute({
          method: 'get',
          route: '/api/books/{id}',
          summary: 'Find books by query params',
          operationId: 'single-book',
          parameters: [addIdParamToPath()],
          responses: {
            '200': {
              description: 'Book fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: BOOK_REFS.book },
                },
                'application/x-www-form-urlencoded': {},
              },
            },
          },
        }),
        // ####################
        // ---- Create One ----
        // ####################
        createApiRoute({
          method: 'post',
          route: API_URLS.books,
          summary: 'Create new book in db',
          operationId: 'create-book',
          requestBody: addRequestBody({
            refString: BOOK_REFS.book,
            isRequired: true,
          }),
        }),
        // ####################
        // ---- Update One ----
        // ####################
        createApiRoute({
          method: 'patch',
          route: '/api/books/{id}',
          summary: 'Update book by ID',
          operationId: 'update-book',
          parameters: [addIdParamToPath()],
          responses: {
            '200': {
              description: 'Book updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: BOOK_REFS.book },
                },
                'application/x-www-form-urlencoded': {},
              },
            },
          },
        }),
        // ####################
        // ---- Delete One ----
        // ####################
        createApiRoute({
          method: 'delete',
          route: '/api/books/{id}',
          summary: 'Delete book by ID',
          operationId: 'delete-book',
          parameters: [
            addIdParamToPath(),
            {
              in: 'header',
              name: 'bookId',
              description: 'Token bookId header',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Book deleted successfully',
            },
          },
        }),
      ],
    });
  }
}
