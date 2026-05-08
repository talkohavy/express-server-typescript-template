import { API_PATHS, StatusCodes } from '@src/common/constants';
import type { FileUploadService } from './services/file-upload.service';
import type { ControllerFactory } from '@src/lib/lucky-server';
import type { Application, Request, Response } from 'express';

export class FileUploadController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly fileUploadService: FileUploadService,
  ) {}

  registerRoutes() {
    this.uploadFileMultipart();
    this.uploadFileBinary();
  }

  private uploadFileMultipart() {
    this.app.post(API_PATHS.uploadFileMultipart, async (req: Request, res: Response) => {
      this.app.logger.info(`POST ${API_PATHS.uploadFileMultipart} - uploading file`);

      const result = await this.fileUploadService.handleMultipartUpload(req);

      res.status(StatusCodes.OK).json(result);
    });
  }

  private uploadFileBinary() {
    this.app.post(API_PATHS.uploadFileBinary, async (req: Request, res: Response) => {
      this.app.logger.info(`POST ${API_PATHS.uploadFileBinary} - uploading file`);

      const result = await this.fileUploadService.handleBinaryUpload(req);

      res.status(StatusCodes.OK).json(result);
    });
  }
}
