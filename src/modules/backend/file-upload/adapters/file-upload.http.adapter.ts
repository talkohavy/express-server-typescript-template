import { API_PATHS } from '../../../../common/constants';
import { ServiceNames } from '../../../../configurations';
import type { UploadResult } from '../../../file-upload/types';
import type { HttpClient } from '../../logic/http-client';
import type { IFileUploadAdapter } from './file-upload.adapter.interface';
import type { Request } from 'express';

export class FileUploadHttpAdapter implements IFileUploadAdapter {
  constructor(private readonly httpClient: HttpClient) {}

  async handleMultipartUpload(_req: Request): Promise<UploadResult> {
    // Note: In micro-services mode, we'd forward the request to the FileUpload service.
    // However, streaming multipart data over HTTP requires special handling (proxy/passthrough).
    // For now, this is a placeholder - the actual implementation would need to:
    // 1. Either proxy the raw request stream to the FileUpload service
    // 2. Or buffer the file and re-send it
    return this.httpClient.post<UploadResult>({
      serviceName: ServiceNames.FileUpload,
      route: API_PATHS.uploadFileMultipart,
      body: {},
    });
  }

  async handleBinaryUpload(_req: Request): Promise<UploadResult> {
    // Note: Similar to multipart - binary upload streaming requires special handling.
    return this.httpClient.post<UploadResult>({
      serviceName: ServiceNames.FileUpload,
      route: API_PATHS.uploadFileBinary,
      body: {},
    });
  }
}
