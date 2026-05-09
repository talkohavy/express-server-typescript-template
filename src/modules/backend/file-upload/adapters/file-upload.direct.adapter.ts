import type { Request } from 'express';
import type { FileUploadService } from '../../../file-upload/services/file-upload.service';
import type { UploadResult } from '../../../file-upload/types';
import type { IFileUploadAdapter } from './file-upload.adapter.interface';

export class FileUploadDirectAdapter implements IFileUploadAdapter {
  constructor(private readonly fileUploadService: FileUploadService) {}

  async handleMultipartUpload(req: Request): Promise<UploadResult> {
    return this.fileUploadService.handleMultipartUpload(req);
  }

  async handleBinaryUpload(req: Request): Promise<UploadResult> {
    return this.fileUploadService.handleBinaryUpload(req);
  }
}
