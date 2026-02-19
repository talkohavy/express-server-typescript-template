import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './services/file-upload.service';
import type { Application } from 'express';

export class FileUploadModule {
  private fileUploadService!: FileUploadService;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    this.fileUploadService = new FileUploadService();

    // Only attach routes if running as a standalone micro-service
    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      this.attachControllers(this.app);
    }
  }

  private attachControllers(app: Application): void {
    const controller = new FileUploadController(app, this.fileUploadService);

    controller.registerRoutes();
  }

  get services() {
    return {
      fileUploadService: this.fileUploadService,
    };
  }
}
