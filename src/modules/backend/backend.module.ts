import { API_URLS } from '@src/common/constants';
import { PermissionCheckerService } from '@src/lib/permissions';
import { HealthCheckController } from '../health-check/health-check.controller';
import { buildUsersPermissionRules } from '../users/permissions/users.permissions';
import { AuthDirectAdapter, AuthHttpAdapter, AuthenticationController, type IAuthAdapter } from './authentication';
import { BooksDirectAdapter, BooksHttpAdapter, BooksController, type IBooksAdapter } from './books';
import { DragonsController } from './dragons';
import { DragonsDirectAdapter, DragonsHttpAdapter, type IDragonsAdapter } from './dragons';
import {
  FileUploadDirectAdapter,
  FileUploadHttpAdapter,
  FileUploadController,
  type IFileUploadAdapter,
} from './file-upload';
import { HttpClient } from './logic/http-client';
import { createAttachUserFromTokenMiddleware } from './middlewares/attach-user-from-token.middleware';
import {
  UsersDirectAdapter,
  UsersHttpAdapter,
  UsersCrudController,
  UserUtilitiesController,
  type IUsersAdapter,
} from './users';
import type { Application } from 'express';

/**
 * BackendModule serves as the BFF (Backend-For-Frontend).
 * It owns ALL public-facing routes and orchestrates communication with domain modules.
 *
 * In monolith mode: Uses direct adapters that call module services directly.
 * In micro-services mode: Uses HTTP adapters that make HTTP calls to other services.
 */
export class BackendModule {
  private usersAdapter!: IUsersAdapter;
  private authAdapter!: IAuthAdapter;
  private booksAdapter!: IBooksAdapter;
  private dragonsAdapter!: IDragonsAdapter;
  private fileUploadAdapter!: IFileUploadAdapter;
  private permissionCheckerService!: PermissionCheckerService;

  constructor(private readonly app: Application) {
    this.initializeAdapters();
    this.attachControllers();
  }

  private initializeAdapters(): void {
    const config = { rules: buildUsersPermissionRules() };

    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      // HTTP adapters for micro-services communication
      const httpClient = new HttpClient(this.app.configService);
      this.usersAdapter = new UsersHttpAdapter(httpClient);
      this.authAdapter = new AuthHttpAdapter(httpClient);
      this.booksAdapter = new BooksHttpAdapter(httpClient);
      this.dragonsAdapter = new DragonsHttpAdapter(httpClient);
      this.fileUploadAdapter = new FileUploadHttpAdapter(httpClient);
    } else {
      // Direct adapters wrapping module services (monolith mode)
      this.permissionCheckerService = new PermissionCheckerService(config);

      const { usersCrudService, userUtilitiesService } = this.app.modules.UsersModule.services;
      const { passwordManagementService, tokenGenerationService, tokenVerificationService } =
        this.app.modules.AuthenticationModule.services;
      const { booksService } = this.app.modules.BooksModule.services;
      const { dragonsService } = this.app.modules.DragonsModule.services;
      const { fileUploadService } = this.app.modules.FileUploadModule.services;

      this.usersAdapter = new UsersDirectAdapter(usersCrudService, userUtilitiesService);
      this.authAdapter = new AuthDirectAdapter(
        passwordManagementService,
        tokenGenerationService,
        tokenVerificationService,
      );
      this.booksAdapter = new BooksDirectAdapter(booksService);
      this.dragonsAdapter = new DragonsDirectAdapter(dragonsService);
      this.fileUploadAdapter = new FileUploadDirectAdapter(fileUploadService);
    }
  }

  private attachControllers(): void {
    // BackendModule ALWAYS attaches public routes (it's the BFF)
    const healthCheckController = new HealthCheckController(this.app);
    const authController = new AuthenticationController(this.app, this.authAdapter, this.usersAdapter);
    const usersCrudController = new UsersCrudController(this.app, this.usersAdapter, this.permissionCheckerService);
    const userUtilitiesController = new UserUtilitiesController(this.app, this.usersAdapter, this.authAdapter);
    const booksController = new BooksController(this.app, this.booksAdapter);
    const dragonsController = new DragonsController(this.app, this.dragonsAdapter);
    const fileUploadController = new FileUploadController(this.app, this.fileUploadAdapter);

    healthCheckController.registerRoutes();
    authController.registerRoutes();
    usersCrudController.registerRoutes();
    userUtilitiesController.registerRoutes();
    booksController.registerRoutes();
    dragonsController.registerRoutes();
    fileUploadController.registerRoutes();
  }
}
