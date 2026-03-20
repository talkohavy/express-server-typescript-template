import express, { type Application } from 'express';
import request from 'supertest';
import { API_PATHS, StatusCodes } from '../../common/constants';
import { FileUploadController } from './file-upload.controller';
import type { FileUploadService } from './services/file-upload.service';

describe('FileUploadController', () => {
  let app: Application;
  let mockFileUploadService: jest.Mocked<FileUploadService>;

  beforeEach(() => {
    app = express() as unknown as Application;

    app.logger = {
      info: jest.fn(),
    } as any;

    mockFileUploadService = {
      handleMultipartUpload: jest.fn(),
      handleBinaryUpload: jest.fn(),
    } as any;

    const controller = new FileUploadController(app, mockFileUploadService);
    controller.registerRoutes();
  });

  describe('uploadFileMultipart', () => {
    it('should upload file using multipart and return success', async () => {
      const mockResult = {
        message: 'Files uploaded successfully',
        metadata: [
          { filename: 'test.pdf', fileType: 'application/pdf', uploadPath: '/path', uploadTimestamp: '2025-12-10' },
        ],
      };

      mockFileUploadService.handleMultipartUpload.mockResolvedValue(mockResult);

      const response = await request(app)
        .post(API_PATHS.uploadFileMultipart)
        .set('Content-Type', 'multipart/form-data; boundary=test');

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual(mockResult);
      expect(mockFileUploadService.handleMultipartUpload).toHaveBeenCalledWith(expect.any(Object));
      expect(app.logger.info).toHaveBeenCalledWith(`POST ${API_PATHS.uploadFileMultipart} - uploading file`);
    });
  });

  describe('uploadFileBinary', () => {
    it('should upload file using binary and return success', async () => {
      const mockResult = {
        message: 'File uploaded successfully',
        metadata: {
          filename: 'test.pdf',
          fileType: 'application/pdf',
          uploadPath: '/path',
          uploadTimestamp: '2025-12-10',
        },
      };

      mockFileUploadService.handleBinaryUpload.mockResolvedValue(mockResult);

      const response = await request(app)
        .post(API_PATHS.uploadFileBinary)
        .set('Content-Type', 'application/pdf')
        .send('binary data');

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual(mockResult);
      expect(mockFileUploadService.handleBinaryUpload).toHaveBeenCalledWith(expect.any(Object));
      expect(app.logger.info).toHaveBeenCalledWith(`POST ${API_PATHS.uploadFileBinary} - uploading file`);
    });
  });
});
