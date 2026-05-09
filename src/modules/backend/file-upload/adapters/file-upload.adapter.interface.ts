import type { Request } from 'express';
import type { UploadResult } from '../../../file-upload/types';

export interface IFileUploadAdapter {
  handleMultipartUpload(req: Request): Promise<UploadResult>;
  handleBinaryUpload(req: Request): Promise<UploadResult>;
}
