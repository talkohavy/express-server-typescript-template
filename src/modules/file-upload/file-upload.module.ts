import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './services/file-upload.service';
import type { ModuleFactory } from '@src/lib/lucky-server';
import type { Application } from 'express';

export class FileUploadModule implements ModuleFactory {
  private fileUploadService!: FileUploadService;

  constructor(private readonly app: Application) {}

  async init(): Promise<void> {
    this.fileUploadService = new FileUploadService();

    // Only attach routes if running as a standalone micro-service
    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      this.attachControllers();
    }
  }

  private attachControllers(): void {
    const controller = new FileUploadController(this.app, this.fileUploadService);

    controller.registerRoutes();
  }

  get services() {
    return {
      fileUploadService: this.fileUploadService,
    };
  }
}
