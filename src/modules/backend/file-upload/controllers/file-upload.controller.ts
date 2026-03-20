import { API_PATHS, StatusCodes } from '../../../../common/constants';
import type { ControllerFactory } from '../../../../lib/lucky-server';
import type { IFileUploadAdapter } from '../adapters/file-upload.adapter.interface';
import type { Application, Request, Response } from 'express';

export class FileUploadController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly fileUploadAdapter: IFileUploadAdapter,
  ) {}

  registerRoutes() {
    this.uploadFileMultipart();
    this.uploadFileBinary();
  }

  private uploadFileMultipart() {
    this.app.post(API_PATHS.uploadFileMultipart, async (req: Request, res: Response) => {
      this.app.logger.info(`POST ${API_PATHS.uploadFileMultipart} - uploading file`);

      const result = await this.fileUploadAdapter.handleMultipartUpload(req);

      res.status(StatusCodes.OK).json(result);
    });
  }

  private uploadFileBinary() {
    this.app.post(API_PATHS.uploadFileBinary, async (req: Request, res: Response) => {
      this.app.logger.info(`POST ${API_PATHS.uploadFileBinary} - uploading file`);

      const result = await this.fileUploadAdapter.handleBinaryUpload(req);

      res.status(StatusCodes.OK).json(result);
    });
  }
}
