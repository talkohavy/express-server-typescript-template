import { API_URLS, StatusCodes } from '../../common/constants';
import type { ControllerFactory } from '../../lib/lucky-server';
import type { FileUploadService } from './services/file-upload.service';
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
    this.app.post(API_URLS.uploadFileMultipart, async (req: Request, res: Response) => {
      this.app.logger.info(`POST ${API_URLS.uploadFileMultipart} - uploading file`);

      const result = await this.fileUploadService.handleMultipartUpload(req);

      res.status(StatusCodes.OK).json(result);
    });
  }

  private uploadFileBinary() {
    this.app.post(API_URLS.uploadFileBinary, async (req: Request, res: Response) => {
      this.app.logger.info(`POST ${API_URLS.uploadFileBinary} - uploading file`);

      const result = await this.fileUploadService.handleBinaryUpload(req);

      res.status(StatusCodes.OK).json(result);
    });
  }
}
